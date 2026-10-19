import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAllUsers,
    updateUserRole,
    isSuperAdmin,
    hasAdminPrivileges,
    claimSuperAdmin,
    updateUserProfile,
    getUserProfile,
    updateUserStatus,
    getAccessRequests,
    updateAccessRequestStatus,
    issueWarning,
    deleteUserAccount,
    type UserProfile,
    type AccessRequest,
    type AdminRoleType
} from '../services/userService';
import {
    getAllBlogsForAdmin,
    approveBlog,
    rejectBlog,
    takeDownBlog,
    type BlogPost
} from '../services/blogService';
import {
    removePostByAdmin,
    removeJobByAdmin,
    removeShowreelByAdmin,
    getModerationLogs,
    getRecentPostsForModeration,
    getRecentJobsForModeration,
    getRecentShowreelsForModeration,
    type ModerationLog
} from '../services/moderationService';
import {
    sendNotice,
    getNotices,
    toggleNoticeActive,
    deleteNotice,
    type PlatformNotice
} from '../services/noticeService';
import {
    getCampaigns,
    updateCampaignStatus,
    deleteCampaign,
    calculateCommercialMetrics,
    type AdCampaign
} from '../services/adService';
import CreateCampaignModal from '../components/CreateCampaignModal';
import UserStatusModal from '../components/UserStatusModal';
import AdminInviteModal from '../components/AdminInviteModal';
import { type EmailType } from '../services/emailTemplates';
import { isUserOnline, getUserPresenceInfo } from '../services/presenceService';

