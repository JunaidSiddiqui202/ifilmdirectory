# Business Profile Page - Documentation

## Overview
The **Business Profile** page is a comprehensive, premium profile page specifically designed for service provider businesses in the film industry, including:

- 🎬 **Production Studios**
- 📹 **Equipment Rental Houses**
- 🎨 **Post-Production Studios**
- 🚐 **Vanity Van Services**
- 📍 **Location Services**
- 🎭 **Casting Agencies**
- 🏢 **Production Houses**

## Route
```
/business/:id
```

**Example:** `http://localhost:5173/business/1`

## Key Features

### 1. **Hero Section**
- **Cover Image** - Full-width banner showcasing the business
- **Logo** - Professional business logo with border
- **Business Name** - With verification badge for verified businesses
- **Tagline** - Catchy one-liner
- **Back & Share Buttons** - Easy navigation and sharing

### 2. **Quick Stats Cards**
Three prominent stat cards showing:
- **Rating** - Average rating with star display (e.g., 4.8 ⭐⭐⭐⭐⭐)
- **Projects Completed** - Total projects (e.g., 500+)
- **Years of Experience** - Established since (e.g., 48 years)

### 3. **Availability Badge**
- **Real-time Status** - Green (Available) or Red (Unavailable)
- **Animated Pulse** - Visual indicator
- **Next Available Date** - When the business can be booked

### 4. **Tabbed Navigation**
Four main tabs for organized content:

#### **About Tab**
- **Description** - Detailed business overview
- **Location** - Address with map view option
- **Team Members** - Key personnel with photos and roles

#### **Services Tab**
- **Service Cards** - Each service includes:
  - Service image
  - Service name
  - Detailed description
  - Pricing (e.g., ₹50,000/day)
  - "Book Now" button

#### **Gallery Tab**
- **Photo Grid** - 2-column responsive grid
- **High-quality Images** - Showcase facilities, equipment, past projects
- **Lightbox Ready** - Click to view full-size (future enhancement)

#### **Reviews Tab**
- **Rating Summary** - Overall rating with distribution bars
- **Individual Reviews** - Each review shows:
  - Reviewer photo and name
  - Star rating
  - Project type badge (Feature Film, Web Series, Commercial)
  - Review text
  - Date posted

### 5. **Fixed Bottom CTA**
Sticky bottom bar with:
- **Contact Us Button** - Opens contact modal
- **Bookmark Button** - Save for later

### 6. **Contact Modal**
Professional contact options:
- **Phone** - Direct call link
- **Email** - Email link
- **Website** - External link to business website
- **Send Message** - Navigate to messaging

## Design Highlights

### **Premium Aesthetics**
- ✅ Clean, modern design
- ✅ Smooth animations and transitions
- ✅ Dark mode support
- ✅ Professional color scheme
- ✅ Responsive layout

### **User Experience**
- ✅ Intuitive tab navigation
- ✅ Quick access to contact info
- ✅ Clear pricing display
- ✅ Social proof (reviews & ratings)
- ✅ Visual hierarchy

### **Mobile-First**
- ✅ Optimized for mobile devices
- ✅ Touch-friendly buttons
- ✅ Smooth scrolling
- ✅ Bottom navigation compatible

## Data Structure

### BusinessProfile Interface
```typescript
interface BusinessProfile {
    id: string;
    name: string;
    type: 'studio' | 'equipment' | 'post_production' | 'vanity_van' | 'location' | 'casting_agency' | 'production_house';
    tagline: string;
    description: string;
    coverImage: string;
    logo: string;
    location: string;
    city: string;
    established: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    
    // Contact
    phone: string;
    email: string;
    website?: string;
    
    // Gallery
    gallery: string[];
    
    // Services
    services: Service[];
    
    // Reviews
    reviews: Review[];
    
    // Team
    team: TeamMember[];
    
    // Stats
    projectsCompleted: number;
    yearsExperience: number;
    
    // Availability
    isAvailable: boolean;
    nextAvailable?: string;
}
```

## Integration Points

### **From Marketplace**
Update `ServiceMarketplace.tsx` to navigate to business profile:
```tsx
onClick={() => navigate(`/business/${service.id}`)}
```

### **From Booking Facilities**
Update `BookingFacilities.tsx` to navigate to business profile:
```tsx
onClick={() => navigate(`/business/${facility.id}`)}
```

### **From Service Provider Showcase**
Update `ServiceProviderShowcase.tsx` CTA button:
```tsx
onClick={() => navigate(`/business/${post.id}`)}
```

## Future Enhancements

### **Phase 1 (Immediate)**
- [ ] Connect to real API/Firebase
- [ ] Implement booking calendar
- [ ] Add image lightbox for gallery
- [ ] Implement save/bookmark functionality

### **Phase 2 (Short-term)**
- [ ] Add video support in gallery
- [ ] Implement review submission
- [ ] Add service comparison
- [ ] Enable direct booking flow
- [ ] Add availability calendar

### **Phase 3 (Long-term)**
- [ ] Virtual tour integration
- [ ] Live chat support
- [ ] Payment integration
- [ ] Booking management dashboard
- [ ] Analytics for business owners

## Testing

### **Test the Page**
1. Navigate to: `http://localhost:5173/business/1`
2. Test all tabs (About, Services, Gallery, Reviews)
3. Click "Contact Us" to test modal
4. Test dark mode toggle
5. Test on mobile viewport

### **Test Navigation**
From Marketplace:
```
/marketplace → Click on any service → /business/:id
```

From Booking:
```
/booking → Click "View Details" → /business/:id
```

## Example Business Data

The page currently uses mock data for **Annapurna Studios** as an example. This includes:
- 4 services (Indoor Floor, Outdoor Set, Post-Production, Equipment)
- 6 gallery images
- 3 reviews
- 3 team members
- Verified status
- 4.8 rating with 247 reviews

## Customization

### **Change Business Type**
Update the `type` field to change the business category:
```typescript
type: 'studio' | 'equipment' | 'post_production' | 'vanity_van' | 'location' | 'casting_agency' | 'production_house'
```

### **Add More Services**
Add to the `services` array:
```typescript
{
    id: '5',
    name: 'Dubbing Suite',
    description: 'Professional dubbing facility...',
    price: '₹15,000',
    duration: 'per day',
    image: 'url'
}
```

### **Customize Colors**
The page uses Tailwind's `primary` color. Update in `tailwind.config.js`:
```javascript
colors: {
    primary: '#your-color'
}
```

## Notes

- **Performance**: Images are lazy-loaded using `PostMedia` component
- **Accessibility**: All buttons have proper ARIA labels
- **SEO**: Proper heading hierarchy (h1, h2, h3)
- **Analytics Ready**: Add tracking to CTA buttons for conversion metrics

---

## Quick Start

1. **View the page**: Navigate to `/business/1` in your browser
2. **Customize data**: Edit the mock data in `BusinessProfile.tsx`
3. **Connect to API**: Replace mock data with Firebase/API calls
4. **Update routes**: Link from marketplace and booking pages

**The page is now live and ready to use!** 🎉
