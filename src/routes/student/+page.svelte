<script>
	import StudentNavbar from '../../components/student/studentNavbar.svelte';
	import StudentMenu from '../../components/student/studentMenu.svelte';
	import StudentGrade from '../../components/student/sections/studentgrade/studentGrade.svelte';
	import StudentSchedule from '../../components/student/sections/studentSchedule/studentSchedule.svelte';
	import StudentDocument from '../../components/student/sections/studentDocument.svelte';

	// Current active section
	let activeSection = $state('grades');

	// Sample student data
	let studentData = {
		name: 'Maria Santos',
		id: '2024-001234',
		profileImage: null
	};

	// Handle navigation from bottom menu
	function handleNavigation(event) {
		activeSection = event.detail.section;
	}
</script>

<svelte:head>
	<title>Student Portal - QCU</title>
	<meta name="description" content="QCU Student Portal - View grades, schedule, and documents" />
</svelte:head>

<div class="student-portal">
	<!-- Top Navigation -->
	<StudentNavbar 
		studentName={studentData.name}
		studentId={studentData.id}
		profileImage={studentData.profileImage}
	/>
	<!-- Main Content Area -->
	<main class="content-area">
		{#if activeSection === 'grades'}
			<StudentGrade />
		{:else if activeSection === 'schedule'}
			<StudentSchedule />
		{:else if activeSection === 'documents'}
			<StudentDocument />
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<StudentMenu {activeSection} onnavigate={handleNavigation} />
</div>

<style>
	.student-portal {
		height: 100vh;
		height: 100dvh; /* Use dynamic viewport height for mobile */
		background-color: var(--md-sys-color-surface);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.content-area {
		background-color: var(--md-sys-color-surface);
		flex: 1;
		overflow-y: auto;
		padding: 4rem 0;
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
	}
</style>