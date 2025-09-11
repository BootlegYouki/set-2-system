# Test Accounts for Login

Use these predefined accounts to test the role-based login system:

## Student Account
- **Email:** `student@school.edu`
- **Password:** `student123`
- **Redirects to:** Student Portal with grades, schedule, documents, notifications, and todo sections

## Teacher Account
- **Email:** `teacher@school.edu`
- **Password:** `teacher123`
- **Redirects to:** Teacher Portal (placeholder interface)

## Admin Account
- **Email:** `admin@school.edu`
- **Password:** `admin123`
- **Redirects to:** Admin Portal (placeholder interface)

## How to Test
1. Open the application at http://localhost:5173
2. Enter one of the email addresses above
3. Enter the corresponding password
4. Click "Sign in"
5. You will be automatically redirected to the appropriate portal based on your account type

## Features
- **Automatic Role Detection:** The system automatically determines your role based on your email address
- **Role-based Routing:** Each account type redirects to its respective portal
- **Personalized Welcome:** Login success messages include the user's name
- **Error Handling:** Invalid credentials show appropriate error messages