<script>
  import { authStore } from '../components/login/js/auth.js';
  import Login from '../components/login/loginpage.svelte';
  import StudentNavbar from '../components/users/student/navigations/studentNavbar/studentNavbar.svelte';
  import StudentMenu from '../components/users/student/navigations/studentMenu/studentMenu.svelte';
  import StudentGrade from '../components/users/student/sections/studentGrade/studentGrade.svelte';
  import StudentSchedule from '../components/users/student/sections/studentSchedule/studentSchedule.svelte';
  import StudentDocument from '../components/users/student/sections/studentDocumentRequest/studentDocumentRequest.svelte';
  import Notification from '../components/users/student/sections/studentNotification/notification.svelte';
  import TodoList from '../components/users/student/sections/studentTodolist/todolist.svelte';
  import TeacherNavbar from '../components/users/teacher/navigations/teacherNavbar/teacherNavbar.svelte';
  import TeacherMenu from '../components/users/teacher/navigations/teacherMenu/teacherMenu.svelte';
  import TeacherSchedule from '../components/users/teacher/sections/teacherSchedule/teacherSchedule.svelte';
  import TeacherStudentList from '../components/users/teacher/sections/teacherClassManagement/teacherClassManagement.svelte';
  import TeacherAdvisoryClass from '../components/users/teacher/sections/teacherAdvisoryClass/teacherAdvisoryClass.svelte';
  import AdminNavbar from '../components/users/admin/navigations/adminNavbar/adminNavbar.svelte';
  import AdminMenu from '../components/users/admin/navigations/adminMenu/adminMenu.svelte';
  import AdminDashboard from '../components/users/admin/sections/adminDashboard/adminDashboard.svelte';
  import AdminAccountCreation from '../components/users/admin/sections/adminAccountCreation/adminAccountCreation.svelte';
  import AdminRoomManagement from '../components/users/admin/sections/adminRoomManagement/adminRoomManagement.svelte';
  import AdminSectionManagement from '../components/users/admin/sections/adminSectionCreation/adminSectionManagement.svelte';
  import AdminScheduleAssignment from '../components/users/admin/sections/adminScheduleAssignment/adminScheduleAssignment.svelte';
  import AdminSubjectCreation from '../components/users/admin/sections/adminSubjectCreation/adminSubjectCreation.svelte';
  import AdminDocumentRequests from '../components/users/admin/sections/adminDocumentRequests/adminDocumentRequests.svelte';
  import '../lib/styles/+page.css';

  // Subscribe to auth store
  let authState = $state();
  authStore.subscribe(state => {
    authState = state;
  });

  // Current active section for student portal
  let activeSection = $state('grades');
  
  // Current active section for teacher portal
  let teacherActiveSection = $state('schedule');
  
  // Current active section for admin portal
  let adminActiveSection = $state('dashboard');

  // Navigation rail visibility state (false = collapsed/icons only, true = expanded/with labels)
  let isNavRailVisible = $state(false);
  
  // Teacher navigation rail visibility state
  let teacherNavRailVisible = $state(false);
  
  // Admin navigation rail visibility state
  let adminNavRailVisible = $state(false);

  // Handle navigation from student menu
  function handleNavigation(event) {
    activeSection = event.detail.section;
  }
  
  // Handle navigation from teacher menu
  function handleTeacherNavigation(event) {
    teacherActiveSection = event.detail.section;
  }
  
  // Handle navigation from admin menu
  function handleAdminNavigation(event) {
    adminActiveSection = event.detail.section;
  }

  // Handle navigation rail toggle
  function handleToggleNavRail() {
    isNavRailVisible = !isNavRailVisible;
  }
  
  // Handle teacher navigation rail toggle
  function handleTeacherToggleNavRail() {
    teacherNavRailVisible = !teacherNavRailVisible;
  }
  
  // Handle admin navigation rail toggle
  function handleAdminToggleNavRail() {
    adminNavRailVisible = !adminNavRailVisible;
  }

  // Handle logout
  function handleLogout() {
    authStore.logout();
    activeSection = 'grades'; // Reset to default section
    teacherActiveSection = 'schedule'; // Reset teacher section
    adminActiveSection = 'dashboard'; // Reset admin section
  }

  // Reactive title based on auth state
  let pageTitle = $derived(
    !authState?.isAuthenticated
      ? 'Login - High School Student Information System'
      : authState.userType === 'student'
      ? 'Student Portal - High School'
      : authState.userType === 'teacher'
      ? 'Teacher Portal - High School'
      : authState.userType === 'admin'
        ? 'Admin Portal - High School'
      : 'High School Student Information System'
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content="High School Student Information System" />
</svelte:head>

<div class="app-container">
  {#if !authState?.isAuthenticated}
    <!-- Login Page -->
    <Login />
  {:else if authState.userType === 'student'}
    <!-- Student Portal -->
    <div class="student-portal" class:nav-rail-collapsed={!isNavRailVisible}>
      <StudentNavbar 
        studentName={authState.userData?.name || 'Student'}
        studentId={authState.userData?.id || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
        onToggleNavRail={handleToggleNavRail}
      />
      
      <main class="content-area">
        {#if activeSection === 'grades'}
          <StudentGrade />
        {:else if activeSection === 'schedule'}
          <StudentSchedule />
        {:else if activeSection === 'documents'}
          <StudentDocument />
        {:else if activeSection === 'notifications'}
          <Notification />
        {:else if activeSection === 'todo'}
          <TodoList />
        {/if}
      </main>

      <StudentMenu {activeSection} {isNavRailVisible} onnavigate={handleNavigation} />
    </div>
  {:else if authState.userType === 'teacher'}
    <!-- Teacher Portal -->
    <div class="teacher-portal" class:nav-rail-collapsed={!teacherNavRailVisible}>
      <TeacherNavbar 
        teacherName={authState.userData?.name || 'Teacher'}
        teacherId={authState.userData?.id || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
        onToggleNavRail={handleTeacherToggleNavRail}
      />
      
      <main class="content-area">
        {#if teacherActiveSection === 'schedule'}
          <TeacherSchedule />
        {:else if teacherActiveSection === 'students'}
          <TeacherStudentList />
        {:else if teacherActiveSection === 'advisory'}
          <TeacherAdvisoryClass />
        {/if}
      </main>

      <TeacherMenu {teacherActiveSection} {teacherNavRailVisible} onnavigate={handleTeacherNavigation} />
    </div>
  {:else if authState.userType === 'admin'}
    <!-- Admin Portal -->
    <div class="admin-portal" class:nav-rail-collapsed={!adminNavRailVisible}>
      <AdminNavbar 
        adminName={authState.userData?.name || 'Admin'}
        adminId={authState.userData?.id || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
        onToggleNavRail={handleAdminToggleNavRail}
      />
      
      <main class="content-area">
        {#if adminActiveSection === 'dashboard'}
          <AdminDashboard />
        {:else if adminActiveSection === 'account-creation'}
          <AdminAccountCreation />
        {:else if adminActiveSection === 'room-management'}
          <AdminRoomManagement />
        {:else if adminActiveSection === 'section-management'}
          <AdminSectionManagement />
        {:else if adminActiveSection === 'schedule-assignment'}
          <AdminScheduleAssignment />
        {:else if adminActiveSection === 'subject-creation'}
          <AdminSubjectCreation />
        {:else if adminActiveSection === 'document-requests'}
          <AdminDocumentRequests />
        {/if}
      </main>

      <AdminMenu {adminActiveSection} {adminNavRailVisible} onnavigate={handleAdminNavigation} />
    </div>
  {/if}
</div>
