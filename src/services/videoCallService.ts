// Video Call Service for Auditions using Daily.co
// Free tier: 10,000 minutes/month

interface VideoCallRoom {
    url: string;
    // roomName: string;
    createdAt: string;
    expiresAt: string;
}

class VideoCallService {
    private apiKey: string;
    private baseUrl = 'https://api.daily.co/v1';

    constructor() {
        this.apiKey = import.meta.env.VITE_DAILY_API_KEY || '';
    }

    // Create a video call room
    async createRoom(config: {
        name?: string;
        privacy?: 'public' | 'private';
        maxParticipants?: number;
        expiresInMinutes?: number;
    }): Promise<VideoCallRoom> {
        try {
            const response = await fetch(`${this.baseUrl}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    name: config.name || `audition-${Date.now()}`,
                    privacy: config.privacy || 'private',
                    properties: {
                        max_participants: config.maxParticipants || 10,
                        enable_screenshare: true,
                        enable_chat: true,
                        enable_knocking: true,
                        enable_recording: 'cloud', // Auto-record auditions
                        exp: config.expiresInMinutes
                            ? Math.floor(Date.now() / 1000) + config.expiresInMinutes * 60
                            : Math.floor(Date.now() / 1000) + 3600, // 1 hour default
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const data = await response.json();

            return {
                url: data.url,
                // roomName: data.name,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(data.config.exp * 1000).toISOString(),
            };
        } catch (error) {
            console.error('[VideoCall] Error creating room:', error);
            throw error;
        }
    }

    // Get room details
    async getRoom(roomName: string) {
        try {
            const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Room not found');
            }

            return await response.json();
        } catch (error) {
            console.error('[VideoCall] Error getting room:', error);
            throw error;
        }
    }

    // Delete a room
    async deleteRoom(roomName: string) {
        try {
            const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete room');
            }

            return true;
        } catch (error) {
            console.error('[VideoCall] Error deleting room:', error);
            throw error;
        }
    }

    // Create meeting token (for private rooms)
    async createMeetingToken(roomName: string, userName: string, isHost: boolean = false) {
        try {
            const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    properties: {
                        room_name: roomName,
                        user_name: userName,
                        is_owner: isHost,
                        enable_screenshare: true,
                        enable_recording: isHost ? 'cloud' : false,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create meeting token');
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('[VideoCall] Error creating token:', error);
            throw error;
        }
    }

    // Get recordings for a room
    async getRecordings(roomName: string) {
        try {
            const response = await fetch(`${this.baseUrl}/recordings?room_name=${roomName}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get recordings');
            }

            return await response.json();
        } catch (error) {
            console.error('[VideoCall] Error getting recordings:', error);
            throw error;
        }
    }

    // Generate room URL with token
    getRoomUrl(roomName: string, token?: string): string {
        const baseUrl = `https://ifilmdirectory.daily.co/${roomName}`;
        return token ? `${baseUrl}?t=${token}` : baseUrl;
    }
}

export const videoCallService = new VideoCallService();

// Usage example:
/*
// Create a room for audition
const room = await videoCallService.createRoom({
  name: 'audition-actor-123',
  privacy: 'private',
  maxParticipants: 5,
  expiresInMinutes: 120, // 2 hours
});

// Create tokens for participants
const hostToken = await videoCallService.createMeetingToken(room.roomName, 'Director Name', true);
const actorToken = await videoCallService.createMeetingToken(room.roomName, 'Actor Name', false);

// Get URLs
const hostUrl = videoCallService.getRoomUrl(room.roomName, hostToken);
const actorUrl = videoCallService.getRoomUrl(room.roomName, actorToken);

// Later, get recordings
const recordings = await videoCallService.getRecordings(room.roomName);
*/

export default videoCallService;
