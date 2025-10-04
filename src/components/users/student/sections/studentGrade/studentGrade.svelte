<script>
  import { onMount } from 'svelte';
  import { authStore } from '../../../../login/js/auth.js';
  import { api } from '../../../../../routes/api/helper/api-helper.js';
  import './studentGrade.css';
	import CountUp from '../../../../common/CountUp.svelte';
	
	// State variables
	let loading = true;
	let error = null;
	let currentQuarter = '1st Quarter';
	let quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
	let isDropdownOpen = false;
	let subjects = [];
	let totalSubjects = 0;
	let overallAverage = 0;
	let studentData = null;

	// Quarter to grading period mapping
	const quarterToGradingPeriod = {
		'1st Quarter': 1,
		'2nd Quarter': 2,
		'3rd Quarter': 3,
		'4th Quarter': 4
	};

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	async function selectQuarter(quarter) {
		currentQuarter = quarter;
		isDropdownOpen = false;
		await fetchGrades();
	}

	function handleClickOutside(event) {
		if (isDropdownOpen && !event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
		}
	}

	// Get grade color based on numeric value - using CSS variables
	function getGradeColor(grade) {
		if (grade >= 85) return 'var(--grade-excellent)';      // 85-100: Excellent
		if (grade >= 80) return 'var(--grade-good)';           // 80-84: Good
		if (grade >= 75) return 'var(--grade-satisfactory)';   // 75-79: Satisfactory
		if (grade >= 65) return 'var(--grade-needs-improvement)'; // 65-74: Needs Improvement
		return 'var(--grade-no-grade)';                        // Below 65 or no grade
	}

	// Fetch grades from API
	async function fetchGrades() {
		try {
			loading = true;
			error = null;

			if (!$authStore.userData?.id) {
				error = 'User not authenticated';
				return;
			}

			const gradingPeriodId = quarterToGradingPeriod[currentQuarter];
			const result = await api.get(`/api/student-grades/verified?student_id=${$authStore.userData.id}&grading_period_id=${gradingPeriodId}`);

			if (result.success) {
				studentData = result.data.student;
				subjects = result.data.subjects.map(subject => ({
					...subject,
					color: getGradeColor(subject.numericGrade)
				}));
				totalSubjects = result.data.totalSubjects;
				overallAverage = result.data.overallAverage;
			} else {
				error = result.error || 'Failed to fetch grades';
			}
		} catch (err) {
			console.error('Error fetching grades:', err);
			error = 'Failed to load grades. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Load data when component mounts
	onMount(() => {
		if ($authStore.userData?.id) {
			fetchGrades();
		} else {
			error = 'Please log in to view your grades';
			loading = false;
		}
	});

	// Update subject colors when subjects change
	$: {
		subjects = subjects.map(subject => ({
			...subject,
			color: getGradeColor(subject.numericGrade)
		}));
	}

</script>

<svelte:window on:click={handleClickOutside} />

<div class="grades-container">
	<!-- Header Section -->
	<div class="grades-header">
		<div class="header-content">
			<h1 class="page-title">My Grades</h1>
			<p class="page-subtitle">Academic Performance Overview</p>
		</div>
		<div class="quarter-selector">
			<div class="custom-dropdown">
				<button class="dropdown-button" on:click={toggleDropdown}>
					<span class="material-symbols-outlined">calendar_today</span>
					<span class="dropdown-text">{currentQuarter}</span>
					<span class="material-symbols-outlined dropdown-arrow" class:rotated={isDropdownOpen}>expand_more</span>
				</button>
				{#if isDropdownOpen}
					<div class="dropdown-menu-quarter">
						{#each quarters as quarter}
							<button class="dropdown-item-quarter" class:active={quarter === currentQuarter} on:click={() => selectQuarter(quarter)}>
								{quarter}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Loading State -->
	{#if error}
		<!-- Error State -->
		<div class="error-container">
			<span class="material-symbols-outlined error-icon">error</span>
			<p>Error: {error}</p>
			<button class="retry-btn" on:click={fetchGrades}>
				<span class="material-symbols-outlined">refresh</span>
				Try Again
			</button>
		</div>
	{:else}
		<!-- Overall Performance Card -->
		<div class="performance-card">
			<h2 class="performance-title">Overall Performance</h2>
			<div class="performance-content">
				<div class="performance-main">
					<div class="average-section">
						<div class="average-value" style="color: {getGradeColor(overallAverage)}">
							<div>
								<CountUp value={overallAverage} decimals={1} duration={2.5} />
							</div>
						</div>
						<div class="average-label">Current Average</div>
					</div>
					<div class="subjects-section-card">
						<div class="subjects-value">
							<div>
							<CountUp value={totalSubjects} decimals={0} duration={2} />
							</div>
						</div>
						<div class="subjects-label">Total Subjects</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Subjects Grid -->
		<div class="subjects-section">
			<h2 class="section-title">Subject Performance</h2>
			{#if loading}
				<div class="loading-container">
					<div class="system-loader"></div>
					<p>Loading your grades...</p>
				</div>
			{:else if subjects.length === 0}
				<div class="no-subjects">
					<span class="material-symbols-outlined">school</span>
					<p>No subjects found for {currentQuarter}</p>
					<small>Grades will appear here once they are verified by your teachers</small>
				</div>
			{:else}
				<div class="subjects-grid">
					{#each subjects as subject (subject.id)}
						<div class="subject-card">
							<!-- Column 1: Icon -->
							<div class="subject-icon-column">
								<div class="subject-icon" style="background-color: {subject.color}20; color: {subject.color}">
									<span class="material-symbols-outlined">book</span>
								</div>
							</div>
							
							<!-- Column 2: Subject Details -->
							<div class="subject-details-column">
								<h3 class="subject-name">{subject.name}</h3>
								<p class="teacher-name">{subject.teacher}</p>
								{#if subject.verified && subject.numericGrade > 0}
									<div class="progress-bar">
										<div class="progress-fill" style="width: {subject.numericGrade}%; background-color: {subject.color}"></div>
									</div>
								{/if}
							</div>
							
							<!-- Column 3: Grade Display -->
							<div class="grade-column">
								{#if subject.verified && subject.numericGrade > 0}
									<div class="grade-large" style="color: {subject.color}">
										<CountUp value={subject.numericGrade} decimals={1} duration={1.5} />
									</div>
								{:else}
									<div class="no-grade-large" style="color: {subject.color}">
										<span class="material-symbols-outlined">remove</span>
										<span class="no-grade-text">No Grade</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>