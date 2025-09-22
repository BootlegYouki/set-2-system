# High School Student Information System (SET-2)

A comprehensive student information system built with SvelteKit, designed specifically for Philippine high school students (Grades 7-10) following the DepEd curriculum.

## 🆕 Recent Updates & Features

### ✅ Completed Features
- **Complete Authentication System** with role-based access control (Student, Teacher, Admin)
- **Student Portal** with 6 main sections: Profile, Grades, Schedule, Documents, Notifications, and Todo List
- **Teacher Portal** with Schedule, Class Management, Advisory Class features, and Advanced Grading System
- **Admin Portal** with comprehensive management features including:
  - Dashboard with system statistics and analytics
  - Account Creation for all user types
  - Student Masterlist with full student information management
  - Archived Students management with restoration capabilities
  - Student Grades List for academic oversight
  - Room Management for facility organization
  - Section Management for class organization
  - Schedule Management with conflict detection
  - Subject Creation aligned with DepEd curriculum
  - Document Request Management with approval workflows
- **Database Integration** with PostgreSQL backend and comprehensive schema
- **API Endpoints** for authentication, account management, activity logging, and subject management
- **Advanced Grading System** with custom total score modals and spreadsheet-style grading
- **Activity Logging System** with JSONB data storage and IP tracking
- **Global Modal System** with backdrop click and ESC key support
- **Toast Notification System** with auto-dismiss functionality
- **Comprehensive Design System** with Material Design 3 principles
- **Todo List Management** with categories, due dates, and completion tracking
- **Document Request System** with approval workflow and status tracking
- **Responsive Navigation** with collapsible rail navigation for all user roles
- **User Account Management** with archiving, status tracking, and detailed profile information

### 🎯 Key Implementations
- **Svelte 5 Runes**: Modern reactive state management using `$state()` and `$derived()`
- **Component-Scoped Styling**: Each component has unique CSS prefixes to prevent conflicts
- **Material Design Integration**: Custom components built with MD3 design tokens
- **Philippine DepEd Curriculum**: Subject management aligned with local educational standards
- **PostgreSQL Database**: Robust backend with comprehensive schema and indexing
- **RESTful API Architecture**: Well-structured API endpoints with proper error handling
- **Advanced Authentication**: Secure password hashing with bcrypt and role-based access
- **Activity Tracking**: Comprehensive logging system with JSONB data storage
- **Responsive Design**: Mobile-first approach with collapsible navigation systems

## 🏗️ Project Architecture

### File Structure Overview

