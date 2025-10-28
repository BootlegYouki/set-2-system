<script>
  import { onMount } from 'svelte';
  import { authStore } from '../../../../login/js/auth.js';
  import { api } from '../../../../../routes/api/helper/api-helper.js';
  import './studentGrade.css';
	import CountUp from '../../../../common/CountUp.svelte';
	import SubjectPerformanceChart from './studentGradeCharts/SubjectPerformanceChart.svelte';
	import AssessmentTypeChart from './studentGradeCharts/AssessmentTypeChart.svelte';
	
	// State variables
	let loading = true;
	let error = null;
	let currentQuarter = '2nd Quarter'; // Default to 2nd Quarter based on current date
	let currentQuarterNum = 2; // Store the numeric quarter value (default to 2)
	let currentSchoolYear = '2025-2026'; // Store current school year
	let quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
	let isDropdownOpen = false;
	let subjects = [];
	let totalSubjects = 0;
	let overallAverage = 0;
	let studentData = null;
	let sectionInfo = null;
	let classRank = null;
	let totalStudentsInSection = 0;
	
	// Accordion state for grade breakdowns (similar to todo list)
	let expandedGrades = new Set();
	
	// AI Analysis variables
	let aiAnalysis = '';
	let aiAnalysisLoading = false;
	let aiAnalysisError = null;
	let showAiAnalysis = false;
	let isCachedAnalysis = false;

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
		// Reset AI analysis when quarter changes
		aiAnalysis = '';
		showAiAnalysis = false;
		aiAnalysisError = null;
		isCachedAnalysis = false;
		await fetchGrades();
	}

	function handleClickOutside(event) {
		if (isDropdownOpen && !event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
		}
	}

	// Fetch student profile data for section and class rank information
	async function fetchStudentProfile() {
		try {
			const response = await api.get(`/api/student-profile?studentId=${$authStore.userData.id}`);
			
			if (response.success) {
				const { section, academicSummary } = response.data;
				sectionInfo = section;
				classRank = academicSummary.classRank;
				totalStudentsInSection = academicSummary.totalStudentsInSection;
			}
		} catch (err) {
			console.error('Error fetching student profile:', err);
			// Don't set error here as it's not critical for grades display
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
			// Fetch current quarter and school year first
			await fetchCurrentQuarter();
			fetchGrades();
			fetchStudentProfile();
		} else {
			error = 'Please log in to view your grades';
			loading = false;
		}
	});

	// Fetch current quarter and school year
	async function fetchCurrentQuarter() {
		try {
			const response = await fetch('/api/current-quarter');
			const data = await response.json();
			
			if (data.success && data.data) {
				currentQuarterNum = data.data.currentQuarter;
				currentQuarter = data.data.quarterName;
				currentSchoolYear = data.data.currentSchoolYear;
			}
		} catch (err) {
			console.error('Error fetching current quarter/school year:', err);
			// Keep default values if fetch fails
		}
	}

	// Fetch grades from MongoDB API
	async function fetchGrades() {
		try {
			loading = true;
			error = null;

			const quarter = quarterToGradingPeriod[currentQuarter];
			const response = await api.get(`/api/student-grades?student_id=${$authStore.userData.id}&quarter=${quarter}&school_year=${currentSchoolYear}`);
			
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
			<div class="performance-header">
				<div class="performance-title-section">
					<div class="performance-title-content">
						<h2 class="performance-title">Academic Performance</h2>
						{#if sectionInfo}
							<div class="performance-subtitle">Grade {sectionInfo.gradeLevel} • {sectionInfo.name} </div>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="performance-stats">
				<div class="grade-stat-item primary">
					<div class="stat-icon">
						<span class="material-symbols-outlined">star</span>
					</div>
					<div class="stat-content">
						<div class="grade-stat-value">
							<CountUp 
								value={overallAverage} 
								decimals={1} 
								duration={2.5} 
								colorTransition={true}
								getGradeColor={getGradeColor} />
						</div>
						<div class="stat-label">Overall Average</div>
					</div>
				</div>
				
				<div class="grade-stat-item secondary">
					<div class="stat-icon">
						<span class="material-symbols-outlined">school</span>
					</div>
					<div class="stat-content">
						<div class="grade-stat-value">
							<CountUp value={totalSubjects} decimals={0} duration={2} />
						</div>
						<div class="stat-label">Total Subjects</div>
					</div>
				</div>

				<div class="grade-stat-item tertiary">
					<div class="stat-icon">
						<span class="material-symbols-outlined">crown</span>
					</div>
					<div class="stat-content">
						<div class="grade-stat-value">
							Rank <CountUp value={classRank} decimals={0} duration={2} />
						</div>
						<div class="stat-label">Out of {totalStudentsInSection} Students</div>
					</div>
				</div>
			</div>

			<!-- AI Analysis Container -->

		</div>
			<div class="ai-analysis-container">
				<div class="analysis-header">
					<div class="analysis-title-group">
						<h3 class="analysis-title">AI Performance Analysis</h3>
						{#if isCachedAnalysis && aiAnalysis}
							<span class="cache-badge" title="Analysis from cache (refreshed every 7 days)">
								<span class="material-symbols-outlined">schedule</span>
								Cached
							</span>
						{/if}
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
										{#if getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher", subject.numericGrade > 0, subject.verified) > 0}
											<div class="progress-fill" style="width: {getProgressWidth(subject.numericGrade, subject.teacher !== "No teacher", subject.numericGrade > 0, subject.verified)}%; background-color: {getGradeColor(subject.numericGrade)}"></div>
										{/if}
									</div>
								</div>
								
								<!-- Column 3: Grade Display -->
								<div class="grade-column">
									<div class="grade-large">
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