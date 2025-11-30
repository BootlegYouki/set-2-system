# SET-2 System Data Dictionary (SS1 - Student Information System)

> **Branch Context**: This document focuses on SS1 (Student Information System) aspects of the SET-2 system.

## Overview

The SET-2 Student Information System uses MongoDB as its database, storing data in flexible document structures. This dictionary documents all collections, their fields, relationships, and business rules for the SS1 module.

---

## Core Collections

### 1. users
**Purpose**: Stores all user accounts (students, teachers, administrators)

**SS1 Focus**: Primary entity for student account management

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique identifier for the user |
| `account_number` | String | No | Student's account number (primary login credential) |
| `account_type` | String | No | User role: `student`, `teacher`, or `admin` |
| `first_name` | String | No | Student's first name |
| `last_name` | String | No | Student's last name |
| `middle_initial` | String | Yes | Middle initial |
| `full_name` | String | No | Auto-generated full name |
| `gender` | String | No | Gender: `male` or `female` |
| `email` | String | Yes | Student's email address |
| `grade_level` | String | Yes | Grade level: `7`, `8`, `9`, or `10` (SS1 scope) |
| `birthdate` | Date | Yes | Student's date of birth |
| `address` | String | Yes | Home address |
| `age` | Number | Yes | Calculated age |
| `guardian` | String | Yes | Parent/Guardian name |
| `contact_number` | String | Yes | Contact number |
| `password_hash` | String | No | Bcrypt hashed password (12 salt rounds) |
| `status` | String | No | Account status: `active`, `inactive`, `archived` |
| `created_at` | Date | No | Account creation timestamp |
| `updated_at` | Date | No | Last update timestamp |
| `last_active_at` | Date | No | Last activity timestamp |
| `archived_at` | Date | Yes | Archival timestamp |
| `password_reset_attempts` | Number | Yes | Password reset attempt counter |
| `password_reset_code` | String | Yes | 6-digit verification code |
| `password_reset_expires` | Date | Yes | Code expiration (15 minutes) |
| `password_reset_token` | String | Yes | Reset token |

**Business Rules:**
- Account numbers must be unique
- Grade level restricted to 7-10 for SS1
- Password must be at least 8 characters
- Status defaults to `active` on creation

---

### 2. sections
**Purpose**: Organizes students into class sections by grade level

**SS1 Focus**: Core organizational unit for student grouping

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique section identifier |
| `name` | String | No | Section name (e.g., "Diamond", "Pearl") |
| `grade_level` | Number | No | Grade level: 7, 8, 9, or 10 |
| `school_year` | String | No | Academic year (e.g., "2023-2024") |
| `adviser_id` | ObjectId | Yes | Reference to teacher (users._id) |
| `status` | String | No | Section status: `active`, `inactive` |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |
| `deleted_at` | Date | Yes | Soft delete timestamp |

**Relationships:**
- `adviser_id` → `users._id` (teacher)

**Business Rules:**
- Each section belongs to one grade level
- Section names must be unique within a grade level and school year
- Status controls visibility in the system

---

### 3. section_students
**Purpose**: Links students to their assigned sections (enrollment records)

**SS1 Focus**: Student-section enrollment management

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique enrollment record ID |
| `section_id` | ObjectId | No | Reference to sections._id |
| `student_id` | ObjectId | No | Reference to users._id (student) |
| `enrolled_at` | Date | No | Enrollment date |
| `status` | String | No | Enrollment status: `active`, `removed` |
| `removed_at` | Date | Yes | Removal timestamp |

**Relationships:**
- `section_id` → `sections._id`
- `student_id` → `users._id` (where account_type = 'student')

**Business Rules:**
- One student can only be enrolled in one section per school year
- Status `removed` indicates student transfer or withdrawal

---

### 4. subjects
**Purpose**: Defines academic subjects aligned with DepEd curriculum

**SS1 Focus**: Subject offerings for grades 7-10

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique subject identifier |
| `name` | String | No | Subject name (e.g., "Mathematics") |
| `code` | String | No | Subject code (e.g., "MATH7") |
| `grade_level` | Number | No | Target grade level: 7, 8, 9, or 10 |
| `department_id` | ObjectId | Yes | Reference to departments._id |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Relationships:**
- `department_id` → `departments._id`

**Business Rules:**
- Subject codes must be unique per grade level
- Subjects must align with Philippine DepEd K-12 curriculum
- Each subject is assigned to one grade level

---

### 5. schedules
**Purpose**: Class timetable management linking sections, subjects, teachers, and time slots

