import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationListener from './components/NotificationListener';
import { ToastProvider } from './context/ToastContext';
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

// Lazy load all pages for code splitting
// Public pages (loaded immediately on first visit)
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

// Protected pages (loaded only when accessed)
const Home = lazy(() => import('./pages/Home'));
const ShowreelView3 = lazy(() => import('./pages/ShowreelView3'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUtils = lazy(() => import('./pages/AdminUtils'));
const BlogsEvents = lazy(() => import('./pages/BlogsEvents'));
const EditBlog = lazy(() => import('./pages/EditBlog'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const BrowseProfiles = lazy(() => import('./pages/BrowseProfiles'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const JobApplications = lazy(() => import('./pages/JobApplications'));
const PostJob = lazy(() => import('./pages/PostJob'));
const MessagesList = lazy(() => import('./pages/MessagesList'));
const Messaging = lazy(() => import('./pages/Messaging'));
const GroupsForums = lazy(() => import('./pages/GroupsForums'));
const ShowreelView1 = lazy(() => import('./pages/ShowreelView1'));
const ShowreelView2 = lazy(() => import('./pages/ShowreelView2'));
const UploadShowreel = lazy(() => import('./pages/UploadShowreel'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ServiceProviderShowcase = lazy(() => import('./pages/ServiceProviderShowcase'));
const ServiceMarketplace = lazy(() => import('./pages/ServiceMarketplace'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const BookingFacilities = lazy(() => import('./pages/BookingFacilities'));
const Settings = lazy(() => import('./pages/Settings'));
const SettingsDetail = lazy(() => import('./pages/SettingsDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const Showcase = lazy(() => import('./pages/Showcase'));
const Guilds = lazy(() => import('./pages/Guilds'));
const SavedItems = lazy(() => import('./pages/SavedItems'));
const ProductionProjects = lazy(() => import('./pages/ProductionProjects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const SouthCinemaNews = lazy(() => import('./pages/SouthCinemaNews'));

function App() {
  useEffect(() => {
    seedGuilds();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <NotificationListener />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/-admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/-admin/utils" element={<ProtectedRoute><AdminUtils /></ProtectedRoute>} />
          <Route path="/blogs-events" element={<ProtectedRoute><BlogsEvents /></ProtectedRoute>} />
          <Route path="/edit-blog" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="/create-blog" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/browse-profiles" element={<ProtectedRoute><BrowseProfiles /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="/job/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/job/:id/applications" element={<ProtectedRoute><JobApplications /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
          <Route path="/messaging" element={<ProtectedRoute><MessagesList /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
          <Route path="/groups-forums" element={<ProtectedRoute><GroupsForums /></ProtectedRoute>} />
          <Route path="/showreel/view1" element={<ProtectedRoute><ShowreelView1 /></ProtectedRoute>} />
          <Route path="/showreel/view2" element={<ProtectedRoute><ShowreelView2 /></ProtectedRoute>} />
          <Route path="/showreel/view3" element={<ProtectedRoute><ShowreelView3 /></ProtectedRoute>} />
          <Route path="/showreel/upload" element={<ProtectedRoute><UploadShowreel /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/service-providers" element={<ProtectedRoute><ServiceProviderShowcase /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><ServiceMarketplace /></ProtectedRoute>} />
          <Route path="/booking-facilities" element={<ProtectedRoute><BookingFacilities /></ProtectedRoute>} />
          <Route path="/booking/details/:id" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
          <Route path="/business/:id" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/:section" element={<ProtectedRoute><SettingsDetail /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/showcase" element={<ProtectedRoute><Showcase /></ProtectedRoute>} />
          <Route path="/guilds" element={<ProtectedRoute><Guilds /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProductionProjects /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="/south-cinema" element={<ProtectedRoute><SouthCinemaNews /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><SouthCinemaNews /></ProtectedRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
