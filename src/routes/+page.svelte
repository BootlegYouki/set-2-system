<script>
  import { authStore } from '../components/login/js/auth.js';
  import Login from '../components/login/loginpage.svelte';
  import StudentNavbar from '../components/users/student/navigations/studentNavbar/studentNavbar.svelte';
  import StudentDocument from '../components/users/student/sections/studentDocumentRequest/studentDocumentRequest.svelte';
  import Notification from '../components/users/student/sections/studentNotification/studentNotification.svelte';
  import AdminNavbar from '../components/users/admin/navigations/adminNavbar/adminNavbar.svelte';
  import AdminDocumentRequests from '../components/users/admin/sections/adminDocumentRequests/adminDocumentRequests.svelte';
  import '../lib/styles/+page.css';

  // Subscribe to auth store using Svelte 5 runes
  let authState = $state();
  
  // Subscribe to auth store changes
  $effect(() => {
    const unsubscribe = authStore.subscribe(value => {
      authState = value;
    });
    return unsubscribe;
  });

  // Current active section for student portal
  let activeSection = $state('documents');
  
  // Request ID to open in document modal (when navigating from notification)
  let documentRequestIdToOpen = $state(null);
  
  // Current active section for admin portal
  let adminActiveSection = $state('document-requests');

  // Navigation rail visibility state (false = collapsed/icons only, true = expanded/with labels)
  let isNavRailVisible = $state(false);
  
  // Admin navigation rail visibility state
  let adminNavRailVisible = $state(false);

  // Handle navigation from student menu
  function handleNavigation(event) {
    // Handle both event objects (from menu) and direct strings (from navbar)
    if (typeof event === 'string') {
      activeSection = event;
      documentRequestIdToOpen = null; // Clear any pending request ID
    } else {
      activeSection = event.detail.section;
      
      // If navigating to documents with a requestId, store it
      if (event.detail.requestId) {
        documentRequestIdToOpen = event.detail.requestId;
      } else {
        documentRequestIdToOpen = null;
      }
    }
  }
  
  // Handle navigation from admin menu
  function handleAdminNavigation(event) {
    adminActiveSection = event.detail.section;
  }
  
  // Handle navigation to settings from admin navbar
  function handleAdminNavigateToSettings() {
    adminActiveSection = 'settings';
  }

  // Handle navigation rail toggle
  function handleToggleNavRail() {
    isNavRailVisible = !isNavRailVisible;
  }
  
  // Handle admin navigation rail toggle
  function handleAdminToggleNavRail() {
    adminNavRailVisible = !adminNavRailVisible;
  }

  // Handle logout
  async function handleLogout() {
    await authStore.logout();
    activeSection = 'documents'; // Reset to default section
    adminActiveSection = 'document-requests'; // Reset admin section
  }

  // Reactive title based on auth state
  let pageTitle = $derived(
    !authState?.isAuthenticated
      ? 'Login - High School Student Information System'
      : authState.userType === 'student'
      ? 'Student Portal - High School'
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
        firstName={authState.userData?.firstName || 'Student'}
        gender={authState.userData?.gender || 'male'}
        accountNumber={authState.userData?.accountNumber || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
        onToggleNavRail={handleToggleNavRail}
        onnavigate={handleNavigation}
      />
      
      <main class="content-area">
        {#if activeSection === 'documents'}
          <StudentDocument openRequestId={documentRequestIdToOpen} />
        {:else if activeSection === 'notifications'}
          <Notification onnavigate={handleNavigation} />
        {/if}
      </main>
    </div>
  {:else if authState.userType === 'admin'}
    <!-- Admin Portal -->
    <div class="admin-portal" class:nav-rail-collapsed={!adminNavRailVisible}>
      <AdminNavbar 
        adminName={authState.userData?.name || 'Admin'}
        firstName={authState.userData?.firstName || 'Admin'}
        gender={authState.userData?.gender || 'male'}
        accountNumber={authState.userData?.accountNumber || 'N/A'}
        profileImage={authState.userData?.profileImage}
        onlogout={handleLogout}
        onToggleNavRail={handleAdminToggleNavRail}
        onNavigateToSettings={handleAdminNavigateToSettings}
      />
      
      <main class="content-area">
        <AdminDocumentRequests />
      </main>
    </div>
  {/if}
</div>
