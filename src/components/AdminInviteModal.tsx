import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminInviteModal({ isOpen, onClose }: AdminInviteModalProps) {
    const { currentUser } = useAuth();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const referralLink = `https://iFilmDirectory.com/login?tab=request&ref=${currentUser?.uid || ''}`;

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !inviteName) return;

        setLoading(true);
        setError('');
        try {
            const emailjs = await import('@emailjs/browser');

            // Create custom email body with professional copy
            const emailBody = `Hello ${inviteName},

You're invited to join iFilmDirectory—the comprehensive hub for film professionals.

🎬 What's inside:
• Find Work: Latest casting calls and job listings
• Connect: Global directory of industry professionals
• Showcase: Build your portfolio and profile
• Stay Informed: Expert blogs and industry news

Build your professional presence today:
🔗 ${referralLink}

Welcome to the community!

Best regards,
The iFilmDirectory Team`;

            await emailjs.default.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_m19ckwn',
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lopp3n9',
                {
                    to_email: inviteEmail,
                    to_name: inviteName,
                    subject: `You're invited to join iFilmDirectory`,
                    message_html: emailBody.replace(/\n/g, '<br>'),
                },
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );

            setSuccess(true);
            setInviteEmail('');
            setInviteName('');
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            console.error("Failed to send invite email", err);
            setError(err.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = () => {
        const message = `Hello ${inviteName || 'there'}! 

iFilmDirectory is inviting you to join the premier film industry network.

✨ Find work, connect with professionals, and showcase your talent.

Join here: ${referralLink}

Welcome aboard! 🎬`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        alert('Referral link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Invite Professional</h2>
                        <p className="text-xs text-zinc-500 font-medium">Add new talent to the platform</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-zinc-500">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Share Link Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-primary">Admin Invite Link</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">{referralLink}</p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shrink-0"
                                title="Copy Link"
                            >
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                        >
                            <span className="material-symbols-outlined text-base">share</span>
                            WhatsApp
                        </button>
                        <button
                            onClick={() => {
                                const message = `Hello ${inviteName || 'there'}! 

iFilmDirectory is inviting you to join the premier film industry network.

✨ Find work, connect with professionals, and showcase your talent.

Join here: ${referralLink}

Welcome aboard! 🎬`;
                                const mailtoUrl = `mailto:?subject=You're invited to join iFilmDirectory&body=${encodeURIComponent(message)}`;
                                window.location.href = mailtoUrl;
                            }}
                            className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-base">mail</span>
                            Direct Email
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-zinc-900 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Or Send via System</span>
                        </div>
                    </div>

                    {/* System Email Form */}
                    <form onSubmit={handleSendEmail} className="space-y-4">
                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Invitation sent successfully!
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Full Name</label>
                            <input
                                type="text"
                                value={inviteName}
                                onChange={e => setInviteName(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="e.g. Satyajit Ray"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Email Address</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">send</span>
                                    Send System Invitation
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-black/20 text-center">
                    <p className="text-[10px] text-zinc-500 font-medium">Invited users can skip the basic waitlist & get priority review.</p>
                </div>
            </div>
        </div>
    );
}