**SS1 Focus**: Student class schedule viewing

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique schedule entry ID |
| `section_id` | ObjectId | No | Reference to sections._id |
| `day_of_week` | String | No | Day: `Monday`, `Tuesday`, etc. |
| `start_time` | String | No | Start time (e.g., "08:00") |
| `end_time` | String | No | End time (e.g., "09:00") |
| `schedule_type` | String | No | Type: `subject` or `activity` |
| `subject_id` | ObjectId | Yes | Reference to subjects._id (if type = subject) |
| `activity_type_id` | ObjectId | Yes | Reference to activity_types._id (if type = activity) |
| `teacher_id` | ObjectId | Yes | Reference to users._id (teacher) |
| `school_year` | String | No | Academic year |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Relationships:**
- `section_id` → `sections._id`
- `subject_id` → `subjects._id`
- `activity_type_id` → `activity_types._id`
- `teacher_id` → `users._id` (where account_type = 'teacher')

**Business Rules:**
- Time slots cannot overlap for the same section
- Either subject_id or activity_type_id must be set (not both)
- Schedule entries are specific to a school year

---

### 6. grades
**Purpose**: Stores student grades for subjects across quarters

**SS1 Focus**: Core academic performance tracking

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique grade record ID |
| `school_year` | String | No | Academic year |
| `student_id` | ObjectId | No | Reference to users._id (student) |
| `subject_id` | ObjectId | No | Reference to subjects._id |
| `section_id` | ObjectId | No | Reference to sections._id |
| `quarter` | Number | No | Quarter: 1, 2, 3, or 4 |
| `teacher_id` | ObjectId | No | Reference to users._id (teacher) |
| `written_work` | Array[Number] | No | Array of written work scores |
| `performance_tasks` | Array[Number] | No | Array of performance task scores |
| `quarterly_assessment` | Array[Number] | No | Array of quarterly assessment scores |
| `averages` | Object | No | Calculated averages (see below) |
| `verified` | Boolean | No | Grade verification status |
| `verified_by` | ObjectId | Yes | Reference to users._id (teacher/admin) |
| `verified_at` | Date | Yes | Verification timestamp |
| `submitted_to_adviser` | Boolean | No | Adviser submission flag |
| `submitted_by` | ObjectId | Yes | Reference to users._id (teacher) |
| `submitted_at` | Date | Yes | Submission timestamp |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |
| `updated_by` | String | No | Last updater identifier |

**Averages Object Structure:**
```json
{
  "written_work": Number,
  "performance_tasks": Number,
  "quarterly_assessment": Number,
  "final_grade": Number
}
```

**Relationships:**
- `student_id` → `users._id`
- `subject_id` → `subjects._id`
- `section_id` → `sections._id`
- `teacher_id` → `users._id`

**Business Rules:**
- Grades follow DepEd grading weights:
  - Written Work: 30%
  - Performance Tasks: 50%
  - Quarterly Assessment: 20%
- Grade scale: 90-100 (Outstanding), 85-89 (Very Satisfactory), 80-84 (Satisfactory), 75-79 (Fairly Satisfactory), Below 75 (Did Not Meet Expectations)
- Verified grades cannot be modified without admin approval
- One grade record per student-subject-quarter combination

---

### 7. grade_configurations
**Purpose**: Defines grading criteria and items for each subject-section-quarter

**SS1 Focus**: Teacher-managed grade item configuration

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique configuration ID |
| `section_id` | ObjectId | Yes | Reference to sections._id |
| `subject_id` | ObjectId | Yes | Reference to subjects._id |
| `grading_period_id` | Number | No | Quarter/grading period identifier |
| `teacher_id` | ObjectId | Yes | Reference to users._id (teacher) |
| `grade_items` | Object | Yes | Grade items configuration (see below) |
| `status` | String | No | Configuration status |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Grade Items Object Structure:**
```json
{
  "writtenWork": [
    {
      "id": "string",
      "name": "string",
      "totalScore": "number"
    }
  ],
  "performanceTasks": [...],
  "quarterlyAssessment": [...]
}
```

**Relationships:**
- `section_id` → `sections._id`
- `subject_id` → `subjects._id`
- `teacher_id` → `users._id`

**Business Rules:**
- Each grade item has a unique ID within the configuration
- Total scores must be positive numbers
- Configuration is specific to section-subject-quarter combination

---

## Supporting Collections

### 8. document_requests
**Purpose**: Manages student requests for official documents

