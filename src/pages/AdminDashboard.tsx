import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole, isSuperAdmin, updateUserProfile, getUserProfile, updateUserStatus, getAccessRequests, updateAccessRequestStatus, issueWarning, deleteUserAccount } from '../services/userService';
import type { UserProfile, AccessRequest } from '../services/userService';
import { getCampaigns, updateCampaignStatus, deleteCampaign } from '../services/adService';
import type { AdCampaign } from '../services/adService';
import CreateCampaignModal from '../components/CreateCampaignModal';
import UserStatusModal from '../components/UserStatusModal';
import AdminInviteModal from '../components/AdminInviteModal';
import { type EmailType } from '../services/emailTemplates';

type AdminTab = 'dashboard' | 'users' | 'ads' | 'system';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [ads, setAds] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    // Modals
    const [isCreateAdOpen, setIsCreateAdOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserProfile | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'applications'>('all');

    // Initial Check & Fetch Profile
    useEffect(() => {
        const checkAdmin = async () => {
            if (!currentUser) {
                setLoading(false);
                navigate('/login');
                return;
            }

            try {
                const profile = await getUserProfile(currentUser.uid);
                setCurrentUserProfile(profile);

                const isAdmin = profile?.adminRole || isSuperAdmin(profile?.email);
                if (!isAdmin) {
                    navigate('/home');
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
                navigate('/home');
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [currentUser, navigate]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (activeTab === 'users' || activeTab === 'dashboard') {
                const [fetchedUsers, fetchedRequests] = await Promise.all([
                    getAllUsers(),
                    getAccessRequests()
                ]);
                setUsers(fetchedUsers);
                setAccessRequests(fetchedRequests);
            } else if (activeTab === 'ads') {
                const fetchedAds = await getCampaigns();
                setAds(fetchedAds);
            }
            setLoading(false);
        };
        fetchData();
    }, [activeTab]);

    const handleVerifyUser = async (uid: string, status: 'verified' | 'rejected') => {
        if (confirm(`Are you sure you want to mark this user as ${status}?`)) {
            const updatedData = {
                verification: {
                    ...users.find(u => u.uid === uid)?.verification!,
                    status: status,
                    isVerified: status === 'verified'
                }
            };
            await updateUserProfile(uid, updatedData);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, verification: { ...u.verification!, status, isVerified: status === 'verified' } } : u));
        }
    };

    const handleStatusUpdateCallback = async (uid: string, status: 'active' | 'suspended' | 'blocked') => {
        await updateUserStatus(uid, status);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, accountStatus: status } : u));
    };

    const handleAssignRole = async (uid: string, role: string) => {
        const newRole = role === 'none' ? undefined : role as 'super_admin' | 'user_manager' | 'ad_manager';
        await updateUserRole(uid, newRole);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, adminRole: newRole } : u));
    };

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleApproveAccess = async (id: string, status: 'approved' | 'rejected') => {
        const req = accessRequests.find(r => r.id === id);
        try {
            setLoading(true);
            await updateAccessRequestStatus(id, status, req?.email, req?.fullName);
            setAccessRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            setSuccessMessage(`Application ${status} successfully! ${status === 'approved' ? 'Invitation email sent.' : ''}`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Failed to update application status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueWarning = async (uid: string) => {
        try {
            const newCount = await issueWarning(uid);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, warningCount: newCount } : u));
            setSuccessMessage(`Warning issued successfully.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Failed to issue warning", error);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        try {
            await deleteUserAccount(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
            setSuccessMessage(`User account deleted permanently.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSendTestEmail = async (type: EmailType = 'warning') => {
        setLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            const emailjs = await import('@emailjs/browser');
            const { getEmailTemplate } = await import('../services/emailTemplates');
            const template = getEmailTemplate(type, 'Junaid Siddiqui');

            await emailjs.default.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_m19ckwn',
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lopp3n9',
                {
                    to_email: 'contact@ifilmdirectory.com',
                    to_name: 'Test Admin',
                    subject: template.subject,
                    message_html: template.html,
                },
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );

            setSuccessMessage(`Success! ${type.toUpperCase()} test email sent to noreply@ifilmdirectory.com.`);
            setTimeout(() => setSuccessMessage(null), 6000);
        } catch (error: any) {
            console.error(`Failed to send ${type} email via EmailJS`, error);
            setErrorMessage(`Error: ${error.text || error.message}`);
            setTimeout(() => setErrorMessage(null), 6000);
        } finally {
            setLoading(false);
        }
    };

    const handleAdStatusChange = async (id: string, newStatus: AdCampaign['status']) => {
        try {
            await updateCampaignStatus(id, newStatus);
            setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: newStatus } : ad));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
            try {
                await deleteCampaign(id);
                setAds(prev => prev.filter(ad => ad.id !== id));
            } catch (error) {
                console.error("Failed to delete campaign", error);
            }
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#f3f4f6] dark:bg-black font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent"></div>
                <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Command Center...</p>
            </div>
        </div>
    );

    const currentRole = currentUserProfile?.adminRole || (isSuperAdmin(currentUserProfile?.email) ? 'super_admin' : null);
    const canManageUsers = currentRole === 'super_admin' || currentRole === 'user_manager';
    const canManageAds = currentRole === 'super_admin' || currentRole === 'ad_manager';

    return (
        <div className="flex bg-[#f3f4f6] dark:bg-black min-h-screen font-sans text-zinc-900 dark:text-white antialiased">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Premium Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-white dark:bg-[#0d0d0d] border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#e65c00] flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <span className="material-symbols-outlined text-white">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">COMMAND</h1>
                            <p className="text-[10px] font-black text-[#f97316] tracking-[0.2em] -mt-1 uppercase">Control Panel</p>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'dashboard' ? 'bg-[#f3f4f6] dark:bg-zinc-800 text-[#f97316] shadow-inner' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </button>
                        {canManageUsers && (
                            <button
                                onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'users' ? 'bg-[#f3f4f6] dark:bg-zinc-800 text-[#f97316] shadow-inner' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined">group</span>
                                User Management
                            </button>
                        )}
                        {canManageAds && (
                            <button
                                onClick={() => { setActiveTab('ads'); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'ads' ? 'bg-[#f3f4f6] dark:bg-zinc-800 text-[#f97316] shadow-inner' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined">campaign</span>
                                Advertisement
                            </button>
                        )}
                        {currentRole === 'super_admin' && (
                            <button
                                onClick={() => { setActiveTab('system'); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'system' ? 'bg-[#f3f4f6] dark:bg-zinc-800 text-[#f97316] shadow-inner' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined">settings_suggest</span>
                                System Config
                            </button>
                        )}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-primary transition-all"
                        >
                            <span className="material-symbols-outlined">home</span>
                            Return Home
                        </button>
                    </div>
                </div>
            </aside>

            {/* Modals */}
            <CreateCampaignModal
                isOpen={isCreateAdOpen}
                onClose={() => setIsCreateAdOpen(false)}
                onSuccess={(newAd) => setAds(prev => [newAd, ...prev])}
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

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <header className="sticky top-0 z-30 bg-[#f3f4f6]/80 dark:bg-black/80 backdrop-blur-md px-4 md:px-8 py-4 md:py-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden size-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white capitalize tracking-tight">
                                    {activeTab.replace('_', ' ')}
                                </h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Control Center</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-black text-zinc-900 dark:text-white">{currentUserProfile?.displayName}</span>
                                <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-tighter">{currentRole?.replace('_', ' ')}</span>
                            </div>
                            <div className="size-10 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                                <img src={currentUserProfile?.photoURL || ''} alt="" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 pt-6">
                    <div className="max-w-7xl mx-auto">
                    {/* Feedback Notifications */}
                    {successMessage && (
                        <div className="mb-6 bg-green-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-green-500/20 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined font-black">check_circle</span>
                                <p className="font-bold text-sm tracking-tight">{successMessage}</p>
                            </div>
                            <button onClick={() => setSuccessMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-600/20 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined font-black">error</span>
                                <p className="font-bold text-sm tracking-tight">{errorMessage}</p>
                            </div>
                            <button onClick={() => setErrorMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    )}

                    {/* High Priority Alerts */}
                    {users.some(u => (u.abuseReports || 0) > 2) && (
                        <div className="mb-8 bg-gradient-to-r from-red-600 to-red-800 text-white p-5 rounded-2xl flex items-start gap-4 shadow-xl shadow-red-600/20 animate-pulse">
                            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined font-black">warning</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg">System Alert: Critical Abuse Level</h3>
                                <p className="text-sm font-medium text-white/80 mt-0.5">
                                    Multiple accounts have exceeded the safety threshold for abuse reports. Immediate suspension review required.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <span className="material-symbols-outlined text-6xl">groups_3</span>
                                    </div>
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Total Network</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{users.length || '-'}</p>
                                        <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">+2 this week</span>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 mt-1 italic">Verified Professionals</p>
                                </div>

                                <div
                                    onClick={() => { setActiveTab('users'); setFilterStatus('pending'); }}
                                    className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer group hover:border-[#f97316] transition-all"
                                >
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Pending Review</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-[#f97316] tracking-tighter">
                                            {users.filter(u => u.verification?.status === 'pending').length || '-'}
                                        </p>
                                        <div className="size-2 rounded-full bg-[#f97316] animate-ping"></div>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 mt-1 italic">Verification Requests</p>
                                </div>

                                <div
                                    onClick={() => { setActiveTab('users'); setFilterStatus('applications'); }}
                                    className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer group hover:border-blue-500 transition-all"
                                >
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">New Applicants</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-blue-500 tracking-tighter">
                                            {accessRequests.filter(r => r.status === 'pending').length || '0'}
                                        </p>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 mt-1 italic">Exclusive Access Pool</p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('ads')}
                                    className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer group hover:border-green-500 transition-all"
                                >
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Ad Performance</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-green-500 tracking-tighter">{ads.filter(a => a.status === 'active').length}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Live Ad Units</p>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 mt-1 italic">Currently Active</p>
                                </div>
                            </div>

                            {/* Recent Activity Mini-List */}
                            <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-black text-lg tracking-tight">Recent System Activity</h4>
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className="text-xs font-black text-[#f97316] uppercase tracking-widest hover:underline"
                                    >
                                        Review All Users
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {users.slice(0, 5).map(u => (
                                        <div key={u.uid} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                    <img src={u.photoURL || ''} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{u.displayName}</p>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{u.role || 'Professional'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${u.verification?.status === 'verified' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                                                {u.verification?.status || 'Active'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Management View */}
                    {activeTab === 'users' && canManageUsers && (
                        <div className="space-y-6">
                            {/* Improved Action Bar */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-2">
                                <div className="flex bg-white dark:bg-[#0d0d0d] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                                    <button
                                        onClick={() => setFilterStatus('all')}
                                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Command Pool
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('pending')}
                                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Verifications ({users.filter(u => u.verification?.status === 'pending').length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('applications')}
                                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'applications' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Applicants ({accessRequests.filter(r => r.status === 'pending').length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('verified')}
                                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'verified' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        Elite Members
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsInviteOpen(true)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-[#f97316] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                    Issue Invitation
                                </button>
                            </div>

                            <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-3xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-50 dark:bg-black/20 border-b border-border-light dark:border-border-dark">
                                                <th className="p-4 text-sm font-semibold text-zinc-500">User / Applicant</th>
                                                <th className="p-4 text-sm font-semibold text-zinc-500">Verification / Role</th>
                                                <th className="p-4 text-sm font-semibold text-zinc-500">Status</th>
                                                <th className="p-4 text-sm font-semibold text-zinc-500">Proofs / Links</th>
                                                {currentRole === 'super_admin' && filterStatus !== 'applications' && <th className="p-4 text-sm font-semibold text-zinc-500">Admin Role</th>}
                                                <th className="p-4 text-sm font-semibold text-zinc-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Show Access Requests if filter is 'applications' or 'all' */}
                                            {(filterStatus === 'all' || filterStatus === 'applications' || filterStatus === 'verified') && accessRequests
                                                .filter(r => {
                                                    if (filterStatus === 'all') return r.status === 'pending' || r.status === 'approved';
                                                    if (filterStatus === 'applications') return true;
                                                    if (filterStatus === 'verified') return r.status === 'approved';
                                                    return false;
                                                })
                                                .map(r => (
                                                    <tr key={r.id} className="border-b border-border-light dark:border-border-dark bg-purple-50/10 dark:bg-purple-900/5 hover:bg-purple-50/20">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-purple-600">person_add</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-zinc-900 dark:text-white capitalize">{r.fullName}</p>
                                                                    <p className="text-xs text-zinc-500">{r.email}</p>
                                                                    {r.referredBy && (
                                                                        <p className="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-[12px]">group</span>
                                                                            Ref: {r.referredBy.substring(0, 8)}...
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xs font-semibold capitalize text-purple-600">
                                                            {r.status === 'approved' ? 'INVITED MEMBER' : 'NEW APPLICANT'} ({r.role})
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                                r.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {r.status === 'approved' ? 'Invited' : r.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs space-y-1">
                                                            <a href={r.portfolioLink} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-medium">
                                                                <span className="material-symbols-outlined text-sm">link</span> Portfolio Link
                                                            </a>
                                                            {r.unionCardFrontUrl && (
                                                                <a href={r.unionCardFrontUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 font-medium">
                                                                    <span className="material-symbols-outlined text-sm">badge</span> Card Front
                                                                </a>
                                                            )}
                                                            {r.unionCardBackUrl && (
                                                                <a href={r.unionCardBackUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 font-medium">
                                                                    <span className="material-symbols-outlined text-sm">badge</span> Card Back
                                                                </a>
                                                            )}
                                                        </td>
                                                        {currentRole === 'super_admin' && filterStatus !== 'applications' && <td className="p-4"></td>}
                                                        <td className="p-4">
                                                            {r.status === 'pending' ? (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleApproveAccess(r.id, 'approved')}
                                                                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 font-bold"
                                                                    >
                                                                        Invite
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApproveAccess(r.id, 'rejected')}
                                                                        className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs hover:bg-zinc-300 font-bold"
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-zinc-400 italic">No further actions</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}

                                            {/* Existing Users */}
                                            {users
                                                .filter(u => filterStatus === 'all' || u.verification?.status === filterStatus || (filterStatus === 'verified' && u.email === 'junaid202@gmail.com'))
                                                .filter(_ => filterStatus !== 'applications')
                                                .map(u => (
                                                    <tr key={u.uid} className={`border-b border-border-light dark:border-border-dark hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${(u.abuseReports || 0) > 2 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                                                                        {u.photoURL && <img src={u.photoURL} alt="" className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    {(u.abuseReports || 0) > 0 && (
                                                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900" title={`${u.abuseReports} Abuse Reports`}>
                                                                            {u.abuseReports}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                                                                            {u.displayName || 'No Name'}
                                                                            {(u.abuseReports || 0) > 2 && (
                                                                                <span className="material-symbols-outlined text-red-500 text-sm" title="High Abuse Reports">report</span>
                                                                            )}
                                                                            {u.verification?.status === 'verified' && (
                                                                                <span className="material-symbols-outlined text-blue-500 text-sm" title="Verified User">verified</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-xs text-zinc-500">{u.email}</p>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="text-xs text-zinc-400 capitalize">{u.role?.replace('_', ' ') || 'User'}</span>
                                                                        {(u.role === 'influencer' || u.role === 'content_creator') && (
                                                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">Member</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {u.email === 'junaid202@gmail.com' ? (
                                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.verification?.status === 'verified' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                    u.verification?.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                                        u.verification?.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                            'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                                                    }`}>
                                                                    {u.verification?.status || 'None'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md w-max border ${u.accountStatus === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    u.accountStatus === 'suspended' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                        'bg-green-50 text-green-700 border-green-200'
                                                                    }`}>
                                                                    {u.accountStatus || 'Active'}
                                                                </span>
                                                                {(u.warningCount || 0) > 0 && (
                                                                    <span className="text-[9px] font-bold text-red-500 bg-red-500/5 px-1.5 py-0.5 rounded border border-red-500/20 w-max">
                                                                        {u.warningCount} Warnings Issued
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xs">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                {u.verification?.aadharCardUrl ? (
                                                                    <a href={u.verification.aadharCardUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                                        <span className="material-symbols-outlined text-xs">perm_identity</span> View ID
                                                                    </a>
                                                                ) : null}

                                                                {u.verification?.filmUnionCardUrl ? (
                                                                    <a href={u.verification.filmUnionCardUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                                        <span className="material-symbols-outlined text-xs">badge</span> View Union Card
                                                                    </a>
                                                                ) : null}

                                                                {/* Other Proofs */}
                                                                {u.verification?.proofType === 'imdb' && (
                                                                    <a href={u.verification.imdbUrl} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline flex items-center gap-1 font-medium">
                                                                        <span className="material-symbols-outlined text-xs">movie</span> IMDb Profile
                                                                    </a>
                                                                )}
                                                                {u.verification?.proofType === 'invites' && (
                                                                    <span className="text-zinc-500">Invites: {u.verification.inviteCodes?.join(', ')}</span>
                                                                )}
                                                                {u.verification?.proofType === 'content_creator' && (
                                                                    <div className="flex flex-col gap-1">
                                                                        {u.socialLinks?.instagram && (
                                                                            <a href={u.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline flex items-center gap-1 bg-pink-50 px-2 py-1 rounded border border-pink-100">
                                                                                <span className="material-symbols-outlined text-xs">photo_camera</span> Instagram
                                                                            </a>
                                                                        )}
                                                                        {u.verification.contentLinks?.map((link, i) => (
                                                                            <a key={i} href={link} target="_blank" rel="noreferrer" className="text-red-600 hover:underline flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                                <span className="material-symbols-outlined text-xs">play_circle</span> Content Link
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {!u.verification?.status && <span className="text-zinc-400 italic">No proofs submitted</span>}
                                                            </div>
                                                        </td>
                                                        {currentRole === 'super_admin' && (
                                                            <td className="p-4">
                                                                <select
                                                                    value={u.adminRole || 'none'}
                                                                    onChange={(e) => handleAssignRole(u.uid, e.target.value)}
                                                                    className="text-xs p-1 rounded border border-border-light dark:border-border-dark bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary/50 outline-none"
                                                                >
                                                                    <option value="none">User</option>
                                                                    <option value="user_manager">User Manager</option>
                                                                    <option value="ad_manager">Ad Manager</option>
                                                                </select>
                                                            </td>
                                                        )}
                                                        <td className="p-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                {u.verification?.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerifyUser(u.uid, 'verified')}
                                                                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 shadow-sm font-bold"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerifyUser(u.uid, 'rejected')}
                                                                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 shadow-sm font-bold"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Moderation Actions */}
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleIssueWarning(u.uid)}
                                                                        title="Issue Warning / Violation Notice"
                                                                        className="p-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">warning</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedUserForStatus(u)}
                                                                        title="Change Account Status (Block/Suspend)"
                                                                        className="p-1.5 bg-zinc-50 text-zinc-700 rounded-lg hover:bg-zinc-100 border border-zinc-200"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                                    </button>
                                                                </div>

                                                                {/* Abuse Alert */}
                                                                {(u.abuseReports || 0) > 2 && (
                                                                    <span className="text-[10px] text-red-600 font-bold bg-red-100 px-2 py-1 rounded animate-pulse inline-flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[12px]">error</span>
                                                                        URGENT REVIEW
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ad Management View */}
                    {activeTab === 'ads' && canManageAds && (
                        <div className="space-y-6">
                            {/* Header Action */}
                            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Active Campaigns</h3>
                                    <p className="text-sm text-zinc-500">Manage your platform advertisements</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateAdOpen(true)}
                                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Create New Campaign
                                </button>
                            </div>

                            {/* Ads Grid */}
                            {ads.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                    <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">campaign</span>
                                    <p className="text-zinc-500">No active campaigns. Create one to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ads.map(ad => (
                                        <div key={ad.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex flex-col">
                                            {/* Image Preview */}
                                            <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative group">
                                                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ad.status === 'active' ? 'bg-green-500 text-white' :
                                                        ad.status === 'paused' ? 'bg-orange-500 text-white' :
                                                            'bg-zinc-500 text-white'
                                                        }`}>
                                                        {ad.status}
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full hover:bg-zinc-200">
                                                        <span className="material-symbols-outlined text-zinc-900 text-sm">link</span>
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-1" title={ad.title}>{ad.title}</h4>
                                                    <span className="text-xs text-zinc-500 capitalize px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{ad.placement.replace('_', ' ')}</span>
                                                </div>

                                                <div className="space-y-1 mb-4">
                                                    <div className="flex justify-between text-xs text-zinc-500">
                                                        <span>Views</span>
                                                        <span className="font-medium text-zinc-900 dark:text-white">{ad.views}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-zinc-500">
                                                        <span>Clicks</span>
                                                        <span className="font-medium text-zinc-900 dark:text-white">{ad.clicks}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                                        <span>Duration</span>
                                                        <span>{new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                    {ad.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleAdStatusChange(ad.id!, 'paused')}
                                                            className="flex-1 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-900/40"
                                                        >
                                                            Pause
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAdStatusChange(ad.id!, 'active')}
                                                            className="flex-1 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40"
                                                        >
                                                            Resume
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAd(ad.id!)}
                                                        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40"
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
                    {/* System View */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Email System Diagnostics</h3>
                                <p className="text-zinc-500 mb-6">Test the automated professional email delivery system.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => handleSendTestEmail('invite')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-purple-600">mail</span>
                                        <p className="font-bold text-purple-800 text-sm">Send Invite</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('welcome')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-green-600">celebration</span>
                                        <p className="font-bold text-green-800 text-sm">Send Welcome</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('access_request_received')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-blue-600">mark_email_read</span>
                                        <p className="font-bold text-blue-800 text-sm">Acknowledgment</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('admin_access_alert')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-red-600">notification_important</span>
                                        <p className="font-bold text-red-800 text-sm">Admin Alert</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('warning')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-yellow-600">warning</span>
                                        <p className="font-bold text-yellow-800 text-sm">Send Warning</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('suspended')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-orange-600">pause_circle</span>
                                        <p className="font-bold text-orange-800 text-sm">Send Hold</p>
                                    </button>
                                    <button
                                        onClick={() => handleSendTestEmail('blocked')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-red-600">block</span>
                                        <p className="font-bold text-red-800 text-sm">Send Block</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>
        </div>
    );
}
