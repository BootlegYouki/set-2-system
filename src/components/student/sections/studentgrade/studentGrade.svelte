<script>
  import './studentGrade.css';
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

	// Sample grades data
	let subjects = [
		{
			id: 1,
			name: 'Mathematics',
			teacher: 'Prof. Maria Santos',
			credits: 3,
			grade: 'A+',
			numericGrade: 95,
			progress: 95,
			color: 'var(--success)',
			trend: 'up'
		},
		{
			id: 2,
			name: 'Physics',
			teacher: 'Dr. John Rodriguez',
			credits: 3,
			grade: 'A',
			numericGrade: 88,
			progress: 88,
			color: 'var(--info)',
			trend: 'up'
		},
		{
			id: 3,
			name: 'Chemistry',
			teacher: 'Prof. Ana Dela Cruz',
			credits: 3,
			grade: 'B+',
			numericGrade: 82,
			progress: 82,
			color: 'var(--warning)',
			trend: 'down'
		},
		{
			id: 4,
			name: 'Computer Science',
			teacher: 'Dr. Michael Tan',
			credits: 4,
			grade: 'A+',
			numericGrade: 94,
			progress: 94,
			color: 'var(--school-accent)',
			trend: 'up'
		},
		{
			id: 5,
			name: 'English Literature',
			teacher: 'Prof. Sarah Johnson',
			credits: 2,
			grade: 'B',
			numericGrade: 0,
			progress: 0,
			color: 'var(--school-secondary)',
			trend: 'neutral'
		}
	];

	// Calculate overall average
	let overallAverage;
	$: {
		const totalPoints = subjects.reduce((sum, subject) => {
			return sum + subject.numericGrade;
		}, 0);
		const subjectsWithGrades = subjects.filter(subject => subject.numericGrade > 0).length;
		overallAverage = subjectsWithGrades > 0 ? (totalPoints / subjectsWithGrades).toFixed(2) : '0.00';
	}

	// Get grade color based on numeric value
	function getGradeColor(grade) {
		if (grade >= 90) return 'var(--success)'; // Green
		if (grade >= 80) return 'var(--info)'; // Blue
		if (grade >= 70) return 'var(--warning)'; // Orange
		if (grade >= 60) return 'var(--error)'; // Red
		return 'var(--md-sys-color-on-surface-variant)'; // Gray for no grade
	}

	// Get trend icon
	function getTrendIcon(trend) {
		switch (trend) {
			case 'up': return 'trending_up';
			case 'down': return 'trending_down';
			default: return 'trending_flat';
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
					<div class="average-value">{overallAverage}</div>
					<div class="average-label">Current Average</div>
				</div>
				<div class="subjects-section-card">
					<div class="subjects-value">{totalSubjects}</div>
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
					<div class="subject-header">
						<div class="subject-info">
							<div class="subject-icon" style="background-color: {subject.color}20; color: {subject.color}">
								<span class="material-symbols-outlined">book</span>
							</div>
							<div class="subject-details">
						<h3 class="subject-name">{subject.name}</h3>
						<p class="teacher-name">{subject.teacher}</p>
					</div>
						</div>
						<div class="grade-display">
							{#if subject.numericGrade > 0}
								<div class="grade-badge" style="background-color: {getGradeColor(subject.numericGrade)}">
									{subject.numericGrade}
								</div>
							{:else}
								<div class="no-grade">
									<span class="material-symbols-outlined">remove</span>
									<span class="no-grade-text">No Grade</span>
								</div>
							{/if}
						</div>
					</div>
					{#if subject.numericGrade > 0}
						<div class="progress-section">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {subject.progress}%; background-color: {subject.color}"></div>
							</div>
						</div>
					{/if}
					
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