**SS1 Focus**: Student document request submission and tracking

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique request ID |
| `student_id` | String | No | Student identifier |
| `account_number` | String | No | Student account number |
| `full_name` | String | No | Student full name |
| `grade_level` | String | No | Current grade level |
| `section` | String | No | Current section name |
| `birthdate` | Date | No | Student birthdate |
| `document_type` | String | No | Document type (e.g., "Form 137", "Good Moral") |
| `quantity` | Number | No | Number of copies requested |
| `request_id` | String | No | Unique request identifier |
| `submitted_date` | Date | No | Submission timestamp |
| `payment_amount` | Number | No | Payment amount in PHP |
| `payment_status` | String | No | Payment status: `paid`, `unpaid`, `free` |
| `is_first_time` | Boolean | No | First document request flag (free) |
| `status` | String | No | Request status: `pending`, `processing`, `ready`, `completed`, `rejected` |
| `tentative_date` | Date | Yes | Expected completion date |
| `is_urgent` | Boolean | No | Urgent request flag |
| `purpose` | String | No | Purpose of document request |
| `processed_by` | String | Yes | Admin name who processed |
| `processed_by_id` | String | Yes | Admin user ID |
| `messages` | Array[Object] | Yes | Communication thread (see below) |
| `status_history` | Array[Object] | Yes | Status change log (see below) |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |
| `last_read_at` | Date | Yes | Last read timestamp |
| `compliance_deadline` | Date | Yes | Compliance deadline |

**Messages Object Structure:**
```json
{
  "id": "string",
  "author": "string",
  "authorId": "string",
  "authorRole": "string",
  "text": "string",
  "attachments": [...],
  "created_at": "Date",
  "isAutomated": "boolean"
}
```

**Business Rules:**
- First document request is free (is_first_time = true)
- Rejected documents count as "first time" for next request
- Payment required for subsequent requests
- Status transitions: pending → processing → ready → completed

---

### 9. notifications
**Purpose**: User notifications for system events

**SS1 Focus**: Student notifications for grades, schedules, and document requests

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique notification ID |
| `student_id` | String | No | Student identifier |
| `title` | String | No | Notification title |
| `message` | String | No | Notification message |
| `type` | String | No | Type: `grades`, `schedule`, `documents`, `todo` |
| `priority` | String | No | Priority: `low`, `medium`, `high` |
| `is_read` | Boolean | No | Read status flag |
| `related_id` | String | Yes | Related entity ID (e.g., document_request_id) |
| `document_type` | String | Yes | Document type (if type = documents) |
| `status` | String | Yes | Related entity status |
| `admin_name` | String | Yes | Admin who triggered notification |
| `admin_id` | String | Yes | Admin user ID |
| `admin_note` | String | Yes | Admin's note |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |
| `created_by` | String | Yes | Creator identifier |

**Business Rules:**
- New notifications default to is_read = false
- Notifications filtered by type for student view
- Priority determines display order

---

### 10. student_todos
**Purpose**: Student task and assignment management

**SS1 Focus**: Student productivity and task tracking

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique todo ID |
| `student_id` | String | No | Student identifier |
| `title` | String | No | Task title |
| `description` | String | No | Task description |
| `category` | String | No | Category: `assignment`, `study`, `project`, `exam`, `other` |
| `due_date` | Date | No | Due date |
| `completed` | Boolean | No | Completion flag |
| `completed_at` | Date | Yes | Completion timestamp |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Business Rules:**
- Todos are personal to each student
- Overdue tasks highlighted in UI
- Categories help organize tasks

---

## Analytics & Caching Collections

### 11. ai_grade_analysis_cache
**Purpose**: Caches AI-powered grade analysis results

**SS1 Focus**: Student performance insights (7-day TTL)

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique cache entry ID |
| `student_id` | ObjectId | No | Reference to users._id |
| `school_year` | String | No | Academic year |
| `quarter` | Number | No | Quarter number |
| `analysis` | Object | No | AI analysis results (see below) |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Analysis Object Structure:**
```json
{
  "overallInsight": "string",
  "performanceLevel": "string",
  "quarterComparison": {
    "overallTrend": "string",
    "changeAmount": "number",
    "insight": "string",
    "notableChanges": [...]
  },
  "strengths": [...],
  "areasForGrowth": [...],
  "assessmentInsights": {
    "writtenWork": {...},
    "performanceTasks": {...},
    "quarterlyAssessment": {...}
  },
  "actionPlan": [...],
  "studyRecommendations": {...}
}
```

**Business Rules:**
- Cache expires after 7 days
- OpenRouter API used for analysis generation
- One cache entry per student-quarter-year

---

### 12. activity_logs
**Purpose**: System-wide activity logging for auditing

**SS1 Focus**: Student activity tracking

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique log entry ID |
| `activity_type` | String | No | Activity type code |
| `user_id` | ObjectId | No | Reference to users._id |
| `user_account_number` | String | No | User account number |
| `activity_data` | Object | No | Activity-specific data |
| `ip_address` | String | Yes | Request IP address |
| `user_agent` | String | No | Browser user agent |
| `created_at` | Date | No | Activity timestamp |