type AdminTab = 'dashboard' | 'blogs' | 'moderation' | 'notices' | 'commercial' | 'users' | 'system';
type ModerationContentType = 'posts' | 'jobs' | 'showreels' | 'logs';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [loading, setLoading] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    // Data States
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [ads, setAds] = useState<AdCampaign[]>([]);
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [blogFilter, setBlogFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
    const [selectedBlogForPreview, setSelectedBlogForPreview] = useState<BlogPost | null>(null);
    const [rejectBlogModal, setRejectBlogModal] = useState<{ isOpen: boolean; blogId: string; title: string }>({ isOpen: false, blogId: '', title: '' });
    const [rejectionReasonInput, setRejectionReasonInput] = useState('');

    // Moderation States
    const [moderationTab, setModerationTab] = useState<ModerationContentType>('posts');
    const [moderationPosts, setModerationPosts] = useState<any[]>([]);
    const [moderationJobs, setModerationJobs] = useState<any[]>([]);
    const [moderationShowreels, setModerationShowreels] = useState<any[]>([]);
    const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
    const [removalModal, setRemovalModal] = useState<{ isOpen: boolean; type: 'post' | 'job' | 'showreel'; id: string; title: string }>({ isOpen: false, type: 'post', id: '', title: '' });
    const [removalReasonInput, setRemovalReasonInput] = useState('');

    // Notices States
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeBody, setNoticeBody] = useState('');
    const [noticePriority, setNoticePriority] = useState<'normal' | 'high' | 'urgent'>('normal');
    const [noticeAudience, setNoticeAudience] = useState<PlatformNotice['targetAudience']>('all');
    const [noticeDirectUid, setNoticeDirectUid] = useState('');
    const [isPostingNotice, setIsPostingNotice] = useState(false);

    // Modals & UI States
    const [isCreateAdOpen, setIsCreateAdOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserProfile | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'pending' | 'verified' | 'applications'>('all');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isClaimingSuperAdmin, setIsClaimingSuperAdmin] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 5000);
    };

    // Initial Auth & Admin Verification
    useEffect(() => {
        const verifyAdminAccess = async () => {
            if (!currentUser) {
                setLoading(false);
                navigate('/login');
                return;
            }

            try {
                const profile = await getUserProfile(currentUser.uid);
                setCurrentUserProfile(profile);

                const hasAccess = hasAdminPrivileges(profile, currentUser.email);
                if (!hasAccess) {
                    navigate('/home');
                }
            } catch (error) {
                console.error("Admin verification error:", error);
                navigate('/home');
            } finally {
                setLoading(false);
            }
        };

        verifyAdminAccess();
    }, [currentUser, navigate]);

    // Data Fetching based on Active Tab
    useEffect(() => {
        const loadTabData = async () => {
            try {
                if (activeTab === 'dashboard') {
                    const [u, reqs, c, b, n] = await Promise.all([
                        getAllUsers(),
                        getAccessRequests(),
                        getCampaigns(),
                        getAllBlogsForAdmin(),
                        getNotices()
                    ]);
                    setUsers(u);
                    setAccessRequests(reqs);
                    setAds(c);
                    setBlogs(b);
                    setNotices(n);
                } else if (activeTab === 'users') {
                    const [u, reqs] = await Promise.all([getAllUsers(), getAccessRequests()]);
                    setUsers(u);
                    setAccessRequests(reqs);
                } else if (activeTab === 'blogs') {
                    const b = await getAllBlogsForAdmin();
                    setBlogs(b);
                } else if (activeTab === 'moderation') {
                    if (moderationTab === 'posts') {
                        const posts = await getRecentPostsForModeration();
                        setModerationPosts(posts);
                    } else if (moderationTab === 'jobs') {
                        const jobs = await getRecentJobsForModeration();
                        setModerationJobs(jobs);
                    } else if (moderationTab === 'showreels') {
                        const reels = await getRecentShowreelsForModeration();
                        setModerationShowreels(reels);
                    } else if (moderationTab === 'logs') {
                        const logs = await getModerationLogs();
                        setModerationLogs(logs);
                    }
                } else if (activeTab === 'notices') {
                    const n = await getNotices();
                    setNotices(n);
                } else if (activeTab === 'commercial') {
                    const c = await getCampaigns();
                    setAds(c);
                }
            } catch (err: any) {
                console.error("Failed to load tab data:", err);
            }
        };

        if (currentUser) {
            loadTabData();
        }
    }, [activeTab, moderationTab, currentUser]);

    // Live presence polling every 30s to keep user online counters and list fresh
    useEffect(() => {
        if (!currentUser) return;
        const presenceInterval = setInterval(async () => {
            try {
                if (activeTab === 'dashboard' || activeTab === 'users') {
                    const freshUsers = await getAllUsers(true);
                    setUsers(freshUsers);
                }
            } catch (err) {
                console.warn('Presence auto-refresh error in Admin Dashboard:', err);
            }
        }, 30000);

        return () => clearInterval(presenceInterval);
    }, [currentUser, activeTab]);

    // Super Admin Claim Handler
    const handleClaimSuperAdmin = async () => {
        if (!currentUser) return;
        setIsClaimingSuperAdmin(true);
        try {
            await claimSuperAdmin(currentUser.uid);
            const updatedProfile = await getUserProfile(currentUser.uid);
            setCurrentUserProfile(updatedProfile);
            showSuccess("Super Admin privileges claimed and synced successfully!");
        } catch (err: any) {
            showError(err.message || "Failed to claim Super Admin");
        } finally {
            setIsClaimingSuperAdmin(false);
        }
    };

    // Blog Moderation Handlers
    const handleApproveBlog = async (blogId: string) => {
        try {
            await approveBlog(blogId, currentUser?.uid || 'admin');
            setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, status: 'published' } : b));
            showSuccess("Blog approved and published to Cinema Wire & Showcase feed!");
        } catch (err: any) {
            showError("Failed to approve blog: " + err.message);
        }
    };

    const handleRejectBlogSubmit = async () => {
        if (!rejectBlogModal.blogId) return;
        try {
            await rejectBlog(rejectBlogModal.blogId, rejectionReasonInput || 'Does not adhere to editorial standards', currentUser?.uid || 'admin');
            setBlogs(prev => prev.map(b => b.id === rejectBlogModal.blogId ? { ...b, status: 'rejected', rejectionReason: rejectionReasonInput } : b));
            setRejectBlogModal({ isOpen: false, blogId: '', title: '' });
            setRejectionReasonInput('');
            showSuccess("Blog submission rejected with editorial notes.");
        } catch (err: any) {
            showError("Failed to reject blog: " + err.message);
        }
    };

    const handleTakeDownBlog = async (blogId: string) => {
        const reason = prompt("Enter reason for taking down this blog:");
        if (!reason) return;
        try {
            await takeDownBlog(blogId, reason);
            setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, status: 'rejected', rejectionReason: reason } : b));
            showSuccess("Blog taken down successfully.");
        } catch (err: any) {
            showError("Failed to take down blog: " + err.message);
        }
    };

    // Content Removal Handlers
    const handleConfirmRemoval = async () => {
        const { type, id } = removalModal;
        const reason = removalReasonInput.trim() || 'Community guideline violation';
        const adminId = currentUser?.uid || 'super_admin';
        const adminName = currentUserProfile?.displayName || currentUser?.email || 'Super Admin';

        try {
            if (type === 'post') {
                await removePostByAdmin(id, reason, adminId, adminName);
                setModerationPosts(prev => prev.filter(p => p.id !== id));
            } else if (type === 'job') {
                await removeJobByAdmin(id, reason, adminId, adminName);
                setModerationJobs(prev => prev.filter(j => j.id !== id));
            } else if (type === 'showreel') {
                await removeShowreelByAdmin(id, reason, adminId, adminName);
                setModerationShowreels(prev => prev.filter(r => r.id !== id));
            }
            setRemovalModal({ isOpen: false, type: 'post', id: '', title: '' });
            setRemovalReasonInput('');
            showSuccess(`Content removed and action recorded in Moderation Audit Log.`);
        } catch (err: any) {
            showError("Failed to remove content: " + err.message);
        }
    };

    // Notice & Broadcast Handlers
    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noticeTitle.trim() || !noticeBody.trim()) {
            showError("Please enter both title and notice body.");
            return;
        }

        setIsPostingNotice(true);
        try {
            const authorName = currentUserProfile?.displayName || 'Administration';
            const authorUid = currentUser?.uid || 'super_admin';

            await sendNotice({
                title: noticeTitle.trim(),
                body: noticeBody.trim(),
                priority: noticePriority,
                targetAudience: noticeAudience,
                targetUserId: noticeAudience === 'direct_user' ? noticeDirectUid.trim() : undefined,
                createdBy: authorUid,
                createdByName: authorName
            });

            setNoticeTitle('');
            setNoticeBody('');
            setNoticePriority('normal');
            setNoticeAudience('all');
            setNoticeDirectUid('');
            const updatedNotices = await getNotices();
            setNotices(updatedNotices);
            showSuccess("Platform announcement dispatched and delivered to in-app notifications!");
        } catch (err: any) {
            showError("Failed to dispatch notice: " + err.message);
        } finally {
            setIsPostingNotice(false);
        }
    };

    const handleToggleNotice = async (id: string, currentActive: boolean) => {
        try {
            await toggleNoticeActive(id, !currentActive);
            setNotices(prev => prev.map(n => n.id === id ? { ...n, isActive: !currentActive } : n));
            showSuccess(`Notice ${!currentActive ? 'activated' : 'deactivated'}.`);
        } catch (err: any) {
            showError("Failed to update notice status.");
        }
    };

    const handleDeleteNotice = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this notice?")) return;
        try {
            await deleteNotice(id);
            setNotices(prev => prev.filter(n => n.id !== id));
            showSuccess("Notice deleted.");
        } catch (err: any) {
            showError("Failed to delete notice.");
        }
    };

    // Ad Operations Handlers
    const handleAdStatusChange = async (id: string, newStatus: AdCampaign['status']) => {
        try {
            await updateCampaignStatus(id, newStatus);
            setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: newStatus } : ad));
            showSuccess(`Campaign status set to ${newStatus}.`);
        } catch (error) {
            showError("Failed to update campaign status.");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad campaign?')) return;
        try {
            await deleteCampaign(id);
            setAds(prev => prev.filter(ad => ad.id !== id));
            showSuccess("Campaign deleted.");
        } catch (error) {
            showError("Failed to delete campaign.");
        }
    };

    // User Management Handlers
    const handleVerifyUser = async (uid: string, status: 'verified' | 'rejected') => {
        if (confirm(`Mark this user as ${status}?`)) {
            const updatedData = {
                verification: {
                    ...users.find(u => u.uid === uid)?.verification!,
                    status: status,
                    isVerified: status === 'verified'
                }
            };
            await updateUserProfile(uid, updatedData);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, verification: { ...u.verification!, status, isVerified: status === 'verified' } } : u));
            showSuccess(`User verification status: ${status}`);
        }
    };

    const handleStatusUpdateCallback = async (uid: string, status: 'active' | 'suspended' | 'blocked') => {
        await updateUserStatus(uid, status);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, accountStatus: status } : u));
        showSuccess(`Account status updated to ${status}.`);
    };

    const handleAssignRole = async (uid: string, role: string) => {
        const newRole = role === 'none' ? undefined : (role as AdminRoleType);
        await updateUserRole(uid, newRole);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, adminRole: newRole } : u));
        showSuccess(`Updated role to ${newRole || 'User'}.`);
    };

    const handleApproveAccess = async (id: string, status: 'approved' | 'rejected') => {
        const req = accessRequests.find(r => r.id === id);
        try {
            setLoading(true);
            await updateAccessRequestStatus(id, status, req?.email, req?.fullName);
            setAccessRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            showSuccess(`Application ${status} successfully.`);
        } catch (error) {
            showError("Failed to update application status.");
        } finally {
            setLoading(false);
        }
    };

    const handleIssueWarning = async (uid: string) => {
        try {
            const newCount = await issueWarning(uid);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, warningCount: newCount } : u));
            showSuccess(`Warning issued. Total warnings: ${newCount}`);
        } catch (error) {
            showError("Failed to issue warning.");
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm("Permanently delete this user account? This cannot be undone.")) return;
        try {
            await deleteUserAccount(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
            showSuccess("User account deleted permanently.");
        } catch (error) {
            showError("Failed to delete user account.");
        }
    };

    // Diagnostics Test Emails
    const handleSendTestEmail = async (type: EmailType = 'warning') => {
        setLoading(true);
        try {
            const emailjs = await import('@emailjs/browser');
            const { getEmailTemplate } = await import('../services/emailTemplates');
            const template = getEmailTemplate(type, currentUserProfile?.displayName || 'Cinema Admin');

            await emailjs.default.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_m19ckwn',
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lopp3n9',
                {
                    to_email: currentUser?.email || 'contact@ifilmdirectory.com',
                    to_name: currentUserProfile?.displayName || 'Admin',
                    subject: template.subject,
                    message_html: template.html,
                },
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
            showSuccess(`Test ${type.toUpperCase()} email sent to ${currentUser?.email}!`);
        } catch (error: any) {
            showError(`EmailJS error: ${error.text || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f3f4f6] dark:bg-black font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/20"></div>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Authenticating Cinema Command Center...</p>
                </div>
            </div>
        );
    }

    const currentSuperAdmin = isSuperAdmin(currentUserProfile?.email, currentUserProfile);
    const commercialMetrics = calculateCommercialMetrics(ads);
    const pendingBlogsCount = blogs.filter(b => b.status === 'pending').length;
    const onlineUsers = users.filter(u => isUserOnline(u));
    const onlineUsersCount = onlineUsers.length;

    return (
        <div className="flex bg-[#f4f5f8] dark:bg-[#07080a] min-h-screen font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Cinematic Admin Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-white dark:bg-[#0d0e12] border-r border-zinc-200 dark:border-white/10 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="p-6 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <span className="material-symbols-outlined text-black font-black text-2xl">local_movies</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">COMMAND</h1>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    HQ
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase -mt-0.5">5M Collective Services</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar font-display">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            <span>Executive HQ</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setActiveTab('blogs'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'blogs' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">rate_review</span>
                            <span>Blog Review</span>
                        </div>
                        {pendingBlogsCount > 0 && (
                            <span className="size-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                {pendingBlogsCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('moderation'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'moderation' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">security</span>
                            <span>Content Moderation</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'notices' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">campaign</span>
                            <span>Notices & Broadcasts</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setActiveTab('commercial'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'commercial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">monetization_on</span>
                            <span>Commercial & Ads</span>
                        </div>
                        <span className="text-[10px] text-green-500 font-bold">
                            {commercialMetrics.activeCount} Live
                        </span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'users' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                            <span>Users & Roles</span>
                        </div>
                        {onlineUsersCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-black border border-emerald-500/20">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {onlineUsersCount} Live
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('system'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === 'system' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                            <span>System Diagnostics</span>
                        </div>
                    </button>
                </nav>

                {/* Sidebar Bottom Profile & Return */}
                <div className="p-4 border-t border-zinc-200 dark:border-white/10 space-y-2">
                    <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 flex items-center gap-3">
                        <div className="size-9 rounded-full overflow-hidden border border-amber-500 shrink-0">
                            <img src={currentUserProfile?.photoURL || ''} alt="" className="size-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-black truncate">{currentUserProfile?.displayName || 'Admin'}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black tracking-wider truncate">
                                {currentSuperAdmin ? 'Super Admin' : (currentUserProfile?.adminRole || 'Admin')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/home')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-xs font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Return to Main App</span>
                    </button>
                </div>
            </aside>

            {/* Modals Container */}
            <CreateCampaignModal
                isOpen={isCreateAdOpen}
                onClose={() => setIsCreateAdOpen(false)}
                onSuccess={(newAd) => {
                    setAds(prev => [newAd, ...prev]);
                    showSuccess("Campaign created and launched successfully!");
                }}
            />
            <AdminInviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />
            <UserStatusModal
                isOpen={!!selectedUserForStatus}
                onClose={() => setSelectedUserForStatus(null)}
                user={selectedUserForStatus}
                onUpdateStatus={handleStatusUpdateCallback}
                onIssueWarning={handleIssueWarning}
                onDeleteUser={handleDeleteUser}
            />

            {/* Blog Preview Modal */}
            {selectedBlogForPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#121316] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-zinc-200 dark:border-white/10 p-6 shadow-2xl font-display custom-scrollbar">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 mb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Blog Submission Review
                                </span>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">{selectedBlogForPreview.title}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedBlogForPreview(null)}
                                className="size-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {selectedBlogForPreview.coverImage && (
                            <div className="rounded-xl overflow-hidden mb-6 max-h-72 border border-zinc-200 dark:border-white/10">
                                <img src={selectedBlogForPreview.coverImage} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
                            <div className="size-10 rounded-full overflow-hidden border border-zinc-300 dark:border-white/20">
                                <img src={selectedBlogForPreview.authorPhoto || ''} alt="" className="size-full object-cover" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">{selectedBlogForPreview.authorName}</p>
                                <p className="text-[10px] text-zinc-500">{new Date(selectedBlogForPreview.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${selectedBlogForPreview.status === 'published' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : selectedBlogForPreview.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                    {selectedBlogForPreview.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed mb-8">
                            {selectedBlogForPreview.content}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
                            {selectedBlogForPreview.status !== 'published' && (
                                <button
                                    onClick={() => {
                                        handleApproveBlog(selectedBlogForPreview.id || '');
                                        setSelectedBlogForPreview(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-green-500/20"
                                >
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    <span>Approve & Publish</span>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setRejectBlogModal({ isOpen: true, blogId: selectedBlogForPreview.id || '', title: selectedBlogForPreview.title });
                                    setSelectedBlogForPreview(null);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">cancel</span>
                                <span>Reject / Takedown</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Blog Modal */}
            {rejectBlogModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#121316] rounded-2xl max-w-md w-full border border-zinc-200 dark:border-white/10 p-6 shadow-2xl font-display">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">Reject Editorial Submission</h3>
                        <p className="text-xs text-zinc-500 mb-4">Provide clear editorial feedback or guideline citation for "{rejectBlogModal.title}"</p>

                        <textarea
                            value={rejectionReasonInput}
                            onChange={e => setRejectionReasonInput(e.target.value)}
                            placeholder="e.g. Incomplete credits, unverified promotional content, or copyright flags..."
                            rows={4}
                            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-red-500 mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectBlogModal({ isOpen: false, blogId: '', title: '' })}
                                className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-bold uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectBlogSubmit}
                                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Removal Modal */}
            {removalModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#121316] rounded-2xl max-w-md w-full border border-zinc-200 dark:border-white/10 p-6 shadow-2xl font-display">
                        <div className="flex items-center gap-2.5 text-red-500 mb-2">
                            <span className="material-symbols-outlined">delete_forever</span>
                            <h3 className="text-lg font-black">Remove Violating {removalModal.type.toUpperCase()}</h3>
                        </div>
                        <p className="text-xs text-zinc-500 mb-4">
                            You are removing "{removalModal.title}". This action will be permanently recorded in the Moderation Audit Log.
                        </p>

                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Removal Reason *</label>
                        <input
                            type="text"
                            value={removalReasonInput}
                            onChange={e => setRemovalReasonInput(e.target.value)}
                            placeholder="e.g. Harassment, spam, fraudulent casting call..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-red-500 mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRemovalModal({ isOpen: false, type: 'post', id: '', title: '' })}
                                className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-bold uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemoval}
                                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider"
                            >
                                Remove & Audit Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Pane */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                {/* Header Bar */}
                <header className="sticky top-0 z-30 bg-[#f4f5f8]/90 dark:bg-[#07080a]/90 backdrop-blur-md px-6 py-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden size-10 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-900 dark:text-white"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                    {activeTab === 'dashboard' ? 'Executive Overview' :
                                     activeTab === 'blogs' ? 'Blog Check & Editorial' :
                                     activeTab === 'moderation' ? 'Content Moderation Hub' :
                                     activeTab === 'notices' ? 'Platform Notices & Broadcast' :
                                     activeTab === 'commercial' ? 'Commercial & Ad Revenue' :
                                     activeTab === 'users' ? 'User Directory & Roles' : 'System Diagnostic Suite'}
                                </h2>
                            </div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                Authorized Cinema Authority &bull; {currentSuperAdmin ? 'Super Admin Mode' : 'Admin Mode'}
                            </p>
                        </div>
                    </div>

                    {/* Live Presence Pill & Super Admin Claim */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => { setActiveTab('users'); setFilterStatus('online'); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Click to view all online users"
                        >
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                            </span>
                            <span>{onlineUsersCount} Online Now</span>
                        </button>

                        {!currentSuperAdmin ? (
                            <button
                                onClick={handleClaimSuperAdmin}
                                disabled={isClaimingSuperAdmin}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm text-white">stars</span>
                                <span className="text-white">{isClaimingSuperAdmin ? 'Claiming...' : 'Claim Super Admin'}</span>
                            </button>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black tracking-wider uppercase">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <span>Super Admin Verified</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Alerts / Notifications */}
                    {successMessage && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-green-500/5 animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                <p className="font-bold text-xs uppercase tracking-wider">{successMessage}</p>
                            </div>
                            <button onClick={() => setSuccessMessage(null)}>
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-500/5 animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-xl">error</span>
                                <p className="font-bold text-xs uppercase tracking-wider">{errorMessage}</p>
                            </div>
                            <button onClick={() => setErrorMessage(null)}>
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 1: EXECUTIVE DASHBOARD */}
                    {/* ======================================================== */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* KPI Metrics Grid with Real-Time Online Presence */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div
                                    onClick={() => { setActiveTab('users'); setFilterStatus('online'); }}
                                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all shadow-sm group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <span className="relative flex size-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                                            </span>
                                            Active Presence
                                        </span>
                                        <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">wifi_tethering</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-baseline gap-2">
                                        <span>{onlineUsersCount}</span>
                                        <span className="text-xs font-extrabold uppercase text-emerald-500 tracking-wider">Online</span>
                                    </p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                                        Active in past 5 mins &bull; Live
                                    </p>
                                </div>

                                <div
                                    onClick={() => { setActiveTab('users'); setFilterStatus('all'); }}
                                    className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Film Network</span>
                                        <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">groups</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight">{users.length}</p>
                                    <p className="text-[11px] text-zinc-400 mt-1 font-bold">
                                        {users.filter(u => u.verification?.status === 'pending').length} pending verifications
                                    </p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('blogs')}
                                    className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Editorial Blogs</span>
                                        <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">rate_review</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight">{blogs.length}</p>
                                    <p className="text-[11px] text-amber-500 mt-1 font-bold flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-amber-500 animate-ping"></span>
                                        {pendingBlogsCount} submissions awaiting check
                                    </p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('commercial')}
                                    className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Commercial Ads</span>
                                        <div className="size-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">paid</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight">{commercialMetrics.activeCount} Live</p>
                                    <p className="text-[11px] text-zinc-400 mt-1 font-bold">
                                        {commercialMetrics.totalViews.toLocaleString()} views &bull; {commercialMetrics.ctr}% CTR
                                    </p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('notices')}
                                    className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Platform Notices</span>
                                        <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">broadcast_on_personal</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight">{notices.filter(n => n.isActive).length}</p>
                                    <p className="text-[11px] text-zinc-400 mt-1 font-bold">Active platform broadcasts</p>
                                </div>
                            </div>

                            {/* Live Active Presence Monitor */}
                            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                            <span className="material-symbols-outlined text-2xl">sensors</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
                                                    Live Online Users & Presence Monitor
                                                </h4>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    {onlineUsersCount} Online Now
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                Real-time active sessions from filmmakers, crew, and verified talents across India
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async () => {
                                                const fresh = await getAllUsers(true);
                                                setUsers(fresh);
                                                showSuccess("Presence synchronized with live server data");
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-all"
                                            title="Sync Live Presence"
                                        >
                                            <span className="material-symbols-outlined text-sm">sync</span>
                                            <span>Refresh</span>
                                        </button>
                                        <button
                                            onClick={() => { setActiveTab('users'); setFilterStatus('online'); }}
                                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1"
                                        >
                                            <span>View All Online</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>

                                {onlineUsers.length === 0 ? (
                                    <div className="py-8 text-center text-zinc-500 space-y-2">
                                        <span className="material-symbols-outlined text-3xl text-zinc-400">signal_cellular_nodata</span>
                                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">No other users active in the last 5 minutes.</p>
                                        <p className="text-[11px] text-zinc-400">Your presence as Admin is actively broadcasting.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                                        {onlineUsers.map(user => {
                                            const presence = getUserPresenceInfo(user);
                                            return (
                                                <div 
                                                    key={user.uid}
                                                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 group"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="relative size-11 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0 bg-zinc-100 dark:bg-black">
                                                            <img 
                                                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0D8ABC&color=fff`} 
                                                                alt="" 
                                                                className="size-full object-cover" 
                                                            />
                                                            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1014]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                                                                    {user.displayName || 'Filmmaker'}
                                                                </p>
                                                                {user.verification_tier && (
                                                                    <span className="material-symbols-outlined text-xs text-amber-400 select-none filled">verified</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-zinc-500 capitalize truncate">
                                                                {user.role?.replace('_', ' ') || 'Filmmaker'} {user.location ? `• ${user.location}` : ''}
                                                            </p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                                                <span className="size-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                <span>{presence.statusText}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => navigate(`/profile/${user.username || user.uid}`)}
                                                            className="p-2 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-emerald-500 hover:text-white text-zinc-700 dark:text-zinc-300 transition-colors"
                                                            title="View Public Profile"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedUserForStatus(user)}
                                                            className="p-2 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-amber-500 hover:text-white text-zinc-700 dark:text-zinc-300 transition-colors"
                                                            title="Inspect / Manage User"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">tune</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
                                <h3 className="text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
                                    Direct Mission Shortcuts
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => setActiveTab('blogs')}
                                        className="p-3.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-left transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform">article</span>
                                        <p className="text-xs font-black mt-1">Review Blogs</p>
                                        <p className="text-[10px] text-zinc-500">Approve or reject submissions</p>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('moderation')}
                                        className="p-3.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-left transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform">delete_sweep</span>
                                        <p className="text-xs font-black mt-1">Content Removal</p>
                                        <p className="text-[10px] text-zinc-500">Moderate reported posts & jobs</p>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('notices')}
                                        className="p-3.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-left transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-purple-500 group-hover:scale-110 transition-transform">notification_important</span>
                                        <p className="text-xs font-black mt-1">Dispatch Notice</p>
                                        <p className="text-[10px] text-zinc-500">Broadcast banner to users</p>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('commercial'); setIsCreateAdOpen(true); }}
                                        className="p-3.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-left transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-green-500 group-hover:scale-110 transition-transform">add_business</span>
                                        <p className="text-xs font-black mt-1">New Ad Campaign</p>
                                        <p className="text-[10px] text-zinc-500">Deploy sponsor placement</p>
                                    </button>
                                </div>
                            </div>

                            {/* Recent Submissions & Activities Split */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Pending Blogs Queue Card */}
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">rate_review</span>
                                            <span>Editorial Queue ({pendingBlogsCount} Pending)</span>
                                        </h4>
                                        <button
                                            onClick={() => setActiveTab('blogs')}
                                            className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline uppercase tracking-wider"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {blogs.filter(b => b.status === 'pending').length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic py-4">No pending blog submissions. All caught up!</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {blogs.filter(b => b.status === 'pending').slice(0, 3).map(blog => (
                                                <div key={blog.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{blog.title}</p>
                                                        <p className="text-[10px] text-zinc-500">By {blog.authorName} &bull; {new Date(blog.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => setSelectedBlogForPreview(blog)}
                                                            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white text-[10px] font-bold"
                                                        >
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveBlog(blog.id || '')}
                                                            className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Notices Card */}
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500 text-lg">campaign</span>
                                            <span>Active Platform Broadcasts</span>
                                        </h4>
                                        <button
                                            onClick={() => setActiveTab('notices')}
                                            className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline uppercase tracking-wider"
                                        >
                                            Manage
                                        </button>
                                    </div>

                                    {notices.filter(n => n.isActive).length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic py-4">No active broadcasts currently running.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {notices.filter(n => n.isActive).slice(0, 3).map(notice => (
                                                <div key={notice.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-zinc-900 dark:text-white">{notice.title}</span>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${notice.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : notice.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {notice.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-2">{notice.body}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 2: BLOG CHECK & EDITORIAL QUEUE */}
                    {/* ======================================================== */}
                    {activeTab === 'blogs' && (
                        <div className="space-y-6">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 bg-white dark:bg-[#0e1014] p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10">
                                    {(['all', 'pending', 'published', 'rejected'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setBlogFilter(tab)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${blogFilter === tab ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                        >
                                            {tab} ({tab === 'all' ? blogs.length : blogs.filter(b => (b.status || 'pending') === tab).length})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Blogs Grid */}
                            {blogs.filter(b => blogFilter === 'all' || (b.status || 'pending') === blogFilter).length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-[#0e1014] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
                                    <span className="material-symbols-outlined text-4xl text-zinc-400 mb-2">article</span>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">No blogs match the selected filter</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {blogs.filter(b => blogFilter === 'all' || (b.status || 'pending') === blogFilter).map(blog => (
                                        <div key={blog.id} className="bg-white dark:bg-[#0e1014] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm group">
                                            {/* Cover thumbnail */}
                                            <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                                                {blog.coverImage ? (
                                                    <img src={blog.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center text-zinc-400">
                                                        <span className="material-symbols-outlined text-4xl">movie</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                                                        blog.status === 'published' ? 'bg-green-500 text-white' :
                                                        blog.status === 'rejected' ? 'bg-red-500 text-white' :
                                                        'bg-amber-500 text-white'
                                                    }`}>
                                                        {blog.status || 'pending review'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col space-y-3 font-display">
                                                <h4 className="text-sm font-black line-clamp-1 text-zinc-900 dark:text-white" title={blog.title}>
                                                    {blog.title}
                                                </h4>
                                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                                    {blog.excerpt || blog.content}
                                                </p>

                                                <div className="pt-2 flex items-center gap-2 border-t border-zinc-100 dark:border-white/5">
                                                    <div className="size-6 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0">
                                                        <img src={blog.authorPhoto || ''} alt="" className="size-full object-cover" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 truncate">{blog.authorName}</span>
                                                    <span className="text-[10px] text-zinc-400 ml-auto">{new Date(blog.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                {blog.rejectionReason && (
                                                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold">
                                                        Reason: {blog.rejectionReason}
                                                    </div>
                                                )}

                                                {/* Action Bar */}
                                                <div className="pt-3 mt-auto flex items-center gap-2 border-t border-zinc-100 dark:border-white/5">
                                                    <button
                                                        onClick={() => setSelectedBlogForPreview(blog)}
                                                        className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-xs font-bold transition-colors"
                                                    >
                                                        Inspect
                                                    </button>
                                                    {blog.status !== 'published' ? (
                                                        <button
                                                            onClick={() => handleApproveBlog(blog.id || '')}
                                                            className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTakeDownBlog(blog.id || '')}
                                                            className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors"
                                                            title="Take down live blog"
                                                        >
                                                            Takedown
                                                        </button>
                                                    )}
                                                    {blog.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => setRejectBlogModal({ isOpen: true, blogId: blog.id || '', title: blog.title })}
                                                            className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors"
                                                            title="Reject with notes"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 3: CONTENT REMOVAL & MODERATION HUB */}
                    {/* ======================================================== */}
                    {activeTab === 'moderation' && (
                        <div className="space-y-6">
                            {/* Moderation Sub-tabs */}
                            <div className="flex bg-white dark:bg-[#0e1014] p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
                                {(
                                    [
                                        { id: 'posts', label: 'Community Posts', icon: 'chat' },
                                        { id: 'jobs', label: 'Job Castings', icon: 'work' },
                                        { id: 'showreels', label: 'Showreels & Clips', icon: 'smart_display' },
                                        { id: 'logs', label: 'Audit Log Trail', icon: 'history' },
                                    ] as const
                                ).map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setModerationTab(item.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${moderationTab === item.id ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Posts Moderation List */}
                            {moderationTab === 'posts' && (
                                <div className="space-y-4">
                                    {moderationPosts.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-[#0e1014] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No recent posts found in feed</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {moderationPosts.map(post => (
                                                <div key={post.id} className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 space-y-3 font-display">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10">
                                                                <img src={post.authorPhoto || ''} alt="" className="size-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold">{post.authorName || 'User'}</p>
                                                                <p className="text-[10px] text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setRemovalModal({ isOpen: true, type: 'post', id: post.id, title: (post.content || '').substring(0, 30) + '...' })}
                                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>

                                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                                                        {post.content || post.text}
                                                    </p>

                                                    {post.mediaUrl && (
                                                        <div className="rounded-xl overflow-hidden max-h-40 border border-zinc-200 dark:border-white/10">
                                                            <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Jobs Moderation List */}
                            {moderationTab === 'jobs' && (
                                <div className="space-y-4">
                                    {moderationJobs.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-[#0e1014] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No active casting calls found</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {moderationJobs.map(job => (
                                                <div key={job.id} className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 space-y-3 font-display">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-black text-zinc-900 dark:text-white">{job.title}</h4>
                                                            <p className="text-[10px] text-zinc-500">{job.productionHouse || job.company} &bull; {job.location}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setRemovalModal({ isOpen: true, type: 'job', id: job.id, title: job.title })}
                                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{job.description}</p>
                                                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/5 text-[10px] text-zinc-400">
                                                        <span>Budget: {job.budget || 'Negotiable'}</span>
                                                        <span>&bull;</span>
                                                        <span>Role: {job.roleRequired || 'Talent'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Showreels Moderation List */}
                            {moderationTab === 'showreels' && (
                                <div className="space-y-4">
                                    {moderationShowreels.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-[#0e1014] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No showreels found</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {moderationShowreels.map(reel => (
                                                <div key={reel.id} className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 space-y-3 font-display">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-black text-zinc-900 dark:text-white">{reel.title || 'Showreel'}</h4>
                                                            <p className="text-[10px] text-zinc-500">By {reel.userName || reel.creatorName || 'Creator'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setRemovalModal({ isOpen: true, type: 'showreel', id: reel.id, title: reel.title || 'Showreel' })}
                                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 break-all">{reel.videoUrl}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audit Log Trail Table */}
                            {moderationTab === 'logs' && (
                                <div className="bg-white dark:bg-[#0e1014] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center">
                                        <h4 className="font-black text-xs uppercase tracking-wider">Historical Moderation Audit Trail</h4>
                                        <span className="text-xs text-zinc-500">{moderationLogs.length} Records</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/10 uppercase tracking-wider font-bold text-zinc-500">
                                                <tr>
                                                    <th className="p-3.5">Action</th>
                                                    <th className="p-3.5">Target Type</th>
                                                    <th className="p-3.5">Target ID</th>
                                                    <th className="p-3.5">Reason</th>
                                                    <th className="p-3.5">Authorized By</th>
                                                    <th className="p-3.5">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-display">
                                                {moderationLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                                                        <td className="p-3.5">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 font-bold uppercase text-zinc-400">{log.targetType}</td>
                                                        <td className="p-3.5 font-mono text-[11px] text-zinc-500">{log.targetId.substring(0, 10)}...</td>
                                                        <td className="p-3.5 text-zinc-800 dark:text-zinc-200 max-w-xs truncate">{log.reason}</td>
                                                        <td className="p-3.5 font-bold">{log.adminName || log.adminId}</td>
                                                        <td className="p-3.5 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 4: NOTICES & PLATFORM BROADCASTS */}
                    {/* ======================================================== */}
                    {activeTab === 'notices' && (
                        <div className="space-y-6">
                            {/* Broadcast Composer */}
                            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 shadow-sm font-display">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="size-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-xl">broadcast_on_personal</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                            Dispatch Platform Broadcast
                                        </h3>
                                        <p className="text-[11px] text-zinc-500">
                                            Sends instant announcement banner and pushes notifications into user notification center
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleCreateNotice} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Announcement Title *</label>
                                            <input
                                                type="text"
                                                value={noticeTitle}
                                                onChange={e => setNoticeTitle(e.target.value)}
                                                placeholder="e.g. Scheduled System Upgrade: Oct 20th"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Priority Level</label>
                                            <select
                                                value={noticePriority}
                                                onChange={e => setNoticePriority(e.target.value as any)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                            >
                                                <option value="normal">Normal Priority (Blue)</option>
                                                <option value="high">High Importance (Amber)</option>
                                                <option value="urgent">Urgent / Emergency (Red)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Target Audience</label>
                                        <select
                                            value={noticeAudience}
                                            onChange={e => setNoticeAudience(e.target.value as any)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                        >
                                            <option value="all">Global Broadcast (All Verified & Standard Users)</option>
                                            <option value="actors">Guild: Actors & Performers Only</option>
                                            <option value="directors">Guild: Directors & Filmmakers Only</option>
                                            <option value="crew">Guild: Technical Crew & Cinematographers Only</option>
                                            <option value="producers">Producers & Production Houses Only</option>
                                            <option value="direct_user">Direct User Warning / Advisory</option>
                                        </select>
                                    </div>

                                    {noticeAudience === 'direct_user' && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Recipient User UID *</label>
                                            <input
                                                type="text"
                                                value={noticeDirectUid}
                                                onChange={e => setNoticeDirectUid(e.target.value)}
                                                placeholder="Enter recipient's UID..."
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Notice Message Body *</label>
                                        <textarea
                                            value={noticeBody}
                                            onChange={e => setNoticeBody(e.target.value)}
                                            placeholder="Write detailed instructions, platform rules, or announcements..."
                                            rows={3}
                                            className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isPostingNotice}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base text-white">send</span>
                                            <span className="text-white">{isPostingNotice ? 'Broadcasting...' : 'Broadcast Notice Now'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Active Notices Table */}
                            <div className="bg-white dark:bg-[#0e1014] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm font-display">
                                <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center">
                                    <h4 className="font-black text-xs uppercase tracking-wider">Dispatched Notices History</h4>
                                    <span className="text-xs text-zinc-500">{notices.length} Notices</span>
                                </div>

                                <div className="divide-y divide-zinc-200 dark:divide-white/5">
                                    {notices.map(n => (
                                        <div key={n.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                                            <div className="space-y-1 max-w-2xl">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${n.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : n.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {n.priority}
                                                    </span>
                                                    <span className="text-xs font-black text-zinc-900 dark:text-white">{n.title}</span>
                                                    <span className="text-[10px] text-zinc-500 uppercase">&bull; Audience: {n.targetAudience}</span>
                                                </div>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400">{n.body}</p>
                                                <p className="text-[10px] text-zinc-400">By {n.createdByName} on {new Date(n.createdAt).toLocaleDateString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggleNotice(n.id!, !!n.isActive)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${n.isActive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400 hover:bg-zinc-300'}`}
                                                >
                                                    {n.isActive ? 'Active (Live)' : 'Disabled'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNotice(n.id!)}
                                                    className="size-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 5: COMMERCIAL SECTION & ADS */}
                    {/* ======================================================== */}
                    {activeTab === 'commercial' && (
                        <div className="space-y-6">
                            {/* Commercial KPI Banners */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-display">
                                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Live Campaigns</span>
                                    <p className="text-2xl font-black mt-1 text-green-500">{commercialMetrics.activeCount}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Impressions</span>
                                    <p className="text-2xl font-black mt-1">{commercialMetrics.totalViews.toLocaleString()}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Clicks</span>
                                    <p className="text-2xl font-black mt-1 text-amber-500">{commercialMetrics.totalClicks.toLocaleString()}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avg Click-Through (CTR)</span>
                                    <p className="text-2xl font-black mt-1 text-blue-500">{commercialMetrics.ctr}%</p>
                                </div>
                            </div>

                            {/* Header Action */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0e1014] p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm font-display">
                                <div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">Commercial Ad Deployments</h3>
                                    <p className="text-xs text-zinc-500">Manage brand partnerships, sponsors, and impression monetization</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateAdOpen(true)}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-base font-bold text-white">add_circle</span>
                                    <span className="text-white">New Ad Campaign</span>
                                </button>
                            </div>

                            {/* Ads Grid */}
                            {ads.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-[#0e1014] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
                                    <span className="material-symbols-outlined text-4xl text-zinc-400 mb-2">campaign</span>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">No active commercial campaigns found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ads.map(ad => (
                                        <div key={ad.id} className="bg-white dark:bg-[#0e1014] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm font-display">
                                            {/* Preview */}
                                            <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative group overflow-hidden">
                                                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ad.status === 'active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                        {ad.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">{ad.title}</h4>
                                                        {ad.clientName && (
                                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                                                Client: {ad.clientName} {ad.dealValue ? `(₹${ad.dealValue.toLocaleString()})` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5">
                                                        {ad.placement.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-white/5">
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-zinc-400">Impressions</span>
                                                        <span className="font-bold text-zinc-900 dark:text-white">{ad.views}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-zinc-400">Clicks</span>
                                                        <span className="font-bold text-amber-500">{ad.clicks}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-white/5">
                                                    {ad.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleAdStatusChange(ad.id!, 'paused')}
                                                            className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold"
                                                        >
                                                            Pause
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAdStatusChange(ad.id!, 'active')}
                                                            className="flex-1 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 text-xs font-bold"
                                                        >
                                                            Resume
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAd(ad.id!)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 6: USERS & ADMIN ROLE HIERARCHY */}
                    {/* ======================================================== */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 font-display">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="flex bg-white dark:bg-[#0e1014] p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
                                    <button
                                        onClick={() => setFilterStatus('all')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        All Accounts ({users.length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('online')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'online' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'}`}
                                    >
                                        <span className="size-2 rounded-full bg-emerald-500"></span>
                                        Online Now ({onlineUsersCount})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('pending')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Pending Verifications ({users.filter(u => u.verification?.status === 'pending').length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('applications')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === 'applications' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Access Pool ({accessRequests.filter(r => r.status === 'pending').length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('verified')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === 'verified' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Elite Members ({users.filter(u => u.verification?.status === 'verified').length})
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsInviteOpen(true)}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                                >
                                    <span className="material-symbols-outlined text-base text-white">person_add</span>
                                    <span className="text-white">Issue Invite</span>
                                </button>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white dark:bg-[#0e1014] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/10 text-zinc-500 uppercase font-black tracking-wider">
                                                <th className="p-4">Filmmaker / Identity</th>
                                                <th className="p-4">Craft & Role</th>
                                                <th className="p-4">Presence</th>
                                                <th className="p-4">Verification</th>
                                                <th className="p-4">Account Status</th>
                                                <th className="p-4">Admin Privileges</th>
                                                <th className="p-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                            {filterStatus === 'applications' ? (
                                                accessRequests.map(r => (
                                                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-4">
                                                            <p className="font-black text-zinc-900 dark:text-white">{r.fullName}</p>
                                                            <p className="text-[10px] text-zinc-500">{r.email}</p>
                                                        </td>
                                                        <td className="p-4 font-bold text-zinc-600 dark:text-zinc-300 capitalize">{r.role}</td>
                                                        <td className="p-4">
                                                            <span className="text-[10px] text-zinc-400">Application</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.status === 'approved' ? 'bg-green-500/10 text-green-500' : r.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-[10px] text-zinc-400">Applicant Pool</span>
                                                        </td>
                                                        <td className="p-4">
                                                            {r.portfolioLink ? (
                                                                <a href={r.portfolioLink} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline flex items-center gap-1 font-bold">
                                                                    <span className="material-symbols-outlined text-xs">link</span>
                                                                    <span>Portfolio</span>
                                                                </a>
                                                            ) : <span className="text-zinc-400 italic">No link</span>}
                                                        </td>
                                                        <td className="p-4">
                                                            {r.status === 'pending' ? (
                                                                <div className="flex gap-1.5">
                                                                    <button
                                                                        onClick={() => handleApproveAccess(r.id, 'approved')}
                                                                        className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-[10px] font-extrabold uppercase"
                                                                    >
                                                                        Invite
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApproveAccess(r.id, 'rejected')}
                                                                        className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-extrabold uppercase"
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-zinc-400 italic">Processed</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                users
                                                    .filter(u => {
                                                        if (filterStatus === 'all') return true;
                                                        if (filterStatus === 'online') return isUserOnline(u);
                                                        return u.verification?.status === filterStatus;
                                                    })
                                                    .map(u => {
                                                        const presence = getUserPresenceInfo(u);
                                                        return (
                                                            <tr key={u.uid} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative size-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0">
                                                                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'User')}&background=0D8ABC&color=fff`} alt="" className="size-full object-cover" />
                                                                        {presence.isOnline && (
                                                                            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e1014]" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-black text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                                                                            <span>{u.displayName || 'Unnamed Filmmaker'}</span>
                                                                            {presence.isOnline && (
                                                                                <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Online now" />
                                                                            )}
                                                                        </p>
                                                                        <p className="text-[10px] text-zinc-500 truncate">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="p-4 font-bold text-zinc-600 dark:text-zinc-300 capitalize">
                                                                {u.role?.replace('_', ' ') || 'Filmmaker'}
                                                            </td>

                                                            {/* Presence Status */}
                                                            <td className="p-4">
                                                                {presence.isOnline ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[10px]">
                                                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        <span>Online now</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                                        {presence.statusText}
                                                                    </span>
                                                                )}
                                                            </td>

                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${u.verification?.status === 'verified' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : u.verification?.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-200 dark:bg-white/10 text-zinc-400'}`}>
                                                                {u.verification?.status || 'None'}
                                                            </span>
                                                        </td>

                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase w-max ${u.accountStatus === 'blocked' ? 'bg-red-500/10 text-red-500' : u.accountStatus === 'suspended' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                                                                    {u.accountStatus || 'active'}
                                                                </span>
                                                                {(u.warningCount || 0) > 0 && (
                                                                    <span className="text-[9px] font-bold text-red-500">
                                                                        {u.warningCount} Warnings
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-4">
                                                            <select
                                                                value={u.adminRole || 'none'}
                                                                onChange={(e) => handleAssignRole(u.uid, e.target.value)}
                                                                className="text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 outline-none"
                                                            >
                                                                <option value="none">Standard User</option>
                                                                <option value="super_admin">Super Admin</option>
                                                                <option value="admin">Admin</option>
                                                                <option value="moderator">Moderator</option>
                                                                <option value="commercial_manager">Commercial Manager</option>
                                                                <option value="user_manager">User Manager</option>
                                                            </select>
                                                        </td>

                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1.5">
                                                                {u.verification?.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerifyUser(u.uid, 'verified')}
                                                                            className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-[10px] font-extrabold uppercase"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerifyUser(u.uid, 'rejected')}
                                                                            className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-extrabold uppercase"
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleIssueWarning(u.uid)}
                                                                    title="Issue Warning Notice"
                                                                    className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">warning</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedUserForStatus(u)}
                                                                    title="Change Account Status"
                                                                    className="p-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 7: SYSTEM DIAGNOSTIC SUITE */}
                    {/* ======================================================== */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 font-display">
                            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1014] border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Automated Cinema Email Engine Diagnostics
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    Trigger and verify automated transactional emails sent to film professionals
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    <button
                                        onClick={() => handleSendTestEmail('invite')}
                                        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold text-xs uppercase transition-all"
                                    >
                                        Send Invite Test
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('welcome')}
                                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20 font-bold text-xs uppercase transition-all"
                                    >
                                        Send Welcome Test
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('warning')}
                                        className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs uppercase transition-all"
                                    >
                                        Send Warning Test
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('blocked')}
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs uppercase transition-all"
                                    >
                                        Send Suspension Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
