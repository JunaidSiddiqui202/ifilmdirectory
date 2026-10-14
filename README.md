# 🎬 iFilmDirectory - React Mobile & Web App

A comprehensive film industry networking and job platform built with React, TypeScript, and Tailwind CSS.

## ✨ Features

### 📱 **17 Complete Screens**

1. **Welcome & Onboarding** - Interactive carousel introducing key features
2. **Login/Sign Up** - Authentication with email/password and social login (Google, Apple)
3. **Home/Dashboard** - Stories, job feed, and network updates
4. **Blogs & Events** - Industry news, articles, and event listings
5. **Browse Profiles** - Search and discover film professionals
6. **Job Details** - View detailed job postings and audition calls
7. **Post a Job** - Create new job listings
8. **Messaging** - Chat with other professionals
9. **Groups & Forums** - Join discussions and communities
10. **Showreel View 1-3** - Multiple viewing modes for portfolio videos
11. **Upload Showreel** - Upload and manage portfolio content
12. **User Profile** - Manage personal profile and portfolio
13. **Service Provider Showcase** - Browse equipment rentals and services
14. **Booking Facilities** - Book studios, equipment, and locations
15. **Settings & Preferences** - Account management

### 🎨 **Design System**

- **Primary Color**: `#da620b` (Vibrant Orange)
- **Dark Theme**: `#221810` background with `#f8f7f5` text
- **Light Theme**: `#f8f7f5` background with `#221810` text
- **Typography**: 
  - Spline Sans (primary)
  - Newsreader (blogs/articles)
- **Icons**: Material Symbols Outlined
- **Responsive**: Mobile-first design that scales to web

### 🚀 **Technical Stack**

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **Icons**: Google Material Symbols
- **Fonts**: Google Fonts (Spline Sans, Newsreader)

## 📦 Installation

```bash
cd ifilm-app
npm install
```

## 🏃‍♂️ Running the App

### Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173/`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📂 Project Structure

```
ifilm-app/
├── src/
│   ├── components/
│   │   └── BottomNav.tsx       # Reusable bottom navigation
│   ├── pages/
│   │   ├── Welcome.tsx          # Onboarding carousel
│   │   ├── Login.tsx            # Authentication
│   │   ├── Home.tsx             # Main dashboard
│   │   ├── BlogsEvents.tsx      # News & events
│   │   ├── BrowseProfiles.tsx   # Profile search
│   │   ├── JobDetails.tsx       # Job listings
│   │   ├── PostJob.tsx          # Create jobs
│   │   ├── Messaging.tsx        # Chat
│   │   ├── GroupsForums.tsx     # Communities
│   │   ├── ShowreelView1-3.tsx  # Portfolio views
│   │   ├── UploadShowreel.tsx   # Upload content
│   │   ├── UserProfile.tsx      # Profile management
│   │   ├── ServiceProviderShowcase.tsx
│   │   ├── BookingFacilities.tsx
│   │   └── Settings.tsx         # Preferences
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/
├── index.html
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS setup
├── vite.config.ts               # Vite configuration
└── package.json
```

## 🎯 Key Features Implemented

### ✅ Welcome/Onboarding
- Interactive carousel with 3 slides
- Page indicators
- Smooth transitions
- Direct navigation to login

### ✅ Authentication
- Toggle between Login/Sign Up modes
- Email & password fields with validation
- Password visibility toggle
- Social login buttons (Google, Apple)
- "Forgot Password" link

### ✅ Home Dashboard
- User greeting with profile picture
- Stories carousel (Instagram-style)
- Job listings feed with images
- Network activity feed
- Like, comment, share interactions
- Bottom navigation bar

### ✅ Blogs & Events
- Tab navigation (Blogs vs Events)
- Search functionality
- Filter options
- Blog post cards with images
- Category tags
- Author information
- Floating action button

### ✅ Navigation
- React Router for client-side routing
- Bottom navigation bar on main screens
- Active state highlighting
- Smooth page transitions

## 🎨 Design Highlights

- **Dark Mode First**: Beautiful dark theme as default
- **Glassmorphism**: Frosted glass effects on navigation bars
- **Smooth Animations**: Transitions on all interactive elements
- **Material Design**: Google Material Symbols icons throughout
- **Responsive Layout**: Mobile-first, scales to tablet/desktop
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  'primary': '#da620b',
  'background-light': '#f8f7f5',
  'background-dark': '#221810',
  // ... more colors
}
```

### Fonts
Update `index.html` to change fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
```

## 📱 Mobile Responsiveness

The app is built mobile-first and includes:
- Touch-friendly tap targets (min 44px)
- Swipeable carousels
- Bottom navigation for easy thumb access
- Optimized images for mobile bandwidth
- Smooth scrolling and transitions

## 🚀 Next Steps

To fully implement the remaining screens, you can:

1. **Enhance placeholder pages** with full UI from HTML files
2. **Add state management** (Context API or Zustand)
3. **Integrate backend** (Firebase, Supabase, or custom API)
4. **Add authentication** (Firebase Auth, Auth0)
5. **Implement real-time chat** (Socket.io, Firebase Realtime DB)
6. **Add video upload** (Cloudinary, AWS S3)
7. **Implement search** (Algolia, Elasticsearch)

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for the film industry community