**Business Rules:**
- All significant user actions are logged
- Logs are immutable (no updates/deletes)
- Used for security auditing and analytics

---

## Administrative Collections

### 13. admin_settings
**Purpose**: System-wide configuration settings

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique setting ID |
| `setting_key` | String | No | Setting identifier |
| `setting_value` | String | No | Setting value |
| `setting_type` | String | No | Value type |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Common Settings:**
- `current_school_year`: Active academic year
- `current_quarter`: Active grading period (1-4)
- `grading_deadline`: Grade submission deadline

---

### 14. departments
**Purpose**: Academic department organization

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique department ID |
| `name` | String | No | Department name |
| `code` | String | No | Department code |
| `status` | String | No | Department status |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

**Examples:**
- Science Department (SCI)
- Mathematics Department (MATH)
- Filipino Department (FIL)

---

### 15. teacher_departments
**Purpose**: Links teachers to their departments

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique association ID |
| `teacher_id` | ObjectId | No | Reference to users._id (teacher) |
| `department_id` | ObjectId | No | Reference to departments._id |

**Relationships:**
- `teacher_id` → `users._id`
- `department_id` → `departments._id`

---

### 16. rooms
**Purpose**: Classroom and facility management

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique room ID |
| `name` | String | No | Room name/number |
| `building` | String | No | Building name |
| `floor` | String | No | Floor level |
| `status` | String | No | Room status |
| `assigned_to` | String | Yes | Assignment info |
| `created_at` | Date | No | Creation timestamp |
| `updated_at` | Date | No | Last update timestamp |

---

### 17. activity_types
**Purpose**: Non-subject schedule items (e.g., lunch, breaks)

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique activity type ID |
| `name` | String | No | Activity name (e.g., "Lunch Break") |
| `code` | String | No | Activity code |
| `color` | String | No | Display color |
| `icon` | String | No | Display icon |

---

### 18. pushSubscriptions
**Purpose**: PWA push notification subscriptions

| Field Name | Data Type | Nullable | Description |
|------------|-----------|----------|-------------|
| `_id` | ObjectId | No | Unique subscription ID |
| `userId` | String | Yes | User identifier |
| `subscription` | Object | No | Push subscription data |
| `userAgent` | String | No | Device user agent |
| `createdAt` | Date | No | Subscription timestamp |

---

## Data Type Reference

| Type | MongoDB Type | Examples |
|------|--------------|----------|
| String | String | "John Doe", "2023-2024" |
| Number | Number (Double/Int32) | 7, 95.5, 1 |
| Date | Date | ISO 8601 DateTime |
| Boolean | Boolean | true, false |
| ObjectId | ObjectId | MongoDB 12-byte identifier |
| Array | Array | [1, 2, 3] |
| Object | Document | Nested JSON structure |

---

## Index Strategy (Recommendations)

For optimal SS1 performance, the following indexes are recommended:

### users
- `account_number` (unique)
- `email` (unique, sparse)
- `account_type`
- `status`
- `grade_level` (for student queries)

### grades
- `{student_id, quarter, school_year}` (compound)
- `{subject_id, section_id, quarter}` (compound)
- `verified`

### section_students
- `{section_id, status}` (compound)
- `student_id`

### schedules
- `{section_id, day_of_week}` (compound)
- `teacher_id`

### document_requests
- `{student_id, status}` (compound)
- `status`

---

## Validation Rules

### Email Format
- Valid email regex pattern
- Optional field for students

### Account Number
- Unique across all users
- Alphanumeric format

### Grade Values
- Range: 0-100 (decimal allowed)
- Final grades rounded to nearest whole number

### Status Values
**User Status**: `active`, `inactive`, `archived`  
**Request Status**: `pending`, `processing`, `ready`, `completed`, `rejected`  
**Section Status**: `active`, `inactive`

### Date Constraints
- `birthdate`: Must be in the past
- `due_date`: Can be future or past
- `tentative_date`: Must be future date

---

## Document Relationships Diagram

```
users (students)
   ↓
section_students ← sections → schedules → subjects
   ↓                            ↓
grades ←────────────────────────┘
   ↓
ai_grade_analysis_cache

users (students)
   ↓
document_requests → notifications
   ↓
activity_logs
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-30 | Initial SS1 data dictionary |

---

**Note**: This data dictionary focuses on SS1 (Student Information System) collections and relationships. Teacher and Admin-specific collections have been documented with SS1 context in mind.
