# 📊 SS1 (Student Information System) Flowchart

> **Branch**: SS1 - Student Information System  
> **Version**: 1.0  
> **Last Updated**: February 2026

This document provides comprehensive visual flowcharts for the SS1 (Student Information System) branch of the SET-2 High School Student Information System.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Main System Flow](#main-system-flow)
3. [User Authentication Flow](#user-authentication-flow)
4. [Student Portal Flow](#student-portal-flow)
5. [Teacher Portal Flow](#teacher-portal-flow)
6. [Admin Portal Flow](#admin-portal-flow)
7. [Data Processing Flow](#data-processing-flow)
8. [Notification System Flow](#notification-system-flow)
9. [Grade Management Flow](#grade-management-flow)
10. [Security & Access Control Flow](#security--access-control-flow)

---

## System Overview

### 🏗️ High-Level Architecture

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        S[👨‍🎓 Student]
        T[👨‍🏫 Teacher]
        A[👨‍💼 Admin]
    end

    subgraph Frontend["🖥️ SvelteKit Frontend"]
        LP[Login Page]
        SP[Student Portal]
        TP[Teacher Portal]
        AP[Admin Portal]
    end

    subgraph Backend["⚙️ API Layer"]
        AUTH[Auth API]
        GRADE[Grades API]
        SCHED[Schedule API]
        DOC[Documents API]
        NOTIFY[Notifications API]
        AI[AI Analysis API]
    end

    subgraph Database["🗄️ MongoDB"]
        DB[(MongoDB Database)]
    end

    subgraph External["🌐 External Services"]
        BREVO[Brevo Email API]
        OPENROUTER[OpenRouter AI]
    end

    S --> LP
    T --> LP
    A --> LP
    
    LP --> AUTH
    AUTH --> SP & TP & AP
    
    SP --> GRADE & SCHED & DOC & NOTIFY & AI
    TP --> GRADE & SCHED & NOTIFY
    AP --> GRADE & SCHED & DOC & NOTIFY
    
    AUTH & GRADE & SCHED & DOC & NOTIFY & AI --> DB
    AUTH --> BREVO
    AI --> OPENROUTER

    style Users fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style Frontend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style Backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style Database fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style External fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## Main System Flow

### 🔄 Complete System Workflow

```mermaid
flowchart TD
    START((🚀 Start)) --> ACCESS[User Accesses System]
    ACCESS --> AUTH_CHECK{Authenticated?}
    
    AUTH_CHECK -->|No| LOGIN[Display Login Page]
    LOGIN --> ENTER_CREDS[Enter Credentials]
    ENTER_CREDS --> VALIDATE{Valid Credentials?}
    
    VALIDATE -->|No| ERROR[Show Error Message]
    ERROR --> LOGIN
    
    VALIDATE -->|Yes| CHECK_ROLE{Check User Role}
    
    CHECK_ROLE -->|Student| STUDENT_PORTAL[📚 Student Portal]
    CHECK_ROLE -->|Teacher| TEACHER_PORTAL[📝 Teacher Portal]
    CHECK_ROLE -->|Admin| ADMIN_PORTAL[⚙️ Admin Portal]
    
    AUTH_CHECK -->|Yes| CHECK_ROLE
    
    STUDENT_PORTAL --> S_ACTIONS{Student Actions}
    S_ACTIONS -->|View Grades| VIEW_GRADES[Display Grades & AI Analysis]
    S_ACTIONS -->|View Schedule| VIEW_SCHEDULE[Display Class Schedule]
    S_ACTIONS -->|View Profile| VIEW_PROFILE[Display Profile Info]
    S_ACTIONS -->|View Rankings| VIEW_RANKINGS[Display Class Rankings]
    S_ACTIONS -->|Manage Todos| MANAGE_TODOS[Todo List Management]
    S_ACTIONS -->|Request Docs| REQUEST_DOCS[Submit Document Request]
    S_ACTIONS -->|Notifications| VIEW_NOTIFS[View Notifications]
    
    TEACHER_PORTAL --> T_ACTIONS{Teacher Actions}
    T_ACTIONS -->|Manage Grades| MANAGE_GRADES[Grading Spreadsheet]
    T_ACTIONS -->|View Classes| VIEW_CLASSES[Class Management]
    T_ACTIONS -->|Advisory| ADVISORY[Advisory Class Management]
    T_ACTIONS -->|Schedule| T_SCHEDULE[View Teaching Schedule]
    
    ADMIN_PORTAL --> A_ACTIONS{Admin Actions}
    A_ACTIONS -->|Dashboard| DASHBOARD[System Dashboard]
    A_ACTIONS -->|Manage Users| MANAGE_USERS[User Account Management]
    A_ACTIONS -->|Manage Sections| MANAGE_SECTIONS[Section Management]
    A_ACTIONS -->|Manage Subjects| MANAGE_SUBJECTS[Subject Management]
    A_ACTIONS -->|Document Requests| DOC_REQUESTS[Process Document Requests]
    A_ACTIONS -->|Settings| ADMIN_SETTINGS[System Settings]
    
    VIEW_GRADES & VIEW_SCHEDULE & VIEW_PROFILE & VIEW_RANKINGS & MANAGE_TODOS & REQUEST_DOCS & VIEW_NOTIFS --> END_SESSION{Continue?}
    MANAGE_GRADES & VIEW_CLASSES & ADVISORY & T_SCHEDULE --> END_SESSION
    DASHBOARD & MANAGE_USERS & MANAGE_SECTIONS & MANAGE_SUBJECTS & DOC_REQUESTS & ADMIN_SETTINGS --> END_SESSION
    
    END_SESSION -->|Yes| CHECK_ROLE
    END_SESSION -->|No| LOGOUT[Logout]
    LOGOUT --> FINISH((🔚 End))

    style START fill:#4caf50,stroke:#2e7d32,color:#fff
    style FINISH fill:#f44336,stroke:#c62828,color:#fff
    style STUDENT_PORTAL fill:#2196f3,stroke:#1565c0,color:#fff
    style TEACHER_PORTAL fill:#ff9800,stroke:#ef6c00,color:#fff
    style ADMIN_PORTAL fill:#9c27b0,stroke:#6a1b9a,color:#fff
```

---

## User Authentication Flow

### 🔐 Login Process

```mermaid
flowchart TD
    A[🚀 User Opens Application] --> B[Display Login Page]
    B --> C[Enter Account Number/Email]
    C --> D[Enter Password]
    D --> E[Click Login Button]
    E --> F{Client-Side Validation}
    
    F -->|Invalid| G[❌ Show Validation Error]
    G --> C
    
    F -->|Valid| H[Send Login Request]
    H --> I[POST /api/auth/login]
    I --> J{Find User in Database}
    
    J -->|Not Found| K[❌ User Not Found Error]
    K --> L[Log Failed Attempt]
    L --> M[Return Error Response]
    M --> G
    
    J -->|Found| N{Verify Password}
    N -->|Invalid| O[❌ Invalid Password]
    O --> L
    
    N -->|Valid| P{Check Account Status}
    P -->|Inactive/Archived| Q[❌ Account Disabled]
    Q --> L
    
    P -->|Active| R[✅ Authentication Success]
    R --> S[Update last_active_at]
    S --> T[Create Activity Log]
    T --> U[Generate Session]
    U --> V{Determine User Role}
    
    V -->|Student| W[🎓 Redirect to Student Portal]
    V -->|Teacher| X[📚 Redirect to Teacher Portal]
    V -->|Admin| Y[⚙️ Redirect to Admin Portal]
    
    W & X & Y --> Z[✅ Login Complete]

    style A fill:#e3f2fd,stroke:#1976d2
    style Z fill:#c8e6c9,stroke:#388e3c
    style G fill:#ffcdd2,stroke:#c62828
    style K fill:#ffcdd2,stroke:#c62828
    style O fill:#ffcdd2,stroke:#c62828
    style Q fill:#ffcdd2,stroke:#c62828
```

### 🔑 Password Reset Flow

```mermaid
flowchart TD
    A[User Clicks 'Forgot Password'] --> B[Display Reset Form]
    B --> C[Enter Account Number or Email]
    C --> D[Submit Request]
    D --> E{Find User}
    
    E -->|Not Found| F[❌ Show Generic Message]
    F --> G[End - Security]
    
    E -->|Found| H[Generate 6-Digit Code]
    H --> I[Set 15-Min Expiration]
    I --> J[Store Code in Database]
    J --> K[Send Email via Brevo]
    K --> L[✅ Show Success Message]
    L --> M[User Checks Email]
    M --> N[Enter Verification Code]
    N --> O{Validate Code}
    
    O -->|Invalid/Expired| P[❌ Invalid Code Error]
    P --> Q{Attempts < 3?}
    Q -->|Yes| N
    Q -->|No| R[Lock Account Temporarily]
    R --> G
    
    O -->|Valid| S[Show New Password Form]
    S --> T[Enter New Password]
    T --> U[Confirm Password]
    U --> V{Passwords Match?}
    
    V -->|No| W[❌ Password Mismatch]
    W --> T
    
    V -->|Yes| X{Password Strong?}
    X -->|No| Y[❌ Weak Password]
    Y --> T
    
    X -->|Yes| Z[Hash with Bcrypt]
    Z --> AA[Update Password in DB]
    AA --> AB[Clear Reset Code]
    AB --> AC[Log Activity]
    AC --> AD[✅ Password Reset Complete]
    AD --> AE[Redirect to Login]

    style A fill:#e3f2fd,stroke:#1976d2
    style AD fill:#c8e6c9,stroke:#388e3c
    style F fill:#ffcdd2,stroke:#c62828
    style P fill:#ffcdd2,stroke:#c62828
    style W fill:#ffcdd2,stroke:#c62828
    style Y fill:#ffcdd2,stroke:#c62828
```

---

## Student Portal Flow

### 📚 Student Portal Navigation

```mermaid
flowchart TD
    ENTRY[🎓 Student Portal Entry] --> DASHBOARD[Dashboard Home]
    
    DASHBOARD --> NAV{Navigation Options}
    
    NAV --> GRADES[📊 Grades]
    NAV --> SCHEDULE[📅 Schedule]
    NAV --> PROFILE[👤 Profile]
    NAV --> RANKINGS[🏆 Rankings]
    NAV --> TODOS[✅ Todo List]
    NAV --> DOCS[📄 Documents]
    NAV --> NOTIFS[🔔 Notifications]
    
    GRADES --> G_VIEW[View All Grades]
    G_VIEW --> G_FILTER{Filter Options}
    G_FILTER --> G_QUARTER[By Quarter]
    G_FILTER --> G_SUBJECT[By Subject]
    G_FILTER --> G_YEAR[By School Year]
    G_VIEW --> G_AI[🤖 AI Analysis]
    G_AI --> G_CACHE{Cache Available?}
    G_CACHE -->|Yes| G_CACHED[Show Cached Analysis]
    G_CACHE -->|No| G_FETCH[Fetch from OpenRouter]
    G_FETCH --> G_STORE[Cache for 7 Days]
    G_STORE --> G_DISPLAY[Display AI Insights]
    G_CACHED --> G_DISPLAY
    G_VIEW --> G_CHARTS[📈 Interactive Charts]
    
    SCHEDULE --> S_DAILY[Daily View]
    SCHEDULE --> S_WEEKLY[Weekly View]
    S_DAILY & S_WEEKLY --> S_DETAILS[Class Details]
    
    PROFILE --> P_VIEW[View Profile Info]
    P_VIEW --> P_SECTION[Section Information]
    P_VIEW --> P_PERSONAL[Personal Details]
    
    RANKINGS --> R_CLASS[Class Rankings]
    R_CLASS --> R_POSITION[View Position]
    R_CLASS --> R_PERCENTILE[View Percentile]
    
    TODOS --> T_LIST[Todo List]
    T_LIST --> T_CREATE[Create Todo]
    T_LIST --> T_COMPLETE[Mark Complete]
    T_LIST --> T_DELETE[Delete Todo]
    T_CREATE --> T_CATEGORY{Select Category}
    T_CATEGORY --> T_ASSIGN[Assignment]
    T_CATEGORY --> T_STUDY[Study]
    T_CATEGORY --> T_PROJECT[Project]
    T_CATEGORY --> T_EXAM[Exam]
    
    DOCS --> D_LIST[Document Requests]
    D_LIST --> D_NEW[New Request]
    D_NEW --> D_TYPE[Select Document Type]
    D_TYPE --> D_SUBMIT[Submit Request]
    D_SUBMIT --> D_TRACK[Track Status]
    
    NOTIFS --> N_ALL[All Notifications]
    N_ALL --> N_FILTER{Filter By Type}
    N_FILTER --> N_GRADES[Grade Updates]
    N_FILTER --> N_SCHED[Schedule Changes]
    N_FILTER --> N_DOCS[Document Updates]
    N_FILTER --> N_TODO[Todo Reminders]

    style ENTRY fill:#2196f3,stroke:#1565c0,color:#fff
    style GRADES fill:#4caf50,stroke:#388e3c,color:#fff
    style SCHEDULE fill:#ff9800,stroke:#ef6c00,color:#fff
    style PROFILE fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style RANKINGS fill:#f44336,stroke:#c62828,color:#fff
    style TODOS fill:#00bcd4,stroke:#0097a7,color:#fff
    style DOCS fill:#795548,stroke:#5d4037,color:#fff
    style NOTIFS fill:#607d8b,stroke:#455a64,color:#fff
```

### 📊 Grade Viewing Flow

```mermaid
flowchart TD
    A[Student Opens Grades] --> B[GET /api/student-grades]
    B --> C[API Receives Request]
    C --> D[Extract User from Session]
    D --> E{User Authenticated?}
    
    E -->|No| F[❌ Return 401]
    
    E -->|Yes| G[Build Aggregation Pipeline]
    G --> H[Match: student_id, quarter, school_year]
    H --> I[Lookup: subjects collection]
    I --> J[Lookup: sections collection]
    J --> K[Lookup: teachers collection]
    K --> L[Execute Query]
    L --> M[Format Response]
    M --> N[Return Grade Data]
    N --> O[Display in UI]
    
    O --> P{Request AI Analysis?}
    P -->|No| Q[End]
    
    P -->|Yes| R[POST /api/ai-grade-analysis]
    R --> S{Check Cache}
    S -->|Hit| T[Return Cached Analysis]
    S -->|Miss| U[Call OpenRouter API]
    U --> V[Process AI Response]
    V --> W[Store in Cache - TTL: 7 days]
    W --> X[Return Analysis]
    T --> Y[Display AI Insights]
    X --> Y
    
    Y --> Z[Show Recommendations]
    Z --> AA[Display Charts & Visualizations]

    style A fill:#e3f2fd,stroke:#1976d2
    style F fill:#ffcdd2,stroke:#c62828
    style Y fill:#c8e6c9,stroke:#388e3c
```

---

## Teacher Portal Flow

### 📝 Teacher Portal Navigation

```mermaid
flowchart TD
    ENTRY[👨‍🏫 Teacher Portal Entry] --> DASHBOARD[Teacher Dashboard]
    
    DASHBOARD --> NAV{Navigation Options}
    
    NAV --> CLASSES[📚 My Classes]
    NAV --> GRADING[📝 Grading]
    NAV --> ADVISORY[🎓 Advisory]
    NAV --> SCHEDULE[📅 Schedule]
    NAV --> PROFILE[👤 Profile]
    
    CLASSES --> C_SELECT[Select Class]
    C_SELECT --> C_ROSTER[View Student Roster]
    C_SELECT --> C_GRADES[Class Grades Overview]
    
    GRADING --> G_SELECT[Select Section/Subject]
    G_SELECT --> G_SPREADSHEET[📊 Grading Spreadsheet]
    G_SPREADSHEET --> G_INPUT[Input Grades]
    G_INPUT --> G_CALC[Auto-Calculate Averages]
    G_CALC --> G_WW[Written Work: 30%]
    G_CALC --> G_PT[Performance Tasks: 50%]
    G_CALC --> G_QA[Quarterly Assessment: 20%]
    G_WW & G_PT & G_QA --> G_FINAL[Final Grade]
    G_FINAL --> G_SAVE[Save Grades]
    G_SAVE --> G_NOTIFY[Create Notifications]
    
    ADVISORY --> A_CLASS[Advisory Class]
    A_CLASS --> A_STUDENTS[Student List]
    A_CLASS --> A_PERFORMANCE[Performance Overview]
    A_CLASS --> A_CONCERNS[Student Concerns]
    
    SCHEDULE --> S_VIEW[View Schedule]
    S_VIEW --> S_DAILY[Daily View]
    S_VIEW --> S_WEEKLY[Weekly View]

    style ENTRY fill:#ff9800,stroke:#ef6c00,color:#fff
    style GRADING fill:#4caf50,stroke:#388e3c,color:#fff
    style CLASSES fill:#2196f3,stroke:#1565c0,color:#fff
    style ADVISORY fill:#9c27b0,stroke:#6a1b9a,color:#fff
```

### 📝 Grade Input Workflow

```mermaid
flowchart TD
    A[Teacher Opens Grading] --> B[Select Section]
    B --> C[Select Subject]
    C --> D[Select Quarter]
    D --> E[Load Grade Configuration]
    E --> F[GET /api/grade-configurations]
    F --> G[Display Grade Items Structure]
    
    G --> H[Load Existing Grades]
    H --> I[GET /api/grades batch]
    I --> J[Populate Spreadsheet]
    
    J --> K[Teacher Inputs/Edits Grades]
    K --> L{Validate Input}
    
    L -->|Invalid| M[❌ Show Validation Error]
    M --> K
    
    L -->|Valid: 0-100| N[Calculate Component Average]
    N --> O[Apply DepEd Weights]
    O --> P[WW × 0.30]
    O --> Q[PT × 0.50]
    O --> R[QA × 0.20]
    P & Q & R --> S[Sum = Final Grade]
    
    S --> T[Display Calculated Grade]
    T --> U{Save Changes?}
    
    U -->|No| V[Continue Editing]
    V --> K
    
    U -->|Yes| W[PUT /api/grades batch]
    W --> X[Validate Server-Side]
    X --> Y[Update grades Collection]
    Y --> Z[Create Notifications for Students]
    Z --> AA[Log Activity]
    AA --> AB[✅ Grades Saved Successfully]
    AB --> AC[Update UI]

    style A fill:#e3f2fd,stroke:#1976d2
    style AB fill:#c8e6c9,stroke:#388e3c
    style M fill:#ffcdd2,stroke:#c62828
```

---

## Admin Portal Flow

### ⚙️ Admin Portal Navigation

```mermaid
flowchart TD
    ENTRY[👨‍💼 Admin Portal Entry] --> DASHBOARD[📊 Admin Dashboard]
    
    DASHBOARD --> STATS[System Statistics]
    STATS --> CHARTS[Interactive Charts]
    CHARTS --> C1[Students per Grade Level]
    CHARTS --> C2[Sections per Grade Level]
    CHARTS --> C3[Document Request Status]
    
    DASHBOARD --> NAV{Navigation Options}
    
    NAV --> ACCOUNTS[👥 User Accounts]
    NAV --> STUDENTS[🎓 Student Management]
    NAV --> SECTIONS[📚 Sections]
    NAV --> SUBJECTS[📖 Subjects]
    NAV --> SCHEDULES[📅 Schedules]
    NAV --> DOCUMENTS[📄 Documents]
    NAV --> SETTINGS[⚙️ Settings]
    
    ACCOUNTS --> ACC_CREATE[Create Account]
    ACCOUNTS --> ACC_LIST[List Accounts]
    ACCOUNTS --> ACC_EDIT[Edit Account]
    
    STUDENTS --> STU_LIST[Student Masterlist]
    STUDENTS --> STU_CREATE[Add Student]
    STUDENTS --> STU_ARCHIVE[Archive/Restore]
    STUDENTS --> STU_GRADES[View Grades]
    STUDENTS --> STU_BULK[Bulk Import/Export]
    
    SECTIONS --> SEC_LIST[List Sections]
    SECTIONS --> SEC_CREATE[Create Section]
    SECTIONS --> SEC_ASSIGN[Assign Students]
    SECTIONS --> SEC_ADVISOR[Assign Advisor]
    
    SUBJECTS --> SUB_LIST[List Subjects]
    SUBJECTS --> SUB_CREATE[Create Subject]
    SUBJECTS --> SUB_DEPED[DepEd Alignment]
    
    SCHEDULES --> SCHED_ROOMS[Room Management]
    SCHEDULES --> SCHED_TIME[Time Slots]
    SCHEDULES --> SCHED_ASSIGN[Schedule Assignment]
    
    DOCUMENTS --> DOC_PENDING[Pending Requests]
    DOCUMENTS --> DOC_APPROVED[Approved]
    DOCUMENTS --> DOC_COMPLETE[Completed]
    DOCUMENTS --> DOC_PROCESS[Process Request]
    
    SETTINGS --> SET_YEAR[School Year]
    SETTINGS --> SET_QUARTER[Current Quarter]
    SETTINGS --> SET_CONFIG[System Configuration]

    style ENTRY fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style DASHBOARD fill:#673ab7,stroke:#512da8,color:#fff
    style ACCOUNTS fill:#2196f3,stroke:#1565c0,color:#fff
    style STUDENTS fill:#4caf50,stroke:#388e3c,color:#fff
    style SECTIONS fill:#ff9800,stroke:#ef6c00,color:#fff
    style SUBJECTS fill:#f44336,stroke:#c62828,color:#fff
    style DOCUMENTS fill:#795548,stroke:#5d4037,color:#fff
```

### 👤 Account Creation Flow

```mermaid
flowchart TD
    A[Admin Opens Account Creation] --> B[Select Account Type]
    B --> C{Account Type}
    
    C -->|Student| D[Student Form]
    C -->|Teacher| E[Teacher Form]
    C -->|Admin| F[Admin Form]
    
    D --> G[Enter Student Details]
    G --> G1[Account Number]
    G --> G2[Full Name]
    G --> G3[Email]
    G --> G4[Grade Level]
    G --> G5[Section]
    
    E --> H[Enter Teacher Details]
    H --> H1[Account Number]
    H --> H2[Full Name]
    H --> H3[Email]
    H --> H4[Department]
    
    F --> I[Enter Admin Details]
    I --> I1[Account Number]
    I --> I2[Full Name]
    I --> I3[Email]
    I --> I4[Access Level]
    
    G1 & G2 & G3 & G4 & G5 --> J[Submit Form]
    H1 & H2 & H3 & H4 --> J
    I1 & I2 & I3 & I4 --> J
    
    J --> K{Validate Input}
    K -->|Invalid| L[❌ Show Errors]
    L --> M[Correct Errors]
    M --> J
    
    K -->|Valid| N{Account Number Unique?}
    N -->|No| O[❌ Duplicate Error]
    O --> M
    
    N -->|Yes| P[Generate Temporary Password]
    P --> Q[Hash Password - Bcrypt]
    Q --> R[Create User Document]
    R --> S[Insert into MongoDB]
    S --> T[Send Welcome Email - Brevo]
    T --> U[Include Credentials]
    U --> V[Log Activity]
    V --> W[✅ Account Created]
    W --> X[Display Success Message]

    style A fill:#e3f2fd,stroke:#1976d2
    style W fill:#c8e6c9,stroke:#388e3c
    style L fill:#ffcdd2,stroke:#c62828
    style O fill:#ffcdd2,stroke:#c62828
```

---

## Data Processing Flow

### 🗄️ Database Operations

```mermaid
flowchart TD
    subgraph Client["🖥️ Client Layer"]
        UI[User Interface]
        STORE[Svelte Store]
    end
    
    subgraph API["⚙️ API Layer"]
        ROUTE[API Route Handler]
        AUTH[Auth Middleware]
        VALID[Validation Layer]
        HELPER[Database Helper]
    end
    
    subgraph DB["🗄️ Database Layer"]
        MONGO[(MongoDB)]
        COLL[Collections]
    end
    
    UI -->|User Action| STORE
    STORE -->|API Call| ROUTE
    ROUTE --> AUTH
    AUTH -->|Verify Session| AUTH
    AUTH -->|Authenticated| VALID
    AUTH -->|❌ Unauthorized| UI
    VALID -->|Validate Input| VALID
    VALID -->|Valid| HELPER
    VALID -->|❌ Invalid| UI
    HELPER -->|Query| MONGO
    MONGO --> COLL
    COLL -->|Response| HELPER
    HELPER -->|Format| ROUTE
    ROUTE -->|JSON| STORE
    STORE -->|Update UI| UI

    style Client fill:#e3f2fd,stroke:#1976d2
    style API fill:#fff3e0,stroke:#f57c00
    style DB fill:#fce4ec,stroke:#c2185b
```

### 📊 Data Aggregation Pipeline

```mermaid
flowchart LR
    A[📥 Input Query] --> B[$match]
    B --> C[$lookup]
    C --> D[$unwind]
    D --> E[$group]
    E --> F[$sort]
    F --> G[$project]
    G --> H[📤 Output]
    
    B -->|Filter by criteria| B1[student_id, quarter, year]
    C -->|Join collections| C1[subjects, sections, users]
    D -->|Flatten arrays| D1[One doc per match]
    E -->|Calculate aggregates| E1[averages, counts]
    F -->|Order results| F1[by date, grade, rank]
    G -->|Select fields| G1[exclude sensitive data]

    style A fill:#4caf50,stroke:#388e3c,color:#fff
    style H fill:#2196f3,stroke:#1565c0,color:#fff
```

---

## Notification System Flow

### 🔔 Notification Lifecycle

```mermaid
flowchart TD
    subgraph Triggers["🎯 Trigger Events"]
        T1[Grade Posted]
        T2[Schedule Changed]
        T3[Document Ready]
        T4[Todo Due]
        T5[System Alert]
    end
    
    T1 & T2 & T3 & T4 & T5 --> CREATE[Create Notification]
    
    CREATE --> FORMAT[Format Notification Data]
    FORMAT --> TYPE{Set Type}
    TYPE --> TYPE1[grades]
    TYPE --> TYPE2[schedule]
    TYPE --> TYPE3[documents]
    TYPE --> TYPE4[todo]
    
    TYPE1 & TYPE2 & TYPE3 & TYPE4 --> INSERT[Insert into notifications Collection]
    INSERT --> STORE[Store in MongoDB]
    
    subgraph Delivery["📤 Delivery"]
        POLL[Polling - 30s Interval]
        STORE --> POLL
        POLL --> QUERY[Query Unread Notifications]
        QUERY --> COUNT[Count New Notifications]
        COUNT --> BADGE[Update Badge Count]
        BADGE --> UI[Display in UI]
    end
    
    subgraph UserActions["👆 User Actions"]
        UI --> READ[Mark as Read]
        READ --> UPDATE[Update read: true]
        UPDATE --> MONGO[(MongoDB)]
        
        UI --> DELETE[Delete Notification]
        DELETE --> REMOVE[Remove from Collection]
        REMOVE --> MONGO
    end

    style Triggers fill:#fff3e0,stroke:#f57c00
    style Delivery fill:#e3f2fd,stroke:#1976d2
    style UserActions fill:#e8f5e9,stroke:#388e3c
```

---

## Grade Management Flow

### 📈 Complete Grading Workflow

```mermaid
flowchart TD
    subgraph Setup["📋 Setup Phase"]
        A1[Admin Configures Grade Items]
        A2[Set Component Weights]
        A3[Define Assessment Types]
        A1 --> A2 --> A3
    end
    
    subgraph Input["✏️ Input Phase"]
        B1[Teacher Selects Class]
        B2[Teacher Opens Spreadsheet]
        B3[Load Student Roster]
        B4[Input Individual Grades]
        B5[Real-time Calculation]
        B1 --> B2 --> B3 --> B4 --> B5
    end
    
    subgraph Calculate["🔢 Calculation Phase"]
        C1[Calculate Written Work Average]
        C2[Calculate Performance Tasks Average]
        C3[Calculate Quarterly Assessment]
        C4[Apply DepEd Weights]
        C5[Compute Final Grade]
        C1 & C2 & C3 --> C4 --> C5
    end
    
    subgraph Verify["✅ Verification Phase"]
        D1[Review Calculated Grades]
        D2[Verify Accuracy]
        D3[Digital Signature]
        D4[Lock Verified Grades]
        D1 --> D2 --> D3 --> D4
    end
    
    subgraph Distribute["📤 Distribution Phase"]
        E1[Save to Database]
        E2[Create Notifications]
        E3[Update Student Records]
        E4[Available for AI Analysis]
        E1 --> E2 --> E3 --> E4
    end
    
    Setup --> Input
    Input --> Calculate
    Calculate --> Verify
    Verify --> Distribute
    
    subgraph View["👁️ Viewing Phase"]
        F1[Student Views Grades]
        F2[Display with Charts]
        F3[AI-Powered Insights]
        F4[Class Rankings]
        F1 --> F2 --> F3 --> F4
    end
    
    Distribute --> View

    style Setup fill:#e3f2fd,stroke:#1976d2
    style Input fill:#fff3e0,stroke:#f57c00
    style Calculate fill:#f3e5f5,stroke:#7b1fa2
    style Verify fill:#e8f5e9,stroke:#388e3c
    style Distribute fill:#fce4ec,stroke:#c2185b
    style View fill:#e0f2f1,stroke:#00897b
```

---

## Security & Access Control Flow

### 🔒 Authentication & Authorization

```mermaid
flowchart TD
    subgraph Request["📨 Incoming Request"]
        REQ[API Request]
        HEADER[x-user-info Header]
    end
    
    REQ --> HEADER
    HEADER --> EXTRACT[Extract User Info]
    EXTRACT --> DECRYPT[Decrypt User Data]
    
    DECRYPT --> CHECK_USER{User Exists?}
    CHECK_USER -->|No| DENY1[❌ 401 Unauthorized]
    
    CHECK_USER -->|Yes| CHECK_ACTIVE{Account Active?}
    CHECK_ACTIVE -->|No| DENY2[❌ 403 Forbidden]
    
    CHECK_ACTIVE -->|Yes| CHECK_ROLE{Has Required Role?}
    CHECK_ROLE -->|No| DENY3[❌ 403 Forbidden]
    
    CHECK_ROLE -->|Yes| CHECK_PERM{Has Permission?}
    CHECK_PERM -->|No| DENY4[❌ 403 Forbidden]
    
    CHECK_PERM -->|Yes| PROCEED[✅ Proceed with Request]
    PROCEED --> PROCESS[Process Business Logic]
    PROCESS --> RESPOND[Return Response]
    
    DENY1 & DENY2 & DENY3 & DENY4 --> LOG[Log Security Event]
    LOG --> RETURN_ERROR[Return Error Response]

    style REQ fill:#e3f2fd,stroke:#1976d2
    style PROCEED fill:#c8e6c9,stroke:#388e3c
    style DENY1 fill:#ffcdd2,stroke:#c62828
    style DENY2 fill:#ffcdd2,stroke:#c62828
    style DENY3 fill:#ffcdd2,stroke:#c62828
    style DENY4 fill:#ffcdd2,stroke:#c62828
```

### 🛡️ Role-Based Access Control

```mermaid
flowchart LR
    subgraph Roles["👥 User Roles"]
        STUDENT[👨‍🎓 Student]
        TEACHER[👨‍🏫 Teacher]
        ADMIN[👨‍💼 Admin]
    end
    
    subgraph StudentPerms["🎓 Student Permissions"]
        S1[View Own Grades]
        S2[View Schedule]
        S3[View Profile]
        S4[Manage Todos]
        S5[Request Documents]
        S6[View Notifications]
        S7[View Rankings]
    end
    
    subgraph TeacherPerms["📚 Teacher Permissions"]
        T1[Input Grades]
        T2[View Classes]
        T3[Manage Advisory]
        T4[View Schedule]
        T5[Verify Grades]
    end
    
    subgraph AdminPerms["⚙️ Admin Permissions"]
        A1[Manage Users]
        A2[Manage Sections]
        A3[Manage Subjects]
        A4[Manage Schedules]
        A5[Process Documents]
        A6[System Settings]
        A7[View All Data]
    end
    
    STUDENT --> StudentPerms
    TEACHER --> TeacherPerms
    TEACHER --> S1 & S2 & S6
    ADMIN --> AdminPerms
    ADMIN --> T1 & T2 & T4

    style Roles fill:#e3f2fd,stroke:#1976d2
    style StudentPerms fill:#c8e6c9,stroke:#388e3c
    style TeacherPerms fill:#fff3e0,stroke:#f57c00
    style AdminPerms fill:#f3e5f5,stroke:#7b1fa2
```

---

## 📚 Legend

| Symbol | Meaning |
|--------|---------|
| 🚀 | Start Point |
| 🔚 | End Point |
| ❌ | Error/Failure |
| ✅ | Success |
| 👨‍🎓 | Student |
| 👨‍🏫 | Teacher |
| 👨‍💼 | Admin |
| 📊 | Data/Analytics |
| 🔐 | Security |
| 🔔 | Notification |
| 📧 | Email |
| 🤖 | AI/Automation |

---

## 📝 Notes

- All flowcharts use Mermaid syntax for GitHub markdown rendering
- Colors follow Material Design 3 guidelines for consistency
- Arrows indicate data flow direction
- Diamond shapes (◇) represent decision points
- Rectangular shapes (□) represent processes or actions
- Rounded rectangles represent start/end points

---

> **Document Version**: 1.0  
> **Created For**: SET-2 High School Student Information System  
> **Branch Focus**: SS1 (Student Information System)
