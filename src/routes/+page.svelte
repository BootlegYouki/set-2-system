<script>
  import { authStore } from '../components/login/js/auth.js';
  import Login from '../components/login/loginpage.svelte';
  import StudentNavbar from '../components/users/student/navigations/studentNavbar/studentNavbar.svelte';
  import StudentMenu from '../components/users/student/navigations/studentMenu/studentMenu.svelte';
  import StudentGrade from '../components/users/student/sections/studentgrade/studentGrade.svelte';
  import StudentSchedule from '../components/users/student/sections/studentSchedule/studentSchedule.svelte';
  import StudentDocument from '../components/users/student/sections/studentDocumentRequest/studentDocumentRequest.svelte';
  import Notification from '../components/users/student/sections/notification/notification.svelte';
  import TodoList from '../components/users/student/sections/todolist/todolist.svelte';
  import '../lib/styles/+page.css';

  // Subscribe to auth store
  let authState = $state();
  authStore.subscribe(state => {
    authState = state;
  });

  // Current active section for student portal
  let activeSection = $state('grades');

  // Navigation rail visibility state (false = collapsed/icons only, true = expanded/with labels)
  let isNavRailVisible = $state(false);

  // Handle navigation from student menu
  function handleNavigation(event) {
    activeSection = event.detail.section;
  }

  // Handle navigation rail toggle
  function handleToggleNavRail() {
    isNavRailVisible = !isNavRailVisible;
  }

  // Handle logout
  function handleLogout() {
    authStore.logout();
    activeSection = 'grades'; // Reset to default section
  }

  // Reactive title based on auth state
  let pageTitle = $derived(
    !authState?.isAuthenticated
      ? 'Login - High School Student Information System'
      : authState.userType === 'student'
      ? 'Student Portal - High School'
      : authState.userType === 'teacher'
      ? 'Teacher Portal - High School'
      : authState.userType === 'registrar'
      ? 'Registrar Portal - High School'
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
    <!-- Teacher Portal Placeholder -->
    <div class="teacher-portal">
      <div class="portal-header">
        <h1>Teacher Portal</h1>
        <button onclick={handleLogout} class="logout-btn">Logout</button>
      </div>
      <div class="portal-content">
        <p>Teacher portal components will be implemented here.</p>
        <p>Welcome, {authState.userData?.name || 'Teacher'}!</p>
      </div>
    </div>
  {:else if authState.userType === 'registrar'}
    <!-- Registrar Portal Placeholder -->
    <div class="registrar-portal">
      <div class="portal-header">
        <h1>Registrar Portal</h1>
        <button onclick={handleLogout} class="logout-btn">Logout</button>
      </div>
      <div class="portal-content">
        <p>Registrar portal components will be implemented here.</p>
        <p>Welcome, {authState.userData?.name || 'Registrar'}!</p>
      </div>
    </div>
  {/if}
</div>
