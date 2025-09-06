<script>
  import { authStore } from '../lib/stores/auth.js';
  import Login from '../components/login/loginpage.svelte';
  import StudentNavbar from '../components/student/studentNavbar.svelte';
  import StudentMenu from '../components/student/studentMenu.svelte';
  import StudentGrade from '../components/student/sections/studentgrade/studentGrade.svelte';
  import StudentSchedule from '../components/student/sections/studentSchedule/studentSchedule.svelte';
  import StudentDocument from '../components/student/sections/studentDocument.svelte';

  // Subscribe to auth store
  let authState = $state();
  authStore.subscribe(state => {
    authState = state;
  });

  // Current active section for student portal
  let activeSection = $state('grades');

  // Handle navigation from student menu
  function handleNavigation(event) {
    activeSection = event.detail.section;
  }

  // Handle logout
  function handleLogout() {
    authStore.logout();
    activeSection = 'grades'; // Reset to default section
  }

  // Reactive title based on auth state
  let pageTitle = $derived(() => {
    if (!authState?.isAuthenticated) {
      return 'Login - QCU Integrated Registrar System';
    } else if (authState.userType === 'student') {
      return 'Student Portal - QCU';
    } else if (authState.userType === 'teacher') {
      return 'Teacher Portal - QCU';
    } else if (authState.userType === 'registrar') {
      return 'Registrar Portal - QCU';
    }
    return 'QCU Integrated Registrar System';
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content="QCU Integrated Registrar System" />
</svelte:head>

<div class="app-container">
  {#if !authState?.isAuthenticated}
    <!-- Login Page -->
    <Login />
  {:else if authState.userType === 'student'}
    <!-- Student Portal -->
    <div class="student-portal">
      <StudentNavbar 
        studentName={authState.userData?.name || 'Student'}
        studentId={authState.userData?.id || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
      />
      
      <main class="content-area">
        {#if activeSection === 'grades'}
          <StudentGrade />
        {:else if activeSection === 'schedule'}
          <StudentSchedule />
        {:else if activeSection === 'documents'}
          <StudentDocument />
        {/if}
      </main>

      <StudentMenu {activeSection} onnavigate={handleNavigation} />
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

<style>
  .app-container {
    min-height: 100vh;
    width: 100%;
  }

  .student-portal {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .content-area {
    flex: 1;
    padding: 1rem;
    margin-top: 64px; /* Account for fixed navbar height */
    margin-bottom: 64px; /* Account for fixed bottom menu height */
    min-height: calc(100vh - 128px); /* Ensure proper height calculation */
  }

  .teacher-portal,
  .registrar-portal {
    min-height: 100vh;
    padding: 2rem;
  }

  .portal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .portal-header h1 {
    margin: 0;
    color: #1565c0;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .logout-btn:hover {
    background-color: #d32f2f;
  }

  .portal-content {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
  }

  .portal-content p {
    margin: 0.5rem 0;
    color: #666;
  }
</style>