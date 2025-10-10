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

	// Function to determine grade color based on value using CSS custom properties
	function getGradeColor(grade) {
		if (grade === 0 || grade === null || grade === undefined) return 'var(--grade-no-grade)';
		if (grade >= 85) return 'var(--grade-excellent)';
		if (grade >= 80) return 'var(--grade-good)';
		if (grade >= 75) return 'var(--grade-satisfactory)';
		if (grade >= 65) return 'var(--grade-needs-improvement)';
		return 'var(--grade-needs-improvement)';
	}


	// Function to format grade display
	function formatGrade(grade, hasTeacher, hasGrade, verified) {
		if (!hasTeacher) return 'N/A';
		if (!hasGrade || !verified) return 'N/A';
		return grade > 0 ? grade.toFixed(1) : 'N/A';
	}

	// Function to get progress bar width
	function getProgressWidth(grade, hasTeacher, hasGrade, verified) {
		if (!hasTeacher || !hasGrade || !verified || grade === 0) return 0;
		return Math.min((grade / 100) * 100, 100);
	}

	// Generate randomized card color based on subject index/slot
	function getCardColor(index) {
		const colors = ['blue', 'green', 'purple', 'yellow', 'orange'];
		return colors[index % colors.length];
	}

	// Get card color classes for styling
	function getCardColorClasses(index) {
		const color = getCardColor(index);
		return {
			border: `var(--subject-card-${color}-border)`,
			text: `var(--subject-card-${color}-text)`,
			icon: `var(--subject-card-${color}-icon)`
		};
	}

	// Get grade performance indicator text
	function getGradeIndicator(grade) {
		if (grade >= 85) return 'Excellent';
		if (grade >= 80) return 'Good';
		if (grade >= 75) return 'Satisfactory';
		if (grade >= 65) return 'Needs Improvement';
		return 'No Grade';
	}

	// Get grade performance color class
	function getGradeColorClass(grade) {
		if (grade === null || grade === undefined || grade === 0) return 'grade-no-grade';
		if (grade >= 85) return 'grade-excellent';
		if (grade >= 80) return 'grade-good';
		if (grade >= 75) return 'grade-satisfactory';
		if (grade >= 65) return 'grade-needs-improvement';
		return 'grade-needs-improvement'; // For grades below 65 (like 38)
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

	// Fetch grades from MongoDB API
	async function fetchGrades() {
		try {
			loading = true;
			error = null;

			const quarter = quarterToGradingPeriod[currentQuarter];
			const response = await api.get(`/api/student-grades?student_id=${$authStore.userData.id}&quarter=${quarter}&school_year=2024-2025`);
			
			if (response.success) {
				const { grades, statistics } = response.data;
				
				// Update subjects with the new API response structure
				subjects = grades;
				
				// Update statistics - fix the property name mismatch
				overallAverage = statistics.overallAverage || 0;
				totalSubjects = statistics.totalSubjects || 0;
				
				// Set student data from auth store
				studentData = {
					name: $authStore.userData.full_name || 'Student',
					id: $authStore.userData.id
				};
			} else {
				error = response.error || 'Failed to fetch grades';
			}
		} catch (err) {
			console.error('Error fetching grades:', err);
			error = 'Unable to load grades. Please try again.';
		} finally {
			loading = false;
		}
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
					{#each subjects as subject, index (subject.subject_id || subject.id)}
						{@const cardColors = getCardColorClasses(index)}
						<div class="subject-card" style="border-left: 4px solid {cardColors.border};">
							<!-- Column 1: Icon -->
							<div class="subject-icon-column">
								<div class="subject-icon" style="color: {cardColors.icon};">
									<span class="material-symbols-outlined">book</span>
								</div>
							</div>
							
							<!-- Column 2: Subject Details -->
							<div class="subject-details-column">
								<h3 class="subject-name" style="color: {cardColors.text};">{subject.name}</h3>
								<p class="teacher-name" class:no-teacher={subject.teacher === "No teacher assigned yet"}>{subject.teacher}</p>
								<div class="progress-bar">
									{#if getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher assigned yet", subject.numericGrade > 0, subject.verified) > 0}
										<div class="progress-fill" style="width: {getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher assigned yet", subject.numericGrade > 0, subject.verified)}%; background-color: {cardColors.border}"></div>
									{/if}
								</div>
							</div>
							
							<!-- Column 3: Grade Display -->
							<div class="grade-column">
								<div class="grade-large" style="color: {getGradeColor(subject.numericGrade)}">
									{#if subject.numericGrade > 0 && subject.teacher !== "No teacher assigned yet" && subject.verified}
										<CountUp value={subject.numericGrade} decimals={1} duration={2.5} />
									{:else}
										{formatGrade(subject.numericGrade, subject.teacher !== "No teacher assigned yet", subject.numericGrade > 0, subject.verified)}
									{/if}
									{#if subject.numericGrade > 0 && !subject.verified}
										<span class="unverified-indicator" title="Grade not yet verified">*</span>
									{/if}
								</div>
								<div class="grade-indicator {getGradeIndicator(subject.numericGrade).color}">
									{getGradeIndicator(subject.numericGrade).text}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>