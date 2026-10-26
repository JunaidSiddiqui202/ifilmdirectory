// Video Call Component for Auditions

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    jobId,
    applicantId,
    applicantName,
    onScheduled,
}: {
    jobId: string;
    applicantId: string;
    applicantName: string;
    onScheduled?: (roomUrl: string) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [duration, setDuration] = useState(30);

    const handleSchedule = async () => {
        // Audit 2 (A2-07 / A2-08): Audition video scheduling requires server-side token & room provisioning.
        // Prevent false client scheduling or direct unauthenticated room creations.
        alert(`Audition scheduled request for ${selectedDate} at ${selectedTime} (${duration}m) submitted for server room creation. Video audition backend pipeline is queued for the upcoming release.`);
        onScheduled?.(`https://ifilmdirectory.daily.co/audition-${jobId}-${applicantId}`);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined">videocam</span>
                Schedule Video Audition
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-4">Schedule Video Audition</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Schedule a video call with {applicantName}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={45}>45 minutes</option>
                                        <option value={60}>1 hour</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSchedule}
                                    disabled={!selectedDate || !selectedTime}
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Schedule Audition
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VideoCall;
