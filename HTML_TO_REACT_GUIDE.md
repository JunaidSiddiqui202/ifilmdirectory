# HTML to React Conversion Guide

This document explains how the HTML files were converted to React components.

## Conversion Process

### 1. **Component Structure**
Each HTML file became a React functional component:

```tsx
// HTML: welcome_&_onboarding-code.html
// React: src/pages/Welcome.tsx

export default function Welcome() {
  return (
    <div className="...">
      {/* Component content */}
    </div>
  );
}
```

### 2. **Class Names**
HTML `class` attributes became `className` in React:

```html
<!-- HTML -->
<div class="flex items-center">

<!-- React -->
<div className="flex items-center">
```

### 3. **Inline Styles**
HTML inline styles were converted to React style objects:

```html
<!-- HTML -->
<div style='background-image: url("...");'>

<!-- React -->
<div style={{ backgroundImage: 'url(...)' }}>
```

### 4. **Self-Closing Tags**
HTML tags that don't close became self-closing in React:

```html
<!-- HTML -->
<input type="text">
<img src="...">

<!-- React -->
<input type="text" />
<img src="..." />
```

### 5. **Event Handlers**
HTML onclick became React onClick with functions:

```html
<!-- HTML -->
<button onclick="doSomething()">

<!-- React -->
<button onClick={handleClick}>
```

### 6. **State Management**
Static HTML became interactive with React hooks:

```tsx
import { useState } from 'react';

export default function Component() {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <button onClick={() => setIsActive(!isActive)}>
      {isActive ? 'Active' : 'Inactive'}
    </button>
  );
}
```

### 7. **Navigation**
HTML anchors became React Router Links:

```html
<!-- HTML -->
<a href="/login">Login</a>

<!-- React -->
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
<button onClick={() => navigate('/login')}>Login</button>
```

### 8. **Dynamic Content**
Static lists became mapped arrays:

```html
<!-- HTML -->
<div class="card">Item 1</div>
<div class="card">Item 2</div>
<div class="card">Item 3</div>

<!-- React -->
{items.map((item, index) => (
  <div key={index} className="card">{item}</div>
))}
```

## Specific Conversions

### Welcome Page
- **Carousel**: Added state for `currentSlide` with navigation
- **Indicators**: Made clickable with `onClick` handlers
- **Buttons**: Added `navigate()` for routing

### Login Page
- **Toggle**: Implemented with `isLogin` state
- **Form**: Added `onSubmit` handler with validation
- **Password**: Added `showPassword` state for visibility toggle
- **Inputs**: Added `value` and `onChange` for controlled components

### Home Page
- **Stories**: Converted to array with `.map()`
- **Job Cards**: Made reusable with data arrays
- **Bottom Nav**: Extracted to separate component
- **Images**: Used Unsplash for placeholder images

### Blogs & Events
- **Tabs**: Implemented with `activeTab` state
- **Search**: Added controlled input component
- **Cards**: Mapped from blog posts array
- **FAB**: Added hover effects with Tailwind

## Design System Migration

### Colors
All colors from HTML Tailwind config were moved to `tailwind.config.js`:

```javascript
colors: {
  'primary': '#da620b',
  'background-light': '#f8f7f5',
  'background-dark': '#221810',
  'text-light': '#221810',
  'text-dark': '#f8f7f5',
  'text-subtle-light': '#6b5e53',
  'text-subtle-dark': '#cba990',
  'surface-light': '#ffffff',
  'surface-dark': '#2d1f14',
  'border-light': '#e4e0dc',
  'border-dark': '#493222',
}
```

### Fonts
Google Fonts links from HTML `<head>` moved to `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
```

### Icons
Material Symbols configuration preserved:

```css
.material-symbols-outlined {
  font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 24
}
```

## Best Practices Applied

1. **TypeScript**: Added type safety for props and state
2. **Functional Components**: Used modern React hooks instead of classes
3. **Controlled Components**: All form inputs are controlled
4. **Key Props**: Added unique keys to mapped elements
5. **Semantic HTML**: Maintained accessibility with proper tags
6. **CSS Modules**: Used Tailwind utilities for scoped styling
7. **Code Splitting**: Each page is a separate component for lazy loading

## Image Handling

HTML used Google-hosted images. React version uses:
- **Unsplash**: High-quality placeholder images
- **Responsive**: Images sized appropriately for mobile/web
- **Lazy Loading**: Browser-native lazy loading with `loading="lazy"`

## Next Steps for Full Conversion

To convert the remaining HTML files:

1. **Copy HTML structure** to new React component
2. **Convert class to className**
3. **Fix self-closing tags**
4. **Extract dynamic data** to arrays/objects
5. **Add state** for interactive elements
6. **Implement navigation** with React Router
7. **Add TypeScript types** for props
8. **Test responsiveness** on mobile/desktop

## Example: Converting a New Page

```tsx
// 1. Create new file: src/pages/NewPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Define data
const items = [
  { id: 1, title: 'Item 1', description: '...' },
  { id: 2, title: 'Item 2', description: '...' },
];

// 3. Create component
export default function NewPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">New Page</h1>
      
      {items.map((item) => (
        <div 
          key={item.id}
          onClick={() => setSelectedId(item.id)}
          className={`p-4 rounded-lg ${
            selectedId === item.id ? 'bg-primary' : 'bg-surface-dark'
          }`}
        >
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}

// 4. Add route in App.tsx
<Route path="/new-page" element={<NewPage />} />
```

---

This guide should help you convert any remaining HTML files to React components! 🚀