```
src/
├── app.html                    # Main HTML template
├── components/                 # Reusable UI components
│   ├── common/                # Shared components across all user types
│   │   ├── Modal.svelte       # Reusable modal dialog component
│   │   ├── ModalContainer.svelte # Global modal manager
│   │   ├── Odometer.svelte    # Animated number counter
│   │   ├── Toast.svelte       # Notification component
│   │   ├── ToastContainer.svelte # Global toast manager
│   │   └── js/                # Shared JavaScript utilities
│   │       ├── modalStore.js  # Modal state management
│   │       └── toastStore.js  # Toast notification store
│   ├── login/                 # Authentication components
│   │   ├── loginpage.svelte   # Main login interface
│   │   ├── loginpage.css      # Login-specific styles
│   │   └── js/                # Authentication logic
│   │       ├── auth.js        # Authentication store
│   │       ├── authHelpers.js # Authentication utilities
│   │       ├── theme.js       # Theme management
│   │       └── validation.js  # Form validation
│   └── users/                 # Role-based components
│       ├── admin/             # Administrator interface
│       │   ├── navigations/   # Admin navigation components
│       │   └── sections/      # Admin feature modules
│       │       ├── adminDashboard/
│       │       ├── adminAccountCreation/
│       │       ├── adminStudentMasterlist/
│       │       ├── adminArchivedStudents/
│       │       ├── adminStudentGradesList/
│       │       ├── adminRoomManagement/
│       │       ├── adminSectionManagement/
│       │       ├── adminScheduleManagement/
│       │       ├── adminSubjectCreation/
│       │       └── adminDocumentRequests/
│       ├── student/           # Student interface
│       │   ├── navigations/   # Student navigation components
│       │   └── sections/      # Student feature modules
│       │       ├── studentProfile/
│       │       ├── studentGrade/
│       │       ├── studentSchedule/
│       │       ├── studentDocumentRequest/
│       │       ├── studentNotification/
│       │       └── studentTodolist/
│       └── teacher/           # Teacher interface
│           ├── navigations/   # Teacher navigation components
│           └── sections/      # Teacher feature modules
│               ├── teacherSchedule/
│               ├── teacherClassManagement/
│               │   ├── teacherClassSelection/
│               │   └── teacherClassList/
│               │       ├── CustomTotalScoreModal.svelte
│               │       └── GradingSpreadsheet.svelte
│               └── teacherAdvisoryClass/
├── database/                  # Database connection and utilities
│   └── db.js                 # PostgreSQL connection handler
├── lib/                       # Shared libraries and assets
│   ├── assets/               # Static assets (images, icons)
│   │   ├── favicon.svg       # Site favicon
│   │   └── images/           # Login background images
│   └── styles/               # Global styling system
│       ├── design-system.css # Main design system entry point
│       ├── +page.css         # Page-specific styles
│       └── design-system-styles/ # Modular CSS architecture
│           ├── variables.css # CSS custom properties
│           ├── themes.css    # Light/dark mode configurations
│           ├── base.css      # Base styles and resets
│           ├── utilities.css # Utility classes
│           └── layout.css    # Layout-specific styles
└── routes/                   # SvelteKit routing
    ├── +layout.svelte       # Global layout wrapper
    ├── +page.svelte         # Main application entry point
    └── api/                 # Backend API endpoints
        ├── auth/            # Authentication endpoints
        ├── accounts/        # Account management endpoints
        ├── activity-logs/   # Activity logging endpoints
        ├── archived-students/ # Student archiving endpoints
        ├── subjects/        # Subject management endpoints
        └── helper/          # API utility functions
            ├── api-helper.js
            └── auth-helper.js
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
- **Dashboard** with system overview and statistics using animated Odometer counters
- **Account Creation** for students, teachers, and administrators with role-based setup
- **Student Masterlist** with comprehensive student information management and search capabilities
- **Archived Students** management with restoration capabilities and status tracking
- **Student Grades List** for academic oversight and performance monitoring across all students
- **Room Management** with CRUD operations for classroom management and facility organization
- **Section Management** for organizing student groups by grade level and class assignments
- **Subject Creation** (DepEd curriculum-aligned) with grade level assignments and course management
- **Schedule Assignment** with time slot management, conflict detection, and resource allocation
- **Document Request Management** with approval workflow, status tracking, and administrative oversight

#### 👨‍🎓 Student Features
- **Profile Management** with personal information display
- **Grade Viewing** with performance tracking and academic status
- **Class Schedule** with daily and weekly views
- **Document Requests** with status tracking and submission history
- **Notifications** with filtering by type (grades, schedule, documents, todo)
- **Todo List Management** with categories, due dates, completion tracking, and priority levels

#### 👨‍🏫 Teacher Features
- **Class Schedule** with teaching assignments and time management
- **Class Management** with advanced features including:
  - **Class Selection** interface for choosing teaching assignments
  - **Class List Views** with detailed student information and grading capabilities
  - **Advanced Grading System** with spreadsheet-style interface
  - **Custom Total Score Modals** for flexible assessment scoring
- **Advisory Class Management** with comprehensive student oversight and mentoring tools
- **Student Performance Tracking** with detailed academic progress monitoring

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

### Backend & Database
- **Database**: PostgreSQL with comprehensive schema design
- **Database Driver**: pg (PostgreSQL client) 8.16.3
- **Authentication**: bcrypt 6.0.0 for secure password hashing
- **Environment Management**: dotenv 17.2.2 for configuration
- **File Processing**: xlsx 0.18.5 for spreadsheet operations

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
- **Component System**: Role-based component organization with modular architecture
- **State Management**: Svelte 5 runes (`$state()`, `$derived()`) for reactive programming
- **Routing**: SvelteKit file-based routing with API endpoints
- **Authentication**: Custom auth store with role-based access control and secure session management
- **Database Architecture**: PostgreSQL with indexed tables, triggers, and JSONB support
- **API Design**: RESTful endpoints with proper error handling and validation


#### Authentication Features

- **Account Number-Based Login**: System supports both account numbers and email addresses for authentication
- **Secure Password Hashing**: Uses bcrypt for robust password security
- **Automatic Role Detection**: System determines user role based on account type in database
- **Role-based Routing**: Each account type redirects to its respective portal with appropriate permissions
- **Personalized Interface**: Login success includes user's name and role-specific navigation
- **Session Management**: Secure session handling with logout functionality and activity tracking
- **Form Validation**: Client-side validation for login credentials with comprehensive error handling
- **Database Integration**: Authentication queries against PostgreSQL with indexed lookups for performance

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

- **`+layout.svelte`**: Global layout, imports design system, manages fonts and meta tags, includes global toast and modal containers
- **`+page.svelte`**: Main application controller, handles authentication and role-based rendering with Svelte 5 runes
- **`design-system.css`**: Central import point for all design system modules
- **`database-schema.sql`**: Complete PostgreSQL database schema with tables, indexes, triggers, and sample data
- **`db.js`**: Database connection handler and query utilities for PostgreSQL integration
- **`auth.js`**: Authentication state management with role detection and session handling
- **API Endpoints**: RESTful server routes for authentication, account management, activity logging, and data operations
- **Menu components**: Handle navigation state and section switching for each user role
- **Section components**: Individual feature implementations with component-scoped styling
- **Modal/Toast Systems**: Global state management for notifications and modal dialogs
- **Grading Components**: Advanced grading system with spreadsheet interface and custom scoring modals

## 🔧 Customization & Extension

### Adding New Features

1. Create component in appropriate role section (`src/components/users/[role]/sections/`)
2. Add navigation item to corresponding menu component
3. Update main page component (`+page.svelte`) to include new section
4. Follow existing naming conventions and styling patterns
5. Use unique CSS class prefixes to prevent style conflicts

### Styling Guidelines

- Use CSS custom properties from the design system (`src/lib/styles/design-system-styles/variables.css`)
- Maintain component-scoped styles with unique prefixes (e.g., `studentgrade-`, `adminroom-`)
- Follow Material Design 3 principles and design tokens
- Ensure responsive design across devices
- Reference existing components for consistent dropdown implementations

### Development Best Practices

- **State Management**: Use Svelte 5 runes (`$state()`, `$derived()`) for reactive state
- **Component Organization**: Follow role-based directory structure
- **Global Systems**: Utilize toast notifications and modal dialogs for user feedback
- **Authentication**: Leverage role-based access control for feature gating
- **Design Consistency**: Reference design system variables and existing component patterns

This system provides a scalable, maintainable foundation for managing high school student information with a focus on the Philippine educational context and modern web development practices.
