<script>
	import { onMount } from 'svelte';
	import { authStore } from '../../../../login/js/auth.js';
	import { studentClassRankingStore } from '../../../../../lib/stores/student/studentClassRankingStore.js';
	import './studentClassRanking.css';
	import CountUp from '../../../../common/CountUp.svelte';
	
	// Local UI state
	let quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
	let isDropdownOpen = false;
	let currentQuarter = '1st Quarter';
	let currentSchoolYear = '2025-2026';
	
	// Quarter to grading period mapping
	const quarterToGradingPeriod = {
		'1st Quarter': 1,
		'2nd Quarter': 2,
		'3rd Quarter': 3,
		'4th Quarter': 4
	};
	
	// Reactive store data
	$: myRank = $studentClassRankingStore.myRank;
	$: totalStudents = $studentClassRankingStore.totalStudents;
	$: myAverage = $studentClassRankingStore.myAverage;
	$: sectionInfo = $studentClassRankingStore.sectionInfo;
	$: rankingsList = $studentClassRankingStore.rankingsList;
	$: loading = $studentClassRankingStore.isLoading || $studentClassRankingStore.isRefreshing;
	$: error = $studentClassRankingStore.error;
	
	// Animation key to trigger stagger animation on data change
	let animationKey = 0;
	$: {
		// Increment key whenever quarter or rankings data changes
		currentQuarter;
		rankingsList;
		animationKey++;
	}
	
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}
	
	async function selectQuarter(quarter) {
		isDropdownOpen = false;
		currentQuarter = quarter;
		await loadRankings();
	}
	
	function handleClickOutside(event) {
		if (isDropdownOpen && !event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
		}
	}
	
	// Get rank medal color
	function getRankColor(rank) {
		if (rank === 1) return 'var(--rank-gold)';
		if (rank === 2) return 'var(--rank-silver)';
		if (rank === 3) return 'var(--rank-bronze)';
		return 'var(--md-sys-color-on-surface)';
	}
	
	// Get rank icon
	function getRankIcon(rank) {
		if (rank <= 3) return 'trophy';
		return 'military_tech';
	}
	
	// Get grade color
	function getGradeColor(grade) {
		if (grade === 0 || grade === null || grade === undefined) return 'var(--grade-no-grade)';
		if (grade >= 85) return 'var(--grade-excellent)';
		if (grade >= 80) return 'var(--grade-good)';
		if (grade >= 75) return 'var(--grade-satisfactory)';
		if (grade >= 65) return 'var(--grade-needs-improvement)';
		return 'var(--grade-needs-improvement)';
	}
	
	// Load rankings data
	async function loadRankings() {
		if (!$authStore.userData?.id) return;
		
		const quarterNum = quarterToGradingPeriod[currentQuarter];
		await studentClassRankingStore.loadRankings(
			$authStore.userData.id,
			quarterNum,
			currentSchoolYear
		);
	}
	
	onMount(async () => {
		await loadRankings();
	});
</script>

<svelte:window on:click={handleClickOutside} />

<div class="rankings-container">
	<!-- Header Section -->
	<div class="rankings-header">
		<div class="header-content">
			<h1 class="page-title">Class Rankings</h1>
			<p class="page-subtitle">Academic Performance Standings</p>
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

	<!-- Error State -->
	{#if error}
		<div class="error-container">
			<span class="material-symbols-outlined error-icon">error</span>
			<p>Error: {error}</p>
			<button class="retry-btn" on:click={loadRankings}>
				<span class="material-symbols-outlined">refresh</span>
				Try Again
			</button>
		</div>
	{:else if loading}
		<!-- Loading State -->
		<div class="loading-container">
			<div class="system-loader"></div>
			<p>Loading rankings...</p>
		</div>
	{:else}
		<!-- Rankings List -->
		<div class="rankings-section">
			{#if rankingsList.length === 0}
				<div class="no-rankings">
					<span class="material-symbols-outlined">leaderboard</span>
					<p>No rankings available for {currentQuarter}</p>
					<small>Rankings will appear here once grades are finalized</small>
				</div>
			{:else}
				{#key animationKey}
					<div class="rankings-list">
						{#each rankingsList as student, index (student.studentId)}
							<div 
								class="ranking-card" 
								class:my-rank={student.studentId === $authStore.userData?.id}
								style="--card-index: {index};">
								<div class="rank-position">
									<span class="material-symbols-outlined rank-icon" style="color: {getRankColor(student.rank)};">
										{getRankIcon(student.rank)}
									</span>
									<span class="rank-number" style="color: {getRankColor(student.rank)};">
										{student.rank}
									</span>
								</div>
								
								<div class="student-info">
									<h3 class="student-name">
										{student.studentId === $authStore.userData?.id ? 'You' : student.name}
									</h3>
									<p class="student-id">ID: {student.studentNumber}</p>
								</div>
								
								<div class="student-average">
									<span class="average-label">Average</span>
									<span class="average-value" style="color: {getGradeColor(student.average)};">
										{student.average.toFixed(1)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{/key}
			{/if}
		</div>
	{/if}
</div>

