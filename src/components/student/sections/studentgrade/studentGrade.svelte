<script>
  import './studentGrade.css';
	import Odometer from '../../../common/Odometer.svelte';
	// Sample data - in real app this would come from props or API
	let currentQuarter = '1st Quarter';
	let quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
	let isDropdownOpen = false;

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function selectQuarter(quarter) {
		currentQuarter = quarter;
		isDropdownOpen = false;
	}

	function handleClickOutside(event) {
		if (isDropdownOpen && !event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
		}
	}
	let totalSubjects = 5;

	// Get grade color based on numeric value - using CSS variables
	function getGradeColor(grade) {
		if (grade >= 90) return 'var(--grade-excellent)';      // 90-100: Excellent
		if (grade >= 80) return 'var(--grade-good)';           // 80-89: Good
		if (grade >= 70) return 'var(--grade-satisfactory)';   // 70-79: Satisfactory
		if (grade >= 60) return 'var(--grade-needs-improvement)'; // 60-69: Needs Improvement
		return 'var(--grade-no-grade)';                        // Below 60 or no grade
	}

	// Sample grades data - Updated to use grade-based colors
	let subjects = [
		{
			id: 1,
			name: 'Mathematics',
			teacher: 'Prof. Maria Santos',
			credits: 3,
			numericGrade: 95,
			progress: 95,
			color: 'var(--grade-excellent)'
		},
		{
			id: 2,
			name: 'Physics',
			teacher: 'Dr. John Rodriguez',
			credits: 3,
			numericGrade: 88,
			progress: 88,
			color: 'var(--grade-good)'
		},
		{
			id: 3,
			name: 'Chemistry',
			teacher: 'Prof. Ana Dela Cruz',
			credits: 3,
			numericGrade: 76,
			progress: 76,
			color: 'var(--grade-satisfactory)'
		},
		{
			id: 4,
			name: 'Computer Science',
			teacher: 'Dr. Michael Tan',
			credits: 4,
			numericGrade: 94,
			progress: 94,
			color: 'var(--grade-excellent)'
		},
		{
			id: 5,
			name: 'English Literature',
			teacher: 'Prof. Sarah Johnson',
			credits: 2,
			numericGrade: 0,
			progress: 0,
			color: 'var(--grade-no-grade)'
		}
	];

	// Update subject colors based on grades reactively
	$: {
		subjects = subjects.map(subject => ({
			...subject,
			color: getGradeColor(subject.numericGrade)
		}));
	}

	// Calculate overall average
	let overallAverage;
	$: {
		// Include all subjects with valid numeric grades (> 0)
		const validSubjects = subjects.filter(subject => 
			subject.numericGrade != null && 
			typeof subject.numericGrade === 'number' && 
			subject.numericGrade > 0
		);
		
		if (validSubjects.length > 0) {
			const totalPoints = validSubjects.reduce((sum, subject) => sum + subject.numericGrade, 0);
			overallAverage = (totalPoints / validSubjects.length).toFixed(2);
		} else {
			overallAverage = '0.00';
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
			<span class="material-symbols-outlined">calendar_today</span>
			<div class="custom-dropdown">
				<button class="dropdown-button" on:click={toggleDropdown}>
					<span class="dropdown-text">{currentQuarter}</span>
					<span class="material-symbols-outlined dropdown-arrow" class:rotated={isDropdownOpen}>expand_more</span>
				</button>
				{#if isDropdownOpen}
					<div class="dropdown-menu">
						{#each quarters as quarter}
							<button class="dropdown-item" class:active={quarter === currentQuarter} on:click={() => selectQuarter(quarter)}>
								{quarter}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Overall Performance Card -->
	<div class="performance-card">
		<h2 class="performance-title">Overall Performance</h2>
		<div class="performance-content">
			<div class="performance-main">
				<div class="average-section">
					<div class="average-value" style="color: {getGradeColor(parseFloat(overallAverage))}">
						<div><Odometer value={parseFloat(overallAverage)} format="d.dd" duration={3000} animation="ease-out" /></div>
					</div>
					<div class="average-label">Current Average</div>
				</div>
				<div class="subjects-section-card">
					<div class="subjects-value">
						{totalSubjects}
					</div>
					<div class="subjects-label">Total Subjects</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Subjects Grid -->
	<div class="subjects-section">
		<h2 class="section-title">Subject Performance</h2>
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
						{#if subject.numericGrade > 0}
							<div class="progress-bar">
								<div class="progress-fill" style="width: {subject.progress}%; background-color: {subject.color}"></div>
							</div>
						{/if}
					</div>
					
					<!-- Column 3: Grade Display -->
					<div class="grade-column">
						{#if subject.numericGrade > 0}
							<div class="grade-large" style="color: {subject.color}">
								<Odometer value={subject.numericGrade} format="d" duration={3000} animation="ease-out" />
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
	</div>
</div>

<style>
	/* Ensure CSS custom properties are inherited from the global theme */
	:global(.grades-container) {
		padding: var(--spacing-lg);
		background-color: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);
		min-height: 100%;
		box-sizing: border-box;
	}
	
	:global(.dropdown-menu) {
		background-color: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		box-shadow: var(--shadow-lg);
	}
	
	:global(.dropdown-item) {
		color: var(--md-sys-color-on-surface);
	}
	
	:global(.dropdown-item:hover) {
		background-color: var(--md-sys-color-surface-variant);
	}
	
	:global(.dropdown-item.active) {
		background-color: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
	}
</style>