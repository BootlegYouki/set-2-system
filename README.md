# High School Student Information System (SET-2)

A comprehensive student information system built with SvelteKit, designed specifically for Philippine high school students (Grades 7-10) following the DepEd curriculum.

## 🏗️ Project Architecture

### File Structure Overview

```
src/
├── app.html                    # Main HTML template
├── components/                 # Reusable UI components
│   ├── common/                # Shared components across all user types
│   │   ├── Odometer.svelte    # Animated number counter
│   │   ├── Toast.svelte       # Notification component
│   │   └── ToastContainer.svelte # Global toast manager
│   ├── login/                 # Authentication components
│   │   ├── loginpage.svelte   # Main login interface
│   │   ├── loginpage.css      # Login-specific styles
│   │   └── js/                # Authentication logic
│   └── users/                 # Role-based components
│       ├── admin/             # Administrator interface
│       ├── student/           # Student interface
│       └── teacher/           # Teacher interface
├── lib/                       # Shared libraries and assets
│   ├── assets/               # Static assets (images, icons)
│   └── styles/               # Global styling system
│       ├── design-system.css # Main design system entry point
│       └── design-system-styles/ # Modular CSS architecture
└── routes/                   # SvelteKit routing
    ├── +layout.svelte       # Global layout wrapper
    └── +page.svelte         # Main application entry point
```

## 🎨 Design System Architecture

### Modular CSS Structure

The project uses a sophisticated modular CSS architecture located in `src/lib/styles/design-system-styles/`:

1. **variables.css** - CSS custom properties for colors, typography, spacing
2. **themes.css** - Light/dark mode configurations
3. **base.css** - Base styles and CSS resets
4. **utilities.css** - Utility classes and helper styles
5. **layout.css** - Layout-specific styles and containers

### Design Tokens

- **School Brand Colors**: Primary (#1565c0), Secondary (#03a9f4), Accent (#00acc1)
- **Academic Status Colors**: Success, Warning, Error, Info states
- **Grade Performance Colors**: Excellent, Good, Satisfactory, Needs Improvement
- **Material Design Styling**: Custom components following Material Design 3 principles
- **Typography Scale**: Material Design typography system with Roboto font
- **Color System**: Material Design 3 color tokens (md-sys-color-*) for consistent theming

### Styling Patterns

- **Component-Scoped Styles**: Each component has its own CSS file
- **Prefix-Based Naming**: Unique class prefixes prevent style conflicts
- **CSS Custom Properties**: Extensive use of CSS variables for theming
- **Material Design Styling**: Custom components built with Material Design 3 principles and design tokens

## 🏛️ Component Architecture

### Role-Based Organization

Components are organized by user roles with consistent patterns:

```
users/
├── [role]/
│   ├── navigations/          # Navigation components
│   │   ├── [role]Menu/       # Side navigation menu
│   │   └── [role]Navbar/     # Top navigation bar
│   └── sections/             # Feature-specific components
│       ├── [feature1]/       # Individual feature modules
│       ├── [feature2]/
│       └── [feature3]/
```

### Component Structure Pattern

Each component follows a consistent structure:
- **Component.svelte** - Main component logic and template
- **component.css** - Component-specific styles
- **Unique prefixes** - CSS classes use component-specific prefixes

### User Roles & Features

#### 👨‍💼 Admin Features
- Dashboard with system overview
- Room Management
- Section Management
- Subject Creation (DepEd curriculum-aligned)
- Schedule Assignment
- Document Request Management
- Account Creation

#### 👨‍🎓 Student Features
- Grade Viewing
- Class Schedule
- Document Requests
- Notifications
- Todo List Management

#### 👨‍🏫 Teacher Features
- Class Schedule
- Student Management
- Advisory Class Management

## 🔄 Application Flow & Rendering

### Single Page Application (SPA) Architecture

1. **Entry Point**: `+page.svelte` serves as the main application controller
2. **Authentication**: Auth state determines which interface to render
3. **Role-Based Rendering**: Components are conditionally rendered based on user role
4. **State Management**: Reactive state management using Svelte 5's `$state()` runes

### Navigation System

- **Collapsible Navigation Rails**: Each role has expandable/collapsible side navigation
- **Section-Based Routing**: Internal navigation switches between feature sections
- **Consistent Navigation Pattern**: All roles follow the same navigation structure

### State Management Pattern

```javascript
// Reactive state for each user role
let activeSection = $state('grades');           // Student
let teacherActiveSection = $state('schedule');  // Teacher  
let adminActiveSection = $state('dashboard');   // Admin

// Navigation visibility states
let isNavRailVisible = $state(false);          // Student nav
let teacherNavRailVisible = $state(false);     // Teacher nav
let adminNavRailVisible = $state(false);       // Admin nav
```

## 🛠️ Technology Stack

- **Framework**: SvelteKit with Svelte 5
- **Styling**: CSS with Material Design 3 styling principles
- **UI Components**: Custom Svelte components with Material Design styling
- **Icons**: Material Icons and Material Symbols
- **Typography**: Roboto font family
- **Build Tool**: Vite
- **Package Manager**: npm

## 🎯 Educational Context

### Philippine DepEd Curriculum Integration

- **Target Grades**: 7-10 (Junior High School)
- **Subject Management**: Aligned with DepEd curriculum standards
- **Academic Calendar**: Follows Philippine school year structure
- **Document Types**: Standard DepEd forms and requirements

## 🚀 Development Workflow

### Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Guidelines

1. **Component Creation**: Follow role-based organization pattern
2. **Styling**: Use design system variables and maintain unique prefixes
3. **Navigation**: Update menu components when adding new sections
4. **Consistency**: Reference existing components for design patterns
5. **Custom Dropdowns**: Use custom dropdown implementations (reference schedule page)

## 📁 Key Files & Their Purposes

- **`+layout.svelte`**: Global layout, imports design system, manages fonts and meta tags
- **`+page.svelte`**: Main application controller, handles authentication and role-based rendering
- **`design-system.css`**: Central import point for all design system modules
- **`auth.js`**: Authentication state management
- **Menu components**: Handle navigation state and section switching
- **Section components**: Individual feature implementations

## 🔧 Customization & Extension

### Adding New Features

1. Create component in appropriate role section
2. Add navigation item to corresponding menu component
3. Update main page component to include new section
4. Follow existing naming conventions and styling patterns

### Styling Guidelines

- Use CSS custom properties from the design system
- Maintain component-scoped styles with unique prefixes
- Follow Material Design principles
- Ensure responsive design across devices

This system provides a scalable, maintainable foundation for managing high school student information with a focus on the Philippine educational context.
