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

#### Color System
- **School Brand Colors**: Primary (#1565c0), Secondary (#03a9f4), Accent (#00acc1)
- **Academic Status Colors**: Success (#3a9c3f), Warning (#f57c00), Error (#d32f2f), Info (#1976d2)
- **Grade Performance Colors**: 
  - Excellent (#2e7d32), Good (#f57f17), Satisfactory (#ff9800)
  - Needs Improvement (#d32f2f), No Grade (#9e9e9e)
- **Request Status Colors**: Pending (#fff8e1 bg, #ffc107 border, #ff6f00 text)
- **Material Design 3 Tokens**: Complete md-sys-color-* system for consistent theming

#### Typography System
- **Font Family**: Roboto (imported from Google Fonts)
- **Typography Scale**: Material Design 3 typescale system
  - Display Large (57px), Headline Large (32px), Title Large (22px)
  - Body Large (16px), Label Large (14px)
- **Font Weights**: 400 (regular), 500 (medium), 700 (bold)

#### Icon System
- **Material Symbols**: Outlined style with variable font support
- **Customization**: opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
- **Usage**: Consistent iconography across all components

### Styling Patterns

- **Component-Scoped Styles**: Each component has its own CSS file
- **Prefix-Based Naming**: Unique class prefixes prevent style conflicts
- **CSS Custom Properties**: Extensive use of CSS variables for theming
- **Material Design Styling**: Custom components built with Material Design 3 principles and design tokens

## 🏛️ Component Architecture

### Role-Based Organization

Components are organized by user roles with consistent patterns:

```
components/
├── common/                   # Shared components across all user types
│   ├── Modal.svelte         # Modal dialog component
│   ├── ModalContainer.svelte # Global modal manager
│   ├── Odometer.svelte      # Animated number counter
│   ├── Toast.svelte         # Notification component
│   ├── ToastContainer.svelte # Global toast manager
│   └── js/                  # Shared JavaScript utilities
│       ├── modalStore.js    # Modal state management
│       └── toastStore.js    # Toast notification store
├── login/                   # Authentication components
│   ├── loginpage.svelte     # Main login interface
│   ├── loginpage.css        # Login-specific styles
│   └── js/                  # Authentication logic
│       ├── auth.js          # Authentication store
│       ├── authHelpers.js   # Authentication utilities
│       ├── theme.js         # Theme management
│       └── validation.js    # Form validation
└── users/                   # Role-based components
    ├── [role]/
    │   ├── navigations/     # Navigation components
    │   │   ├── [role]Menu/ # Side navigation menu
    │   │   └── [role]Navbar/ # Top navigation bar
    │   └── sections/       # Feature-specific components
    │       ├── [feature1]/ # Individual feature modules
    │       ├── [feature2]/
    │       └── [feature3]/
```

### Component Structure Pattern

Each component follows a consistent structure:
- **Component.svelte** - Main component logic and template
- **component.css** - Component-specific styles
- **Unique prefixes** - CSS classes use component-specific prefixes

### Global Component Systems

#### Modal System
- **Modal.svelte** - Reusable modal dialog component
- **ModalContainer.svelte** - Global modal manager for the entire application
- **modalStore.js** - Centralized state management for modal operations
- **Features**: Backdrop click to close, ESC key support, focus management

#### Toast Notification System
- **Toast.svelte** - Individual toast notification component
- **ToastContainer.svelte** - Global toast manager with positioning
- **toastStore.js** - Toast state management with auto-dismiss functionality
- **Features**: Multiple toast types (success, error, warning, info), auto-dismiss timers

#### Animation Components
- **Odometer.svelte** - Animated number counter for statistics and metrics
- **Integration**: Used in dashboards and data visualization components

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

### Core Framework
- **Framework**: SvelteKit 2.22.0 with Svelte 5.0.0
- **Build Tool**: Vite 7.0.4
- **Package Manager**: npm
- **Adapter**: Node.js adapter for production deployment

### Development Tools
- **ESLint**: 9.18.0 with Svelte plugin for code linting
- **Prettier**: 3.4.2 with Svelte plugin for code formatting
- **TypeScript Support**: JSConfig for enhanced development experience

### UI & Styling
- **Styling**: Modular CSS with Material Design 3 principles
- **Design System**: Custom CSS architecture with design tokens
- **Icons**: Material Symbols Outlined font
- **Typography**: Roboto font family
- **Animations**: Odometer library (0.4.8) for number animations

### Architecture
- **Component System**: Role-based component organization
- **State Management**: Svelte 5 runes (`$state()`, `$derived()`)
- **Routing**: SvelteKit file-based routing
- **Authentication**: Custom auth store with role-based access control

## 🔐 Authentication System

### Role-Based Access Control

The system implements a comprehensive authentication system with three distinct user roles:

#### Test Accounts

For development and testing purposes, use these predefined accounts:

**Student Account**
- Email: `student@school.edu`
- Password: `student123`
- Access: Student Portal with grades, schedule, documents, notifications, and todo sections

**Teacher Account**
- Email: `teacher@school.edu`
- Password: `teacher123`
- Access: Teacher Portal with schedule, class management, and advisory class features

**Admin Account**
- Email: `admin@school.edu`
- Password: `admin123`
- Access: Admin Portal with dashboard, account creation, room/section management, and more

#### Authentication Features

- **Automatic Role Detection**: System determines user role based on email address
- **Role-based Routing**: Each account type redirects to its respective portal
- **Personalized Interface**: Login success includes user's name and role-specific navigation
- **Session Management**: Secure session handling with logout functionality
- **Form Validation**: Client-side validation for login credentials
- **Error Handling**: Comprehensive error messages for invalid credentials

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
