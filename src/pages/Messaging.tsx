import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import { uploadFile } from '../services/storageService';
import { subscribeToMessages, sendMessage, clearChat, type Message as FirestoreMessage } from '../services/messagingService';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, type UserProfile } from '../services/userService';

interface Message extends FirestoreMessage {
    time?: string;
    isSent?: boolean;
}

export default function Messaging() {
    const location = useLocation();
    const { id } = useParams();
    const { currentUser } = useAuth();

    const [messageText, setMessageText] = useState('');
    const [callState, setCallState] = useState<{ isOpen: boolean; type: 'audio' | 'video' | null }>({
        isOpen: false,
        type: null
    });
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [allowCalls, setAllowCalls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showCallConfirmation, setShowCallConfirmation] = useState(false);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [waveform, setWaveform] = useState<number[]>(new Array(25).fill(5));

    // Playback State
    const [playingMessageId, setPlayingMessageId] = useState<string | number | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [failedAudioIds, setFailedAudioIds] = useState<Set<string | number>>(new Set());

    const handleAudioError = (id: string | number) => {
        setFailedAudioIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const timerRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
    const chatId = id || 'demo-chat-ranveer';
    const currentUserId = currentUser?.uid || 'demo-user';

    // Extract the other user's ID from the chatId (assuming format: userId1-userId2)
    const otherUserId = chatId.split('-').find(uid => uid !== currentUserId) || chatId;

    const chatName = otherUserProfile?.displayName || chatId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch other user's profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (otherUserId && otherUserId !== 'demo-chat-ranveer') {
                try {
                    const profile = await getUserProfile(otherUserId);
                    setOtherUserProfile(profile);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };
        fetchUserProfile();
    }, [otherUserId]);

    useEffect(() => {
        const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
            const formattedMessages = newMessages.map(msg => ({
                ...msg,
                time: msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Just now',
                isSent: msg.senderId === currentUserId
            }));
            setMessages(formattedMessages);
            setTimeout(scrollToBottom, 50);
        });

        return () => unsubscribe();
    }, [chatId, currentUserId]);

    useEffect(() => {
        if (location.state?.startCall) {
            setCallState({ isOpen: true, type: 'audio' });
            window.history.replaceState({}, document.title);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [location.state]);

    const emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
        '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒',
        '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
        '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
        '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
        '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏',
        '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
        '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '🌟', '💫', '💥', '💯'
    ];

    const handleEmojiClick = (emoji: string) => {
        setMessageText(prev => prev + emoji);
    };

    const handleSendMessage = async () => {
        if (messageText.trim()) {
            try {
                await sendMessage(chatId, {
                    text: messageText,
                    senderId: currentUserId,
                    type: 'text'
                });
                setMessageText('');
                scrollToBottom();
            } catch (error) {
                console.error("Failed to send message", error);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const updateWaveform = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                const step = Math.floor(bufferLength / 25);
                const newWaveform = [];
                for (let i = 0; i < 25; i++) {
                    const value = dataArray[i * step];
                    const height = Math.max(4, (value / 255) * 24);
                    newWaveform.push(height);
                }
                setWaveform(newWaveform);
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            };
            updateWaveform();

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioPreview(url);
                stream.getTracks().forEach(track => track.stop());

                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAudioPreview(null);
        setAudioBlob(null);
        setRecordingDuration(0);
        setIsPreviewPlaying(false);
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;

        const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });

        setAudioPreview(null);
        setAudioBlob(null);
        setRecordingDuration(0);
        setIsPreviewPlaying(false);

        try {
            const response = await uploadFile(audioFile);
            if (response.url) {
                await sendMessage(chatId, {
                    text: 'Voice Message',
                    senderId: currentUserId,
                    type: 'audio',
                    mediaUrl: response.url
                });
                scrollToBottom();
            } else {
                alert('Failed to upload voice message');
            }
        } catch (error) {
            console.error("Error sending audio message:", error);
            alert("Failed to send audio message.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const isEmojiOnly = (text: string) => {
        try {
            return /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u.test(text);
        } catch (e) {
            return false;
        }
    };

    const toggleMessageAudio = (id: string | number, _url: string) => {
        const audioId = `audio-${id}`;
        const audioEl = document.getElementById(audioId) as HTMLAudioElement;

        if (!audioEl) return;

        if (playingMessageId && playingMessageId !== id) {
            const prevAudio = document.getElementById(`audio-${playingMessageId}`) as HTMLAudioElement;
            if (prevAudio) {
                prevAudio.pause();
                prevAudio.currentTime = 0;
            }
            setPlayingMessageId(null);
        }

        if (audioEl.paused) {
            audioEl.play().catch(e => console.error("Play error:", e));
            setPlayingMessageId(id);
        } else {
            audioEl.pause();
            setPlayingMessageId(null);
        }
    };

    const togglePreviewAudio = () => {
        const audioEl = document.getElementById('preview-audio') as HTMLAudioElement;
        if (!audioEl) return;

        if (audioEl.paused) {
            audioEl.play();
            setIsPreviewPlaying(true);
        } else {
            audioEl.pause();
            setIsPreviewPlaying(false);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="flex flex-col flex-1 pb-24 w-full max-w-md md:max-w-2xl mx-auto">
                {/* Top App Bar */}
                <div className="sticky top-0 z-10 flex flex-col bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                    <div className="flex items-center p-4 justify-between">
                        <div className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center">
                            <HamburgerMenu />
                        </div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                                {chatName}
                            </h2>
                            {otherUserProfile?.verification?.isVerified && (
                                <span
                                    className="material-symbols-outlined text-blue-500 !text-lg"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    verified
                                </span>
                            )}
                        </div>
                        <div className="flex w-12 items-center justify-end gap-2 relative">
                            <button
                                onClick={() => {
                                    if (allowCalls) {
                                        setShowCallConfirmation(true);
                                    } else {
                                        alert("You have disabled calls for this chat.");
                                    }
                                }}
                                className={`flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-transparent gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 transition-colors ${allowCalls
                                    ? 'text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
                                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-2xl">call</span>
                            </button>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-transparent text-slate-900 dark:text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-2xl">more_vert</span>
                            </button>

                            {/* Chat Settings Dropdown */}
                            {showSettings && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setAllowCalls(!allowCalls);
                                                setShowSettings(false);
                                            }}
                                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                        >
                                            <span className="text-zinc-900 dark:text-white">Allow Calls</span>
                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${allowCalls ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${allowCalls ? 'left-4.5' : 'left-0.5'}`} />
                                            </div>
                                        </button>
                                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-lg">block</span>
                                            Block User
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
                                                    await clearChat(chatId);
                                                    setShowSettings(false);
                                                }
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                            Clear Chat
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto no-scrollbar min-h-0">
                    <div className="text-center">
                        <span className="text-xs text-slate-500 dark:text-[#cba990] bg-slate-200 dark:bg-[#493222] px-2 py-1 rounded-full">
                            Today
                        </span>
                    </div>

                    {messages.map((message) => {
                        const isEmoji = isEmojiOnly(message.text);
                        return message.isSent ? (
                            <div key={message.id} className="flex items-start gap-2.5 justify-end">
                                <div className="flex flex-col gap-1 w-full max-w-[320px] items-end">
                                    <div className="flex flex-col leading-1.5 p-3 bg-primary rounded-l-xl rounded-br-xl">
                                        {message.type === 'audio' ? (
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                {failedAudioIds.has(message.id) ? (
                                                    <div className="flex items-center gap-2 text-white/80 text-sm italic py-1">
                                                        <span className="material-symbols-outlined text-sm">error</span>
                                                        Audio expired
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleMessageAudio(message.id, message.mediaUrl || '')}
                                                            className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-white">
                                                                {playingMessageId === message.id ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                                            <div className="h-full w-1/3 bg-white rounded-full" />
                                                        </div>
                                                        <span className="text-xs text-white">0:15</span>
                                                        <audio
                                                            id={`audio-${message.id}`}
                                                            src={message.mediaUrl}
                                                            className="hidden"
                                                            onEnded={() => setPlayingMessageId(null)}
                                                            onError={() => handleAudioError(message.id)}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className={`${isEmoji ? 'text-4xl' : 'text-sm'} font-normal text-white`}>{message.text}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500 dark:text-[#cba990]">{message.time}</span>
                                        <span className="material-symbols-outlined !text-base text-blue-500">
                                            {message.isRead ? 'done_all' : 'done'}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 shrink-0"
                                    style={{
                                        backgroundImage:
                                            'url(https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop)',
                                    }}
                                />
                            </div>
                        ) : (
                            <div key={message.id} className="flex items-start gap-2.5">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 shrink-0"
                                    style={{
                                        backgroundImage:
                                            `url(${otherUserProfile?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'})`,
                                    }}
                                />
                                <div className="flex flex-col gap-1 w-full max-w-[320px]">
                                    <div className="flex flex-col leading-1.5 p-3 border-slate-200 bg-slate-200 dark:bg-[#493222] rounded-r-xl rounded-bl-xl">
                                        {message.type === 'audio' ? (
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                {failedAudioIds.has(message.id) ? (
                                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm italic py-1">
                                                        <span className="material-symbols-outlined text-sm">error</span>
                                                        Audio expired
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleMessageAudio(message.id, message.mediaUrl || '')}
                                                            className="w-8 h-8 flex items-center justify-center bg-zinc-900/10 dark:bg-white/10 rounded-full hover:bg-zinc-900/20 dark:hover:bg-white/20 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-zinc-900 dark:text-white">
                                                                {playingMessageId === message.id ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <div className="h-1 flex-1 bg-zinc-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full w-1/3 bg-zinc-900 dark:bg-white rounded-full" />
                                                        </div>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">0:15</span>
                                                        <audio
                                                            id={`audio-${message.id}`}
                                                            src={message.mediaUrl}
                                                            className="hidden"
                                                            onEnded={() => setPlayingMessageId(null)}
                                                            onError={() => handleAudioError(message.id)}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className={`${isEmoji ? 'text-4xl' : 'text-sm'} font-normal text-slate-900 dark:text-white`}>{message.text}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-[#cba990]">{message.time}</span>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} />

                    <div className="flex items-center justify-center gap-2 py-2">
                        <span className="material-symbols-outlined text-base text-slate-500 dark:text-[#cba990]">
                            videocam_off
                        </span>
                        <span className="text-xs text-slate-500 dark:text-[#cba990]">
                            {chatName} does not have video calls enabled
                        </span>
                    </div>
                </div>

                {/* Message Input Area */}
                <div className="fixed bottom-24 z-10 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl px-4">
                    {showAttachments && (
                        <div className="absolute bottom-full left-4 mb-2 flex flex-col gap-1 rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-xl border border-gray-200 dark:border-zinc-700 animate-in slide-in-from-bottom-2 min-w-[200px] z-50">
                            <button
                                onClick={() => {
                                    setShowEmojiPicker(true);
                                    setShowAttachments(false);
                                }}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-yellow-500">sentiment_satisfied</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Emoji</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left">
                                <span className="material-symbols-outlined text-blue-500">image</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Photos & Videos</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left">
                                <span className="material-symbols-outlined text-purple-500">description</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Document</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left">
                                <span className="material-symbols-outlined text-green-500">person</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Contact</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left">
                                <span className="material-symbols-outlined text-red-500">location_on</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Location</span>
                            </button>
                        </div>
                    )}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full right-4 mb-2 w-64 rounded-xl bg-white dark:bg-zinc-800 p-2 shadow-xl border border-gray-200 dark:border-zinc-700 animate-in slide-in-from-bottom-2 grid grid-cols-6 gap-1 h-64 overflow-y-auto custom-scrollbar z-50">
                            {emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-xl transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 min-h-[72px]">
                        {isRecording ? (
                            <div className="flex items-center w-full gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <button
                                    onClick={cancelRecording}
                                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="flex-1 flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/10 rounded-full px-4 py-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="font-mono font-medium text-red-500">{formatTime(recordingDuration)}</span>
                                    <div className="flex items-center gap-1 h-4 min-w-0">
                                        {waveform.map((height, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-red-400 rounded-full transition-all duration-75 shrink-0"
                                                style={{
                                                    height: `${height}px`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                                >
                                    <span className="material-symbols-outlined">stop</span>
                                </button>
                            </div>
                        ) : audioPreview ? (
                            <div className="flex items-center w-full gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <button
                                    onClick={cancelRecording}
                                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="flex-1 flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2">
                                    <button
                                        onClick={togglePreviewAudio}
                                        className="w-8 h-8 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {isPreviewPlaying ? 'pause' : 'play_arrow'}
                                        </span>
                                    </button>
                                    <div className="h-1 flex-1 bg-zinc-300 dark:bg-zinc-600 rounded-full overflow-hidden">
                                        <div className="h-full w-0 bg-primary rounded-full" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500">{formatTime(recordingDuration)}</span>
                                    <audio
                                        key={audioPreview}
                                        id="preview-audio"
                                        src={audioPreview || ''}
                                        className="hidden"
                                        onEnded={() => setIsPreviewPlaying(false)}
                                    />
                                </div>
                                <button
                                    onClick={sendAudioMessage}
                                    className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setShowAttachments(!showAttachments);
                                        setShowEmojiPicker(false);
                                    }}
                                    className={`flex items-center justify-center h-10 w-10 shrink-0 transition-colors ${showAttachments ? 'text-primary rotate-45' : 'text-slate-500 dark:text-[#cba990] hover:text-primary'}`}
                                >
                                    <span className="material-symbols-outlined text-2xl transition-transform duration-200">add_circle</span>
                                </button>
                                <label className="flex flex-col min-w-40 h-10 w-full">
                                    <div className="flex w-full flex-1 items-center rounded-full h-full bg-slate-200 dark:bg-[#493222] px-4">
                                        <input
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent focus:border-none h-full placeholder:text-slate-500 dark:placeholder:text-[#cba990] text-base font-normal leading-normal p-0"
                                            placeholder="Type a message..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                        <button
                                            onClick={() => {
                                                setShowEmojiPicker(!showEmojiPicker);
                                                setShowAttachments(false);
                                            }}
                                            className={`flex items-center justify-center h-8 w-8 shrink-0 ml-2 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-500 dark:text-[#cba990] hover:text-primary'}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
                                        </button>
                                    </div>
                                </label>

                                {messageText.trim() ? (
                                    <button
                                        onClick={handleSendMessage}
                                        className="flex items-center justify-center h-10 w-10 shrink-0 text-primary hover:scale-110 transition-transform"
                                    >
                                        <span className="material-symbols-outlined text-2xl">send</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center justify-center h-10 w-10 shrink-0 text-slate-500 dark:text-[#cba990] hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-2xl">mic</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
            {callState.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setCallState({ isOpen: false, type: null })}
                >
                    <div
                        className="flex flex-col items-center gap-8 p-8 text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-32 w-32 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white/10">
                                <span className="material-symbols-outlined text-6xl">person</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold">{chatName}</h3>
                                <p className="text-white/60">
                                    {callState.type === 'video' ? 'Video Calling...' : 'Calling...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                                <span className="material-symbols-outlined text-2xl">mic_off</span>
                            </button>
                            <button
                                onClick={() => setCallState({ isOpen: false, type: null })}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                            >
                                <span className="material-symbols-outlined text-3xl">call_end</span>
                            </button>
                            <button
                                onClick={() => setCallState(prev => ({ ...prev, type: prev.type === 'video' ? 'audio' : 'video' }))}
                                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${callState.type === 'video' ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    {callState.type === 'video' ? 'videocam' : 'videocam_off'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Voice Call Confirmation Modal */}
            {showCallConfirmation && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setShowCallConfirmation(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 w-full max-w-[300px] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 ring-8 ring-primary/5">
                                <span className="material-symbols-outlined text-4xl">call</span>
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Voice Call</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                                Start a voice call with <br />
                                <span className="font-black text-primary text-base">{chatName}</span>?
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={() => {
                                        setShowCallConfirmation(false);
                                        setCallState({ isOpen: true, type: 'audio' });
                                    }}
                                    className="w-full py-4 rounded-2xl bg-primary text-white font-extrabold text-lg shadow-lg shadow-primary/30 hover:opacity-95 active:scale-[0.98] transition-all"
                                >
                                    Start Call
                                </button>
                                <button
                                    onClick={() => setShowCallConfirmation(false)}
                                    className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Popover Backdrops */}
            {(showSettings || showAttachments || showEmojiPicker) && (
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => {
                        setShowSettings(false);
                        setShowAttachments(false);
                        setShowEmojiPicker(false);
                    }}
                />
            )}
        </div>
    );
}
