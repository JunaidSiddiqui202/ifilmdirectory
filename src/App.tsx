import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationListener from './components/NotificationListener';
import { ToastProvider } from './context/ToastContext';
import { UnreadProvider } from './context/UnreadContext';
import { seedGuilds } from './seedGuilds';

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm text-text-light/60 dark:text-text-dark/60">
        Loading...
      </p>
    </div>
  </div>
);

// Resilient lazy import wrapper that recovers gracefully from stale deployment chunks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  name: string
) {
  return lazy(async () => {
    const retryKey = `chunk_retry_${name}`;
    try {
      return await factory();
    } catch (error: any) {
      const msg = (error?.message || error?.toString() || '').toString();
      const isChunkLoadFailed =
        msg.includes('dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('Unexpected token') ||
        msg.includes('Importing a module script failed');

      const alreadyRetried = sessionStorage.getItem(retryKey);
      if (!alreadyRetried && isChunkLoadFailed) {
        sessionStorage.setItem(retryKey, 'true');
        console.warn(`[Auto-Recovery] Dynamic chunk failed for ${name}. Reloading latest application bundle...`);
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}

// Lazy load all pages for code splitting with automatic stale chunk recovery
// Public pages
const Welcome = lazyWithRetry(() => import('./pages/Welcome'), 'Welcome');
const Login = lazyWithRetry(() => import('./pages/Login'), 'Login');
const Privacy = lazyWithRetry(() => import('./pages/Privacy'), 'Privacy');
const Terms = lazyWithRetry(() => import('./pages/Terms'), 'Terms');

// Protected pages
const Home = lazyWithRetry(() => import('./pages/Home'), 'Home');
const ShowreelView3 = lazyWithRetry(() => import('./pages/ShowreelView3'), 'ShowreelView3');
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const AdminUtils = lazyWithRetry(() => import('./pages/AdminUtils'), 'AdminUtils');
const BlogsEvents = lazyWithRetry(() => import('./pages/BlogsEvents'), 'BlogsEvents');
const EditBlog = lazyWithRetry(() => import('./pages/EditBlog'), 'EditBlog');
const CreateEvent = lazyWithRetry(() => import('./pages/CreateEvent'), 'CreateEvent');
const BrowseProfiles = lazyWithRetry(() => import('./pages/BrowseProfiles'), 'BrowseProfiles');
const Jobs = lazyWithRetry(() => import('./pages/Jobs'), 'Jobs');
const JobDetails = lazyWithRetry(() => import('./pages/JobDetails'), 'JobDetails');
const JobApplications = lazyWithRetry(() => import('./pages/JobApplications'), 'JobApplications');
const PostJob = lazyWithRetry(() => import('./pages/PostJob'), 'PostJob');
const MessagesList = lazyWithRetry(() => import('./pages/MessagesList'), 'MessagesList');
const Messaging = lazyWithRetry(() => import('./pages/Messaging'), 'Messaging');
const GroupsForums = lazyWithRetry(() => import('./pages/GroupsForums'), 'GroupsForums');
const ShowreelView1 = lazyWithRetry(() => import('./pages/ShowreelView1'), 'ShowreelView1');
const ShowreelView2 = lazyWithRetry(() => import('./pages/ShowreelView2'), 'ShowreelView2');
const UploadShowreel = lazyWithRetry(() => import('./pages/UploadShowreel'), 'UploadShowreel');
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile'), 'UserProfile');
const ServiceProviderShowcase = lazyWithRetry(() => import('./pages/ServiceProviderShowcase'), 'ServiceProviderShowcase');
const ServiceMarketplace = lazyWithRetry(() => import('./pages/ServiceMarketplace'), 'ServiceMarketplace');
const BusinessProfile = lazyWithRetry(() => import('./pages/BusinessProfile'), 'BusinessProfile');
const BookingFacilities = lazyWithRetry(() => import('./pages/BookingFacilities'), 'BookingFacilities');
const Settings = lazyWithRetry(() => import('./pages/Settings'), 'Settings');
const SettingsDetail = lazyWithRetry(() => import('./pages/SettingsDetail'), 'SettingsDetail');
const Search = lazyWithRetry(() => import('./pages/Search'), 'Search');
const Showcase = lazyWithRetry(() => import('./pages/Showcase'), 'Showcase');
const Guilds = lazyWithRetry(() => import('./pages/Guilds'), 'Guilds');
const SavedItems = lazyWithRetry(() => import('./pages/SavedItems'), 'SavedItems');
const ProductionProjects = lazyWithRetry(() => import('./pages/ProductionProjects'), 'ProductionProjects');
const ProjectDetails = lazyWithRetry(() => import('./pages/ProjectDetails'), 'ProjectDetails');
const SouthCinemaNews = lazyWithRetry(() => import('./pages/SouthCinemaNews'), 'SouthCinemaNews');

import { AuthModalProvider } from './context/AuthModalContext';
import AuthModal from './components/AuthModal';

function App() {
  useEffect(() => {
    seedGuilds();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthModalProvider>
          <UnreadProvider>
            <NotificationListener />
            <AuthModal />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Public Browse Routes (Guests can read & explore, gated on interactive actions) */}
                <Route path="/home" element={<ProtectedRoute allowGuest={true}><Home /></ProtectedRoute>} />
                <Route path="/south-cinema" element={<ProtectedRoute allowGuest={true}><SouthCinemaNews /></ProtectedRoute>} />
                <Route path="/news" element={<ProtectedRoute allowGuest={true}><SouthCinemaNews /></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute allowGuest={true}><Jobs /></ProtectedRoute>} />
                <Route path="/job/:id" element={<ProtectedRoute allowGuest={true}><JobDetails /></ProtectedRoute>} />
                <Route path="/browse-profiles" element={<ProtectedRoute allowGuest={true}><BrowseProfiles /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProtectedRoute allowGuest={true}><UserProfile /></ProtectedRoute>} />
                <Route path="/showcase" element={<ProtectedRoute allowGuest={true}><Showcase /></ProtectedRoute>} />
                <Route path="/blogs-events" element={<ProtectedRoute allowGuest={true}><BlogsEvents /></ProtectedRoute>} />
                <Route path="/booking-facilities" element={<ProtectedRoute allowGuest={true}><BookingFacilities /></ProtectedRoute>} />
                <Route path="/booking/details/:id" element={<ProtectedRoute allowGuest={true}><BusinessProfile /></ProtectedRoute>} />
                <Route path="/business/:id" element={<ProtectedRoute allowGuest={true}><BusinessProfile /></ProtectedRoute>} />
                <Route path="/service-providers" element={<ProtectedRoute allowGuest={true}><ServiceProviderShowcase /></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute allowGuest={true}><ServiceMarketplace /></ProtectedRoute>} />
                <Route path="/guilds" element={<ProtectedRoute allowGuest={true}><Guilds /></ProtectedRoute>} />
                <Route path="/groups-forums" element={<ProtectedRoute allowGuest={true}><GroupsForums /></ProtectedRoute>} />
                <Route path="/showreel/view1" element={<ProtectedRoute allowGuest={true}><ShowreelView1 /></ProtectedRoute>} />
                <Route path="/showreel/view2" element={<ProtectedRoute allowGuest={true}><ShowreelView2 /></ProtectedRoute>} />
                <Route path="/showreel/view3" element={<ProtectedRoute allowGuest={true}><ShowreelView3 /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute allowGuest={true}><Search /></ProtectedRoute>} />

                {/* Strictly Authenticated / Personal Account Routes */}
                <Route path="/-admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/-admin/utils" element={<ProtectedRoute><AdminUtils /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/edit-blog" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
                <Route path="/create-blog" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
                <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
                <Route path="/job/:id/applications" element={<ProtectedRoute><JobApplications /></ProtectedRoute>} />
                <Route path="/messaging" element={<ProtectedRoute><MessagesList /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
                <Route path="/showreel/upload" element={<ProtectedRoute><UploadShowreel /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/:section" element={<ProtectedRoute><SettingsDetail /></ProtectedRoute>} />
                <Route path="/notifications" element={<Navigate to="/messaging?tab=notifications" replace />} />
                <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><ProductionProjects /></ProtectedRoute>} />
                <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </UnreadProvider>
        </AuthModalProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
