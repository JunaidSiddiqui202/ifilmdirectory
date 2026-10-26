// Video Call Component for Auditions

import { useState, useEffect, useRef, useCallback } from 'react';
import { videoCallService } from '../services/videoCallService';

interface VideoCallProps {
    roomName: string;
    userName: string;
    isHost?: boolean;
    onLeave?: () => void;
    onError?: (error: Error) => void;
}

export const VideoCall = ({ roomName, userName, isHost = false, onLeave, onError }: VideoCallProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomUrl, setRoomUrl] = useState<string>('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const initializeCall = useCallback(async () => {
        try {
            // Create meeting token
            const token = await videoCallService.createMeetingToken();

            // Get room URL with token
            const url = videoCallService.getRoomUrl(roomName, token);
            setRoomUrl(url);
            setIsLoading(false);
        } catch (err) {
            const error = err as Error;
            setError(error.message);
            setIsLoading(false);
            onError?.(error);
        }
    }, [onError, roomName]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await initializeCall();
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [initializeCall]);

    // Reference props to keep contract intact for future activation
    if (userName && isHost) {
        // Preserved parameter contract
    }

    const handleLeave = () => {
        onLeave?.();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Connecting to audition...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center max-w-md p-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={initializeCall}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen bg-gray-900">
            {/* Video iframe */}
            <iframe
                ref={iframeRef}
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
            />

            {/* Leave button overlay */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={handleLeave}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">call_end</span>
                    Leave Call
                </button>
            </div>
        </div>
    );
};

// Audition Scheduler Component
export const AuditionScheduler = ({
    applicantName,
}: {
    jobId?: string;
    applicantId?: string;
    applicantName: string;
    onScheduled?: (roomUrl: string) => void;
}) => {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs font-medium cursor-not-allowed border border-zinc-200 dark:border-zinc-700">
            <span className="material-symbols-outlined text-sm">videocam_off</span>
            <span>Video Auditions (Under Integration for {applicantName})</span>
        </div>
    );
};

export default VideoCall;
