<script>
  import { onMount } from 'svelte';
  import { authStore } from '../../../../login/js/auth.js';
  import './studentGrade.css';
	import CountUp from '../../../../common/CountUp.svelte';
	import SubjectPerformanceChart from './studentGradeCharts/SubjectPerformanceChart.svelte';
	import AssessmentTypeChart from './studentGradeCharts/AssessmentTypeChart.svelte';
	import { studentGradeStore } from '../../../../../lib/stores/student/studentGradeStore.js';
	
	// Local UI state
	let quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
	let isDropdownOpen = false;
	let expandedGrades = new Set();
	
	// AI Analysis variables (not in store as they're component-specific)
	let aiAnalysis = '';
	let aiAnalysisLoading = false;
	let aiAnalysisError = null;
	let showAiAnalysis = false;
	let isCachedAnalysis = false;
	
	// Progress bar color animation state
	let progressBarColors = {}; // Store current color for each subject
	let progressBarAnimations = {}; // Store animation frame IDs

	// Reactive store values
	$: grades = $studentGradeStore.grades;
	$: subjects = grades; // Alias for template
	$: statistics = $studentGradeStore.statistics;
	$: overallAverage = statistics.overallAverage;
	$: totalSubjects = statistics.totalSubjects;
	$: sectionInfo = $studentGradeStore.sectionInfo;
	$: classRank = $studentGradeStore.classRank;
	$: totalStudentsInSection = $studentGradeStore.totalStudentsInSection;
	$: currentQuarterNum = $studentGradeStore.currentQuarter;
	$: currentQuarter = $studentGradeStore.currentQuarterName;
	$: currentSchoolYear = $studentGradeStore.currentSchoolYear;
	$: loading = $studentGradeStore.isLoading;
	$: error = $studentGradeStore.error;
	$: previousQuarterAverage = $studentGradeStore.previousQuarterAverage;
	$: averageChange = $studentGradeStore.averageChange;

	// Quarter to grading period mapping
	const quarterToGradingPeriod = {
		'1st Quarter': 1,
		'2nd Quarter': 2,
		'3rd Quarter': 3,
		'4th Quarter': 4
	};
	
	// Watch for grade changes and trigger progress bar animations
	$: if (grades && grades.length > 0) {
		// Initialize progress bar colors with starting color BEFORE animation
		const needsInit = grades.some(subject => 
			subject.numericGrade > 0 && 
			subject.teacher !== "No teacher" && 
			subject.verified && 
			!progressBarColors[subject.id]
		);
		
		if (needsInit) {
			grades.forEach(subject => {
				if (subject.numericGrade > 0 && subject.teacher !== "No teacher" && subject.verified) {
					if (!progressBarColors[subject.id]) {
						progressBarColors[subject.id] = getGradeColor(65); // Start with "needs improvement" color
					}
				}
			});
			progressBarColors = { ...progressBarColors }; // Trigger reactivity
			
			// Start progress bar color animations for each subject
			setTimeout(() => {
				grades.forEach(subject => {
					if (subject.numericGrade > 0 && subject.teacher !== "No teacher" && subject.verified) {
						animateProgressBarColor(subject.id, subject.numericGrade);
					}
				});
			}, 100); // Small delay to ensure DOM is ready
		}
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	async function selectQuarter(quarter) {
		isDropdownOpen = false;
		// Reset AI analysis when quarter changes
		aiAnalysis = '';
		showAiAnalysis = false;
		aiAnalysisError = null;
		isCachedAnalysis = false;
		
		// Cancel and reset progress bar animations
		Object.values(progressBarAnimations).forEach(animationId => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		});
		progressBarAnimations = {};
		progressBarColors = {};
		
		// Use store to change quarter
		const quarterNum = quarterToGradingPeriod[quarter];
		if ($authStore.userData?.id) {
			await studentGradeStore.changeQuarter($authStore.userData.id, quarterNum, currentSchoolYear);
		}
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
		if (grade < 65) return 'var(--grade-needs-improvement)';
		return 'var(--grade-needs-improvement)';
	}

	// Animate progress bar color transition
	function animateProgressBarColor(subjectId, finalGrade, duration = 2500) {
		// Cancel any existing animation for this subject
		if (progressBarAnimations[subjectId]) {
			cancelAnimationFrame(progressBarAnimations[subjectId]);
		}
		
		const startTime = Date.now();
		
		function updateColor() {
			const currentTime = Date.now();
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Determine target tier based on final grade
			let targetTier = 0;
			if (finalGrade >= 85) targetTier = 3;
			else if (finalGrade >= 80) targetTier = 2;
			else if (finalGrade >= 75) targetTier = 1;
			else targetTier = 0;
			
			// Use faster progression (1.6x speed)
			const colorProgress = Math.min(progress * 1.6, 1);
			
			// Calculate current tier based on time progress
			const currentTier = Math.min(Math.floor(colorProgress * (targetTier + 1)), targetTier);
			
			// Map tier to grade value for color
			const tierToGrade = [65, 75, 80, 85];
			const displayGrade = tierToGrade[currentTier];
			
			// Update color
			progressBarColors[subjectId] = getGradeColor(displayGrade);
			progressBarColors = { ...progressBarColors }; // Trigger reactivity
			
			// Continue animation if not complete
			if (progress < 1) {
				progressBarAnimations[subjectId] = requestAnimationFrame(updateColor);
			} else {
				// Ensure final color is set
				progressBarColors[subjectId] = getGradeColor(finalGrade);
				progressBarColors = { ...progressBarColors };
				delete progressBarAnimations[subjectId];
			}
		}
		
		updateColor();
	}

	// Function to format grade display
	function formatGrade(grade, hasTeacher, hasGrade, verified) {
		if (!hasTeacher) return 'N/A';
		if (!hasGrade || !verified) return 'N/A';
		return grade > 0 ? formatGradeDisplay(grade) : 'N/A';
	}

	// Function to format grade display with clean decimals (removes .0 for whole numbers)
	function formatGradeDisplay(grade) {
		if (grade === null || grade === undefined || grade === 0) return 'N/A';
		// Check if the grade is a whole number
		if (grade % 1 === 0) {
			return grade.toString();
		}
		return grade.toFixed(1);
	}

	// Function to get progress bar width
	function getProgressWidth(grade, hasTeacher, hasGrade, verified) {
		if (!hasTeacher || !hasGrade || !verified || grade === 0) return 0;
		return Math.min((grade / 100) * 100, 100);
	}

	// Generate randomized card color based on subject index/slot
	function getCardColor(index) {
		const colors = [
			'blue', 'green', 'purple', 'yellow', 'orange', 
			'red', 'teal', 'indigo', 'pink', 'cyan', 
			'lime', 'amber', 'deeporange'
		];
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

	// Get first quarter message based on current performance
	function getFirstQuarterMessage(average) {
		if (average >= 90) {
			return 'Keep it up!';
		} else if (average >= 85) {
			return 'Maintain the momentum!';
		} else if (average >= 80) {
			return 'Push for higher!';
		} else if (average >= 75) {
			return 'Aim higher next quarter!';
		} else {
			return 'Work harder next quarter!';
		}
	}

	// Get verified grades count
	function getVerifiedGradesCount(gradesList) {
		if (!gradesList || gradesList.length === 0) return { verified: 0, total: 0 };
		const verifiedCount = gradesList.filter(subject => 
			subject.verified && 
			subject.numericGrade > 0 && 
			subject.teacher !== "No teacher"
		).length;
		return { verified: verifiedCount, total: gradesList.length };
	}

	// Reactive calculation for verified grades - explicitly depend on grades and quarter
	$: verifiedGrades = getVerifiedGradesCount(grades);
	
	// Force recalculation when quarter changes
	$: if (currentQuarterNum) {
		verifiedGrades = getVerifiedGradesCount(grades);
	}

	// Grade breakdown accordion functions (similar to todo list)
	function toggleGradeBreakdown(subjectId) {
		if (expandedGrades.has(subjectId)) {
			expandedGrades.delete(subjectId);
		} else {
			expandedGrades.add(subjectId);
		}
		expandedGrades = new Set(expandedGrades); // Trigger reactivity
	}

	function isGradeExpanded(subjectId) {
		return expandedGrades.has(subjectId);
	}

	// Helper functions for breakdown display
	function hasDetailedScores(subject) {
		return subject.verified && (
			(subject.writtenWorkScores && subject.writtenWorkScores.length > 0) ||
			(subject.performanceTasksScores && subject.performanceTasksScores.length > 0) ||
			(subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0)
		);
	}

	// Function to get AI analysis
	async function getAiAnalysis(forceRefresh = false) {
		if (aiAnalysisLoading || !subjects.length || !$authStore.userData?.id) return;
		
		aiAnalysisLoading = true;
		aiAnalysisError = null;
		aiAnalysis = ''; // Reset analysis
		showAiAnalysis = true; // Show the container immediately
		isCachedAnalysis = false;
		
		try {
			const quarter = quarterToGradingPeriod[currentQuarter];
			
			const response = await fetch('/api/ai-grade-analysis', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					studentId: $authStore.userData.id,
					quarter: quarter,
					schoolYear: currentSchoolYear,
					forceRefresh: forceRefresh
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get AI analysis');
			}

			// Check if response is from cache
			const cacheStatus = response.headers.get('X-Cache-Status');
			isCachedAnalysis = cacheStatus === 'HIT';

			aiAnalysisLoading = false; // Stop loading before streaming starts

			// Read the streaming response
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				
				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });
				aiAnalysis += chunk;
				
				// Force Svelte to update the UI
				aiAnalysis = aiAnalysis;
			}
		} catch (error) {
			console.error('AI Analysis Error:', error);
			aiAnalysisError = error.message;
			aiAnalysisLoading = false;
		}
	}

	// Function to refresh AI analysis (bypass cache)
	async function refreshAiAnalysis() {
		await getAiAnalysis(true);
	}

	// Function to toggle AI analysis visibility
	function toggleAiAnalysis() {
		if (!showAiAnalysis && !aiAnalysis) {
			getAiAnalysis();
		} else {
			showAiAnalysis = !showAiAnalysis;
		}
	}

	function formatScoreLabel(index, type) {
		const types = {
			written: 'Quiz',
			performance: 'Project', 
			quarterly: 'Exam'
		};
		return `${types[type] || 'Task'} ${index + 1}`;
	}

	// Load data when component mounts
	onMount(async () => {
		if ($authStore.userData?.id) {
			// Initialize store (will check cache first)
			const hasCachedData = studentGradeStore.init($authStore.userData.id);
			
			// Load fresh data
			await studentGradeStore.loadGrades($authStore.userData.id);
		}
		
		// Cleanup on component destroy
		return () => {
			// Cancel all progress bar animations
			Object.values(progressBarAnimations).forEach(animationId => {
				if (animationId) {
					cancelAnimationFrame(animationId);
				}
			});
		};
	});

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
			<button class="retry-btn" on:click={() => studentGradeStore.loadGrades($authStore.userData.id)}>
				<span class="material-symbols-outlined">refresh</span>
				Try Again
			</button>
		</div>
	{:else}
		<!-- Overall Performance Card -->
		<div class="performance-card">
		<div class="performance-header">
			<div class="performance-title-section">
				<div class="performance-title-content">
					<h2 class="performance-title">Academic Performance</h2>
					{#if sectionInfo}
						<div class="performance-subtitle">Grade {sectionInfo.gradeLevel} • {sectionInfo.name} </div>
					{/if}
				</div>
				<button 
					class="refresh-data-btn" 
					on:click={() => studentGradeStore.forceRefresh($authStore.userData.id, currentQuarterNum, currentSchoolYear)}
					title="Refresh data from database"
					disabled={loading}>
					<span class="material-symbols-outlined">refresh</span>
				</button>
			</div>
		</div>
			
			<div class="performance-stats">
			<div class="grade-stat-item primary">
				<div class="stat-header">
					<div class="stat-label">Quarter Average</div>
					<div class="stat-icon">
						<span class="material-symbols-outlined">star</span>
					</div>
				</div>
			<div class="grade-stat-value">
				{#key `${currentQuarterNum}-${currentSchoolYear}`}
					<CountUp 
						value={overallAverage} 
						decimals={1} 
						duration={2.5} 
						colorTransition={true}
						getGradeColor={getGradeColor} />
				{/key}
			</div>
			{#key `${currentQuarterNum}-${currentSchoolYear}`}
				{#if averageChange !== null}
					<div class="grade-comparison" class:positive={averageChange > 0} class:negative={averageChange < 0} class:neutral={averageChange === 0}>
						<span class="material-symbols-outlined comparison-icon">
							{#if averageChange > 0}
								trending_up
							{:else if averageChange < 0}
								trending_down
							{:else}
								trending_flat
							{/if}
						</span>
						<span class="comparison-text">
							{#if averageChange > 0}
								+{averageChange.toFixed(1)}
							{:else if averageChange < 0}
								{averageChange.toFixed(1)}
							{:else}
								No change
							{/if}
							from last quarter
						</span>
					</div>
				{:else if currentQuarterNum === 1 && overallAverage > 0}
					<div class="grade-comparison first-quarter">
						<span class="material-symbols-outlined comparison-icon">
							rocket_launch
						</span>
						<span class="comparison-text">
							{getFirstQuarterMessage(overallAverage)}
						</span>
					</div>
				{/if}
			{/key}
		</div>
			
			<div class="grade-stat-item secondary">
				<div class="stat-header">
					<div class="stat-label">Total Subjects</div>
					<div class="stat-icon">
						<span class="material-symbols-outlined">school</span>
					</div>
				</div>
			<div class="grade-stat-value">
				{#key `${currentQuarterNum}-${currentSchoolYear}`}
					<CountUp value={totalSubjects} decimals={0} duration={2} />
				{/key}
			</div>
			<div class="grade-info-badge">
				<span class="material-symbols-outlined badge-icon">
					verified
				</span>
				{#key `${currentQuarterNum}-${currentSchoolYear}`}
					<span class="badge-text">
						{verifiedGrades.verified}/{verifiedGrades.total} Verified Grades
					</span>
				{/key}
			</div>
			</div>

			<div class="grade-stat-item tertiary">
				<div class="stat-header">
					<div class="stat-label">Class Rank</div>
					<div class="stat-icon">
						<span class="material-symbols-outlined">crown</span>
					</div>
				</div>
			<div class="grade-stat-value">
				Rank {#key `${currentQuarterNum}-${currentSchoolYear}`}<CountUp value={classRank} decimals={0} duration={2} />{/key}
			</div>
			<div class="grade-info-badge">
				<span class="material-symbols-outlined badge-icon">
					groups
				</span>
				{#key `${currentQuarterNum}-${currentSchoolYear}`}
					<span class="badge-text">
						Out of {totalStudentsInSection} Students
					</span>
				{/key}
			</div>
			</div>
			</div>

			<!-- AI Analysis Container -->

		</div>
			<div class="ai-analysis-container">
				<div class="analysis-header">
					<div class="analysis-title-group">
						<h3 class="analysis-title">AI Performance Analysis</h3>
					</div>
					<div class="analysis-controls">
						{#if aiAnalysis && !aiAnalysisLoading}
							<button 
								class="refresh-analysis-btn" 
								on:click={refreshAiAnalysis}
								title="Refresh analysis">
								<span class="material-symbols-outlined">refresh</span>
							</button>
						{/if}
						<button 
							class="ai-analysis-toggle-btn" 
							on:click={toggleAiAnalysis}
							title={showAiAnalysis ? 'Hide AI Analysis' : 'Get AI Analysis'}>
							{#if showAiAnalysis}
								<span class="material-symbols-outlined">expand_less</span>
							{:else}
								<span class="material-symbols-outlined">expand_more</span>
							{/if}
						</button>
					</div>
				</div>
				
				{#if showAiAnalysis}
					<div class="analysis-content">
						{#if aiAnalysisError}
							<div class="analysis-error">
								<span class="material-symbols-outlined">error</span>
								<p>Failed to generate AI analysis: {aiAnalysisError}</p>
								<button class="retry-analysis-btn" on:click={() => getAiAnalysis()}>
									Try Again
								</button>
							</div>
						{:else if aiAnalysis}
							<div class="analysis-text">
								{@html aiAnalysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
							</div>
						{:else}
							<div class="analysis-placeholder">
								<div class="system-loader"></div>
								Loading Analysis...
							</div>
						{/if}
					</div>
				{/if}
			</div>

		<!-- Grade Analysis Charts - Only shown when AI analysis is available -->
		{#if aiAnalysis && !aiAnalysisError}
			<div class="charts-section">
				<h2 class="section-title">Performance Analytics</h2>
				<div class="charts-grid">
					<div class="chart-wrapper">
						<SubjectPerformanceChart {subjects} />
					</div>
					<div class="chart-wrapper">
						<AssessmentTypeChart {subjects} />
					</div>
				</div>
			</div>
		{/if}

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
						{@const hasBreakdown = hasDetailedScores(subject)}
						{@const isExpanded = isGradeExpanded(subject.id)}
						
						<div class="subject-accordion">
							<!-- Main Subject Card (clickable if has breakdown) -->
							<div 
								class="subject-card" 
								class:clickable={hasBreakdown}
								style="border: 2px solid {cardColors.border};"
								on:click={hasBreakdown ? () => toggleGradeBreakdown(subject.id) : undefined}
								role={hasBreakdown ? 'button' : undefined}
								on:keydown={hasBreakdown ? (e) => e.key === 'Enter' && toggleGradeBreakdown(subject.id) : undefined}>
								
								<!-- Column 1: Icon -->
								<div class="subject-icon-column">
									<div class="subject-icon" style="color: {cardColors.icon};">
										<span class="material-symbols-outlined">book</span>
									</div>
								</div>
								
								<!-- Column 2: Subject Details -->
								<div class="subject-details-column">
									<h3 class="subject-name" style="color: {cardColors.text};">{subject.name}</h3>
									<p class="teacher-name" class:no-teacher={subject.teacher === "No teacher"}>{subject.teacher}</p>
									<div class="progress-bar">
										{#key `${subject.id}-${currentQuarterNum}-${currentSchoolYear}`}
											{#if getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher", subject.numericGrade > 0, subject.verified) > 0}
												<div 
													class="progress-fill progress-fill-animated" 
													style="width: {getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher", subject.numericGrade > 0, subject.verified)}%; background-color: {progressBarColors[subject.id] || getGradeColor(subject.numericGrade)}">
												</div>
											{/if}
										{/key}
									</div>
								</div>
								
							<!-- Column 3: Grade Display -->
							<div class="grade-column">
								<div class="grade-large">
									{#key `${subject.id}-${currentQuarterNum}`}
										{#if subject.numericGrade > 0 && subject.teacher !== "No teacher" && subject.verified}
											<CountUp 
												value={subject.numericGrade} 
												decimals={1} 
												duration={2.5}
												colorTransition={true}
												getGradeColor={getGradeColor} />
										{:else}
											<span style="color: {getGradeColor(subject.numericGrade)}">
												{formatGrade(subject.numericGrade, subject.teacher !== "No teacher", subject.numericGrade > 0, subject.verified)}
											</span>
										{/if}
										{#if subject.numericGrade > 0 && !subject.verified}
											<span class="unverified-indicator" title="Grade not yet verified">*</span>
										{/if}
									{/key}
								</div>
								<div class="grade-indicator {getGradeIndicator(subject.numericGrade).color}">
									{getGradeIndicator(subject.numericGrade).text}
								</div>
							</div>
							</div>

							<!-- Collapsible Breakdown Section -->
							{#if expandedGrades.has(subject.id)}
								<div class="grade-breakdown-section">
									<div class="breakdown-container">
										
										<!-- Written Work Section -->
										{#if subject.writtenWorkScores && subject.writtenWorkScores.length > 0}
											<div class="breakdown-category">
												<div class="category-header">
													<div class="category-title">
														<span class="material-symbols-outlined">edit</span>
														<span>Written Work</span>
													</div>
													<div class="category-average" style="color: {getGradeColor(subject.writtenWork)}">
														{formatGradeDisplay(subject.writtenWork)}
													</div>
												</div>
												<div class="scores-list">
													{#each subject.writtenWorkScores as score, i}
														<div class="score-item">
															<span class="score-label">{formatScoreLabel(i, 'written')}</span>
															<span class="score-value" style="color: {getGradeColor(score)}">{score}</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Performance Tasks Section -->
										{#if subject.performanceTasksScores && subject.performanceTasksScores.length > 0}
											<div class="breakdown-category">
												<div class="category-header">
													<div class="category-title">
														<span class="material-symbols-outlined">assignment</span>
														<span>Performance Tasks</span>
													</div>
													<div class="category-average" style="color: {getGradeColor(subject.performanceTasks)}">
														{formatGradeDisplay(subject.performanceTasks)}
													</div>
												</div>
												<div class="scores-list">
													{#each subject.performanceTasksScores as score, i}
														<div class="score-item">
															<span class="score-label">{formatScoreLabel(i, 'performance')}</span>
															<span class="score-value" style="color: {getGradeColor(score)}">{score}</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Quarterly Assessment Section -->
										{#if subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0}
											<div class="breakdown-category quarterly-assessment-category">
												<div class="category-header">
													<div class="category-title">
														<span class="material-symbols-outlined">quiz</span>
														<span>Quarterly Assessment</span>
													</div>
													<div class="category-average" style="color: {getGradeColor(subject.quarterlyAssessment)}">
														{formatGradeDisplay(subject.quarterlyAssessment)}
													</div>
												</div>
												<div class="scores-list">
													{#each subject.quarterlyAssessmentScores as score, i}
														<div class="score-item">
															<span class="score-label">{formatScoreLabel(i, 'quarterly')}</span>
															<span class="score-value" style="color: {getGradeColor(score)}">{score}</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>