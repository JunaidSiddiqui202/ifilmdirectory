// Video Call Service for Auditions
// Audit 2 (A2-08): Privileged Daily.co Management API key removed from frontend client bundle.
// Management calls (creating rooms, tokens, deleting rooms) must be performed via a protected server-side endpoint.

interface VideoCallRoom {
    url: string;
    createdAt: string;
    expiresAt: string;
}

class VideoCallService {
    // Dormant feature stub - server proxy required before enabling in production UI
    async createRoom(): Promise<VideoCallRoom> {
        throw new Error('[VideoCall] Daily.co room management must be invoked via backend endpoint. Client-side management key is disabled for security.');
    }

    async getRoom() {
        throw new Error('[VideoCall] Daily.co room management must be invoked via backend endpoint.');
    }

    async deleteRoom() {
        throw new Error('[VideoCall] Daily.co room management must be invoked via backend endpoint.');
    }

    async createMeetingToken(): Promise<string> {
        throw new Error('[VideoCall] Daily.co meeting token issuance must be invoked via backend endpoint.');
    }

    async getRecordings() {
        throw new Error('[VideoCall] Daily.co recording access must be invoked via backend endpoint.');
    }

    getRoomUrl(roomName: string, token?: string): string {
        const baseUrl = `https://ifilmdirectory.daily.co/${roomName}`;
        return token ? `${baseUrl}?t=${token}` : baseUrl;
    }
}

export const videoCallService = new VideoCallService();
