import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import PostMedia from '../components/PostMedia';
import HamburgerMenu from '../components/HamburgerMenu';
import SEO from '../components/SEO';
import { uploadFile } from '../services/storageService';
import { subscribeToMessages, sendMessage, clearChat, markChatAsRead, type Message as FirestoreMessage } from '../services/messagingService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile, type UserProfile } from '../services/userService';

interface Message extends FirestoreMessage {
    time?: string;
    isSent?: boolean;
}

export default function Messaging() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

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
    const rawId = id || 'demo-chat-ranveer';
    const currentUserId = currentUser?.uid || 'demo-user';

    // Compute canonical chatId and recipient otherUserId
    let otherUserId = rawId;
    let chatId = rawId;

    if (currentUser && rawId !== 'demo-chat-ranveer') {
        if (rawId.includes('_')) {
            const parts = rawId.split('_');
            otherUserId = parts.find(p => p !== currentUser.uid) || parts[0] || rawId;
            chatId = [currentUser.uid, otherUserId].sort().join('_');
        } else {
            // rawId is a direct user profile UID
            otherUserId = rawId;
            chatId = [currentUser.uid, otherUserId].sort().join('_');
        }
    }

    // Auto-mark chat as read when viewed
    useEffect(() => {
        if (currentUser && chatId && chatId !== 'demo-chat-ranveer') {
            markChatAsRead(chatId, currentUser.uid);
        }
    }, [chatId, currentUser, messages.length]);

    // Fallback seed messages for demo presentation if thread is empty
    const mockDemoMessages: Message[] = [
        {
            id: 'm1',
            text: 'Hey! Loved the mood board and lighting reference frames you shared for the rooftop sequence.',
            senderId: 'other-user',
            type: 'text',
            createdAt: { seconds: (Date.now() - 7200000) / 1000 } as any,
            time: '2 hours ago',
            isSent: false
        },
        {
            id: 'm2',
            text: 'Thanks! We are pairing Cooke Anamorphic lenses with the Alexa 35 to capture that warm golden hour bloom.',
            senderId: currentUserId,
            type: 'text',
            createdAt: { seconds: (Date.now() - 3600000) / 1000 } as any,
            time: '1 hour ago',
            isSent: true
        },
        {
            id: 'm3',
            text: 'Perfect. Let’s do a quick read-through with the second AD tomorrow at 11 AM.',
            senderId: 'other-user',
            type: 'text',
            createdAt: { seconds: (Date.now() - 1800000) / 1000 } as any,
            time: '30 mins ago',
            isSent: false
        }
    ];

    const chatName = otherUserProfile?.displayName || (
        rawId === 'demo-chat-ranveer' || rawId === 'ranveer-singh' ? 'Ranveer Singh' :
        rawId === 'jonny-shaik' ? 'Jonny Shaik' :
        rawId === 'vn-aditya' ? 'V.N. Aditya' :
        (otherUserId ? otherUserId.slice(0, 14) : 'Filmmaker')
    );

    const chatRole = (otherUserProfile as any)?.role || otherUserProfile?.bio?.slice(0, 30) || (
        rawId === 'demo-chat-ranveer' || rawId === 'ranveer-singh' ? 'Lead Actor & Producer' :
        rawId === 'jonny-shaik' ? 'Cinematographer (ISC)' :
        rawId === 'vn-aditya' ? 'Film Director' :
        'Film Industry Professional'
    );

    const chatAvatar = otherUserProfile?.photoURL || (
        rawId === 'demo-chat-ranveer' || rawId === 'ranveer-singh' ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' :
        rawId === 'jonny-shaik' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' :
        rawId === 'vn-aditya' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' :
        `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=121316&color=F59E0B`
    );

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch other user's profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (otherUserId && otherUserId !== 'demo-chat-ranveer' && otherUserId !== 'ranveer-singh' && otherUserId !== 'jonny-shaik' && otherUserId !== 'vn-aditya') {
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
            if (newMessages.length > 0) {
                const formattedMessages = newMessages.map(msg => ({
                    ...msg,
                    time: msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Just now',
                    isSent: msg.senderId === currentUserId
                }));
                setMessages(formattedMessages);
            } else {
                setMessages(mockDemoMessages);
            }
            setTimeout(scrollToBottom, 60);
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
        '🎬', '🎥', '📹', '🎞️', '📽️', '🎭', '👏', '🔥', '✨', '⭐', '💡', '💯',
        '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍',
        '👍', '👎', '👊', '🤞', '✌️', '🤟', '🤘', '👌', '🤝', '🙌', '🙏', '💪',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
        '😎', '🤩', '🥳', '🤔', '🤫', '🫡', '☕', '🍿', '🎯', '🚀', '⚡', '🏆'
    ];

    const handleEmojiClick = (emoji: string) => {
        setMessageText(prev => prev + emoji);
    };

    const handleSendMessage = async () => {
        if (messageText.trim()) {
            try {
                const recipient = otherUserId !== currentUserId && otherUserId !== 'demo-chat-ranveer' ? otherUserId : undefined;
                await sendMessage(
                    chatId,
                    {
                        text: messageText,
                        senderId: currentUserId,
                        type: 'text'
                    },
                    recipient,
                    currentUser?.displayName || 'Filmmaker',
                    currentUser?.photoURL || undefined
                );
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
                const recipient = otherUserId !== currentUserId && otherUserId !== 'demo-chat-ranveer' ? otherUserId : undefined;
                await sendMessage(
                    chatId,
                    {
                        text: 'Voice Note',
                        senderId: currentUserId,
                        type: 'audio',
                        mediaUrl: response.url
                    },
                    recipient,
                    currentUser?.displayName || 'Filmmaker',
                    currentUser?.photoURL || undefined
                );
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
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#0B0C0E] text-zinc-900 dark:text-white font-display transition-colors">
            <SEO 
                title={`Chat with ${chatName} | iFilmDirectory`} 
                description={`Direct production conversation with ${chatName}.`}
            />

            <div className="flex flex-col flex-1 pb-32 w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-5">
                
                {/* Unified Cinema Chat App Bar */}
                <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0C0E]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.08] pt-3.5 pb-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Back + User Bio */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => navigate('/messaging')}
                                className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all active:scale-95"
                                aria-label="Back to Messages"
                                title="Back to Messages"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </button>

                            {/* Avatar & Online indicator */}
                            <div 
                                onClick={() => otherUserId && navigate(`/profile/${otherUserId}`)}
                                className="relative cursor-pointer group shrink-0"
                            >
                                <div className="size-11 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/60 bg-zinc-900 transition-colors shadow-xs">
                                    <PostMedia
                                        src={chatAvatar}
                                        fallbackType="USER_MALE"
                                        className="size-full object-cover"
                                    />
                                </div>
                                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B0C0E] shadow-xs" />
                            </div>

                            {/* Name & Role Details */}
                            <div className="min-w-0 cursor-pointer" onClick={() => otherUserId && navigate(`/profile/${otherUserId}`)}>
                                <h2 className="text-zinc-900 dark:text-white text-sm sm:text-base font-bold leading-tight truncate flex items-center gap-1.5 group">
                                    <span className="truncate group-hover:text-amber-500 transition-colors">{chatName}</span>
                                    <span className="material-symbols-outlined text-amber-500 text-xs shrink-0 filled" title="Verified Professional">
                                        verified
                                    </span>
                                </h2>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-medium">
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{chatRole}</span> • Active On Set
                                </p>
                            </div>
                        </div>

                        {/* Right Quick Controls */}
                        <div className="flex items-center gap-1.5 relative">
                            {/* Voice Call */}
                            <button
                                onClick={() => {
                                    if (allowCalls) {
                                        setShowCallConfirmation(true);
                                    } else {
                                        alert("Calls are currently muted for this thread.");
                                    }
                                }}
                                className={`flex items-center justify-center rounded-xl size-9 border transition-all ${
                                    allowCalls
                                        ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] border-zinc-200 dark:border-white/[0.08] text-amber-500 dark:text-amber-400 hover:border-amber-500/40'
                                        : 'bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.04] text-zinc-400 cursor-not-allowed'
                                }`}
                                title="Start Voice Call"
                            >
                                <span className="material-symbols-outlined text-lg">call</span>
                            </button>

                            {/* Theme Toggle (Mobile only, sidebar has it on desktop) */}
                            <button
                                onClick={toggleDarkMode}
                                className="flex md:hidden size-9 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-colors"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {/* Options Dropdown Trigger */}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex items-center justify-center rounded-xl size-9 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all"
                                title="Chat Settings"
                            >
                                <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>

                            <HamburgerMenu />

                            {/* Chat Settings Dropdown */}
                            {showSettings && (
                                <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#15171C] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/[0.12] overflow-hidden z-50 p-2 backdrop-blur-xl animate-in fade-in zoom-in-95">
                                    <button
                                        onClick={() => {
                                            setAllowCalls(!allowCalls);
                                            setShowSettings(false);
                                        }}
                                        className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-left hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors text-zinc-700 dark:text-zinc-200"
                                    >
                                        <span>Allow Calls</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${allowCalls ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                            <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-transform ${allowCalls ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            setShowSettings(false);
                                            navigate(`/profile/${otherUserId}`);
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base text-amber-500">person</span>
                                        View Industry Profile
                                    </button>

                                    <div className="h-px bg-zinc-200 dark:bg-white/[0.06] my-1" />

                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Clear all conversation history in this thread?')) {
                                                await clearChat(chatId);
                                                setShowSettings(false);
                                            }
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                                        Clear History
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Messages Stream Container */}
                <div className="flex-1 py-4 space-y-4 overflow-y-auto no-scrollbar min-h-[50vh]">
                    {/* Security Encrypted Indicator */}
                    <div className="flex justify-center my-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-white/[0.08] shadow-2xs">
                            <span className="material-symbols-outlined text-amber-500 text-xs">lock</span>
                            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                End-to-End Encrypted Production Channel
                            </span>
                        </div>
                    </div>

                    {messages.map((message) => {
                        const isEmoji = isEmojiOnly(message.text);
                        return message.isSent ? (
                            <div key={message.id} className="flex items-start gap-2.5 justify-end">
                                <div className="flex flex-col gap-1 w-full max-w-[340px] sm:max-w-md items-end">
                                    <div className="sent-message-bubble flex flex-col leading-relaxed p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-2xl rounded-tr-xs shadow-md shadow-amber-500/20">
                                        {message.type === 'audio' ? (
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                {failedAudioIds.has(message.id) ? (
                                                    <div className="flex items-center gap-2 text-white/90 text-xs italic py-1">
                                                        <span className="material-symbols-outlined text-sm">error</span>
                                                        Audio expired
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleMessageAudio(message.id, message.mediaUrl || '')}
                                                            className="size-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-white text-base">
                                                                {playingMessageId === message.id ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <div className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                                                            <div className="h-full w-1/3 bg-white rounded-full" />
                                                        </div>
                                                        <span className="text-xs text-white font-mono">0:15</span>
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
                                            <p className={`${isEmoji ? 'text-4xl' : 'text-xs sm:text-sm'} text-white select-text leading-relaxed`}>
                                                {message.text}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold px-1">
                                        <span>{message.time}</span>
                                        <span className="material-symbols-outlined text-[13px] text-amber-500">
                                            {message.isRead ? 'done_all' : 'done'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={message.id} className="flex items-start gap-2.5">
                                <div className="flex flex-col gap-1 w-full max-w-[340px] sm:max-w-md">
                                    <div className="flex flex-col leading-relaxed p-3.5 bg-white dark:bg-[#14161a] border border-zinc-200/90 dark:border-white/[0.08] text-zinc-900 dark:text-white rounded-2xl rounded-tl-xs shadow-xs">
                                        {message.type === 'audio' ? (
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                {failedAudioIds.has(message.id) ? (
                                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs italic py-1">
                                                        <span className="material-symbols-outlined text-sm">error</span>
                                                        Audio expired
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleMessageAudio(message.id, message.mediaUrl || '')}
                                                            className="size-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-full transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-base">
                                                                {playingMessageId === message.id ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <div className="h-1 flex-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full w-1/3 bg-amber-500 dark:bg-amber-400 rounded-full" />
                                                        </div>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">0:15</span>
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
                                            <p className={`${isEmoji ? 'text-4xl' : 'text-xs sm:text-sm'} text-zinc-800 dark:text-zinc-100 font-normal leading-relaxed select-text`}>
                                                {message.text}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold px-1">
                                        {message.time}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Modern Message Input Area */}
                <div className="fixed bottom-20 md:bottom-24 z-30 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-3 sm:px-5">
                    {/* Attachments Menu */}
                    {showAttachments && (
                        <div className="absolute bottom-full left-4 mb-2 flex flex-col gap-1 rounded-2xl bg-white dark:bg-[#16181D] border border-zinc-200 dark:border-white/[0.12] p-2 shadow-2xl animate-in slide-in-from-bottom-2 min-w-[220px] z-50">
                            <button
                                onClick={() => {
                                    setShowEmojiPicker(true);
                                    setShowAttachments(false);
                                }}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors text-left text-zinc-700 dark:text-zinc-200"
                            >
                                <span className="material-symbols-outlined text-amber-500 text-lg">sentiment_satisfied</span>
                                <span>Add Cinema Emoji</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors text-left text-zinc-700 dark:text-zinc-200">
                                <span className="material-symbols-outlined text-sky-500 text-lg">image</span>
                                <span>Scene Stills & Moodboard</span>
                            </button>
                            <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors text-left text-zinc-700 dark:text-zinc-200">
                                <span className="material-symbols-outlined text-purple-500 text-lg">description</span>
                                <span>Call Sheet / Script PDF</span>
                            </button>
                        </div>
                    )}

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full right-4 mb-2 w-72 rounded-2xl bg-white dark:bg-[#16181D] border border-zinc-200 dark:border-white/[0.12] p-3 shadow-2xl animate-in slide-in-from-bottom-2 grid grid-cols-6 gap-1.5 h-60 overflow-y-auto no-scrollbar z-50">
                            {emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="flex items-center justify-center p-2 hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-xl text-lg transition-transform hover:scale-125"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Input Control Bar */}
                    <div className="flex items-center gap-2 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl p-2 rounded-2xl border border-zinc-200/90 dark:border-white/[0.1] shadow-xl dark:shadow-2xl min-h-[58px]">
                        {isRecording ? (
                            <div className="flex items-center w-full gap-3 animate-in fade-in px-2">
                                <button
                                    onClick={cancelRecording}
                                    className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-colors"
                                    title="Cancel"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                                <div className="flex-1 flex items-center justify-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-1.5">
                                    <div className="size-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="font-mono text-xs font-bold text-rose-500 dark:text-rose-400">{formatTime(recordingDuration)}</span>
                                    <div className="flex items-center gap-1 h-4 min-w-0">
                                        {waveform.map((height, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-rose-500 dark:bg-rose-400 rounded-full transition-all duration-75 shrink-0"
                                                style={{ height: `${height}px` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 shadow-md shadow-rose-500/30 transition-all"
                                    title="Finish"
                                >
                                    <span className="material-symbols-outlined text-lg">stop</span>
                                </button>
                            </div>
                        ) : audioPreview ? (
                            <div className="flex items-center w-full gap-3 animate-in fade-in px-2">
                                <button
                                    onClick={cancelRecording}
                                    className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-colors"
                                    title="Discard"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                                <div className="flex-1 flex items-center gap-3 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5">
                                    <button
                                        onClick={togglePreviewAudio}
                                        className="size-7 flex items-center justify-center bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {isPreviewPlaying ? 'pause' : 'play_arrow'}
                                        </span>
                                    </button>
                                    <div className="h-1 flex-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-0 bg-amber-500 dark:bg-amber-400 rounded-full" />
                                    </div>
                                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{formatTime(recordingDuration)}</span>
                                </div>
                                <button
                                    onClick={sendAudioMessage}
                                    className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-400 shadow-md shadow-amber-500/25 transition-all"
                                    title="Send Voice Note"
                                >
                                    <span className="material-symbols-outlined text-lg font-bold">send</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setShowAttachments(!showAttachments);
                                        setShowEmojiPicker(false);
                                    }}
                                    className={`flex items-center justify-center size-9 rounded-xl transition-all ${
                                        showAttachments 
                                            ? 'bg-amber-500 text-white' 
                                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                    title="Add Media / Documents"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                </button>

                                <input
                                    className="flex w-full min-w-0 flex-1 bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm px-2"
                                    placeholder="Discuss shoot dates, gear specs, or scene notes..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />

                                <button
                                    onClick={() => {
                                        setShowEmojiPicker(!showEmojiPicker);
                                        setShowAttachments(false);
                                    }}
                                    className={`flex items-center justify-center size-9 rounded-xl transition-all ${
                                        showEmojiPicker 
                                            ? 'text-amber-500 dark:text-amber-400' 
                                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                    }`}
                                    title="Cinema Emoji"
                                >
                                    <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
                                </button>

                                {messageText.trim() ? (
                                    <button
                                        onClick={handleSendMessage}
                                        className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                                        title="Send"
                                    >
                                        <span className="material-symbols-outlined text-base font-bold">send</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center justify-center size-9 rounded-xl text-zinc-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title="Record Voice Note"
                                    >
                                        <span className="material-symbols-outlined text-xl">mic</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />

            {/* Calling Screen Overlay */}
            {callState.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in"
                    onClick={() => setCallState({ isOpen: false, type: null })}
                >
                    <div
                        className="flex flex-col items-center gap-8 p-8 text-white max-w-sm w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="size-32 rounded-full overflow-hidden border-4 border-amber-500/40 p-1 shadow-2xl">
                                <PostMedia
                                    src={chatAvatar}
                                    fallbackType="USER_MALE"
                                    className="size-full object-cover rounded-full"
                                />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black">{chatName}</h3>
                                <p className="text-amber-400/80 text-xs font-semibold tracking-wider uppercase mt-1">
                                    {callState.type === 'video' ? 'Connecting Video Feed...' : 'Calling Production Line...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="flex size-14 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined text-2xl">mic_off</span>
                            </button>
                            <button
                                onClick={() => setCallState({ isOpen: false, type: null })}
                                className="flex size-16 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-3xl">call_end</span>
                            </button>
                            <button
                                onClick={() => setCallState(prev => ({ ...prev, type: prev.type === 'video' ? 'audio' : 'video' }))}
                                className={`flex size-14 items-center justify-center rounded-full transition-colors ${callState.type === 'video' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
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
                        className="bg-white dark:bg-[#15171C] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
                                <span className="material-symbols-outlined text-3xl">call</span>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                Voice Call
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
                                Start an encrypted voice call with <br />
                                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base">{chatName}</span>?
                            </p>

                            <div className="flex flex-col w-full gap-2.5">
                                <button
                                    onClick={() => {
                                        setShowCallConfirmation(false);
                                        setCallState({ isOpen: true, type: 'audio' });
                                    }}
                                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
                                >
                                    Start Call
                                </button>
                                <button
                                    onClick={() => setShowCallConfirmation(false)}
                                    className="w-full py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Popover Backdrops */}
            {(showSettings || showAttachments || showEmojiPicker) && (
                <div
                    className="fixed inset-0 z-[40]"
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
