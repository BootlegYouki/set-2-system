<script>
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Props passed from modal store
	let {
		subject = {},
		quarterName = '',
		schoolYear = '',
		onClose = () => {}
	} = $props();

	// Local state
	let activeTab = $state('overview'); // 'overview', 'breakdown', or 'insights'

	// Helper functions
	function getGradeColor(grade) {
		if (grade === 0 || grade === null || grade === undefined) return 'var(--grade-no-grade)';
		if (grade >= 85) return 'var(--grade-excellent)';
		if (grade >= 80) return 'var(--grade-good)';
		if (grade >= 75) return 'var(--grade-satisfactory)';
		if (grade >= 65) return 'var(--grade-needs-improvement)';
		return 'var(--grade-needs-improvement)';
	}

	function getGradeIndicator(grade) {
		if (grade >= 85) return 'Excellent';
		if (grade >= 80) return 'Good';
		if (grade >= 75) return 'Satisfactory';
		if (grade >= 65) return 'Needs Improvement';
		return 'No Grade';
	}

	function formatGradeDisplay(grade) {
		if (grade === null || grade === undefined || grade === 0) return 'N/A';
		if (grade % 1 === 0) {
			return grade.toString();
		}
		return grade.toFixed(1);
	}

	function formatScoreLabel(index, type) {
		const types = {
			written: 'Quiz',
			performance: 'Project',
			quarterly: 'Exam'
		};
		return `${types[type] || 'Task'} ${index + 1}`;
	}

	function getProgressWidth(grade) {
		if (!grade || grade === 0) return 0;
		return Math.min((grade / 100) * 100, 100);
	}

	// Check if subject has detailed scores
	function hasDetailedScores() {
		if (!subject) return false;
		return (
			(subject.writtenWorkScores && subject.writtenWorkScores.length > 0) ||
			(subject.performanceTasksScores && subject.performanceTasksScores.length > 0) ||
			(subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0)
		);
	}

	// Calculate average of an array
	function calculateAverage(scores) {
		if (!scores || scores.length === 0) return 0;
		const sum = scores.reduce((acc, val) => acc + val, 0);
		return sum / scores.length;
	}

	// Get insights based on performance
	function getPerformanceInsight() {
		if (!subject) return "Loading...";
		const grade = subject.numericGrade || 0;
		if (grade >= 90) {
			return "Outstanding performance! Keep up the excellent work.";
		} else if (grade >= 85) {
			return "Great job! You're performing very well in this subject.";
		} else if (grade >= 80) {
			return "Good work! Continue to build on this foundation.";
		} else if (grade >= 75) {
			return "Satisfactory performance. Consider reviewing key concepts.";
		} else if (grade > 0) {
			return "There's room for improvement. Focus on understanding core topics.";
		}
		return "Grade not yet available.";
	}

	function getAssessmentTypeInsight() {
		if (!subject || !hasDetailedScores()) return "Detailed scores will appear here once available.";
		
		const ww = subject.writtenWork || 0;
		const pt = subject.performanceTasks || 0;
		const qa = subject.quarterlyAssessment || 0;

		const scores = [
			{ name: 'Written Work', value: ww },
			{ name: 'Performance Tasks', value: pt },
			{ name: 'Quarterly Assessment', value: qa }
		].filter(s => s.value > 0);

		if (scores.length === 0) return "No assessment data available yet.";

		scores.sort((a, b) => b.value - a.value);
		const strongest = scores[0];
		const weakest = scores[scores.length - 1];

		if (strongest.value === weakest.value) {
			return `You're performing consistently across all assessment types at ${strongest.value.toFixed(1)}%.`;
		}

		return `Your strongest area is ${strongest.name} (${strongest.value.toFixed(1)}%). ${
			weakest.value < 80 ? `Consider focusing more on ${weakest.name}.` : ''
		}`;
	}
</script>

<div class="grade-modal-content" transition:fly="{{ y: 20, duration: 300, easing: quintOut }}">
	{#if subject}
	<!-- Header -->
	<div class="modal-header">
		<div class="header-info">
			<h2 class="subject-title">{subject.name || 'Subject'}</h2>
			<div class="header-meta">
				<span class="meta-item">
					<span class="material-symbols-outlined">person</span>
					{subject.teacher || 'No teacher assigned'}
				</span>
				<span class="meta-item">
					<span class="material-symbols-outlined">calendar_today</span>
					{quarterName} • {schoolYear}
				</span>
			</div>
		</div>
		<button class="close-btn" onclick={onClose} aria-label="Close modal">
			<span class="material-symbols-outlined">close</span>
		</button>
	</div>

	<!-- Grade Overview Card -->
	<div class="grade-overview-card">
		<div class="grade-display">
			<div class="grade-label">Final Grade</div>
			<div class="grade-value" style="color: {getGradeColor(subject.numericGrade)}">
				{formatGradeDisplay(subject.numericGrade)}
			</div>
			<div class="grade-status" style="color: {getGradeColor(subject.numericGrade)}">
				{getGradeIndicator(subject.numericGrade)}
			</div>
		</div>
		<div class="grade-progress">
			<div class="progress-bar-container">
				<div 
					class="progress-bar-fill" 
					style="width: {getProgressWidth(subject.numericGrade)}%; background-color: {getGradeColor(subject.numericGrade)}">
				</div>
			</div>
		</div>
	</div>

	<!-- Tabs -->
	<div class="modal-tabs">
		<button 
			class="tab-btn" 
			class:active={activeTab === 'overview'}
			onclick={() => activeTab = 'overview'}>
			<span class="material-symbols-outlined">dashboard</span>
			Overview
		</button>
		<button 
			class="tab-btn" 
			class:active={activeTab === 'breakdown'}
			onclick={() => activeTab = 'breakdown'}
			disabled={!hasDetailedScores()}>
			<span class="material-symbols-outlined">list</span>
			Breakdown
		</button>
		<button 
			class="tab-btn" 
			class:active={activeTab === 'insights'}
			onclick={() => activeTab = 'insights'}>
			<span class="material-symbols-outlined">lightbulb</span>
			Insights
		</button>
	</div>

	<!-- Tab Content -->
	<div class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview-tab" transition:fade="{{ duration: 200 }}">
				<div class="assessment-grid">
					{#if subject.writtenWork > 0}
						<div class="assessment-card">
							<div class="assessment-header">
								<span class="material-symbols-outlined">edit</span>
								<span class="assessment-name">Written Work</span>
							</div>
							<div class="assessment-score" style="color: {getGradeColor(subject.writtenWork)}">
								{formatGradeDisplay(subject.writtenWork)}
							</div>
							<div class="assessment-weight">30% of final grade</div>
						</div>
					{/if}

					{#if subject.performanceTasks > 0}
						<div class="assessment-card">
							<div class="assessment-header">
								<span class="material-symbols-outlined">assignment</span>
								<span class="assessment-name">Performance Tasks</span>
							</div>
							<div class="assessment-score" style="color: {getGradeColor(subject.performanceTasks)}">
								{formatGradeDisplay(subject.performanceTasks)}
							</div>
							<div class="assessment-weight">50% of final grade</div>
						</div>
					{/if}

					{#if subject.quarterlyAssessment > 0}
						<div class="assessment-card">
							<div class="assessment-header">
								<span class="material-symbols-outlined">quiz</span>
								<span class="assessment-name">Quarterly Assessment</span>
							</div>
							<div class="assessment-score" style="color: {getGradeColor(subject.quarterlyAssessment)}">
								{formatGradeDisplay(subject.quarterlyAssessment)}
							</div>
							<div class="assessment-weight">20% of final grade</div>
						</div>
					{/if}
				</div>

				{#if !subject.verified}
					<div class="info-banner warning">
						<span class="material-symbols-outlined">info</span>
						<span>This grade is not yet verified by your teacher.</span>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'breakdown'}
			<div class="breakdown-tab" transition:fade="{{ duration: 200 }}">
				{#if hasDetailedScores()}
					<!-- Written Work -->
					{#if subject.writtenWorkScores && subject.writtenWorkScores.length > 0}
						<div class="breakdown-section">
							<div class="breakdown-header">
								<div class="breakdown-title">
									<span class="material-symbols-outlined">edit</span>
									<span>Written Work</span>
								</div>
								<div class="breakdown-average" style="color: {getGradeColor(subject.writtenWork)}">
									Average: {formatGradeDisplay(subject.writtenWork)}
								</div>
							</div>
							<div class="scores-grid">
								{#each subject.writtenWorkScores as score, i}
									<div class="score-card">
										<div class="score-label">{formatScoreLabel(i, 'written')}</div>
										<div class="score-value" style="color: {getGradeColor(score)}">
											{formatGradeDisplay(score)}
										</div>
										<div class="score-bar">
											<div class="score-bar-fill" style="width: {getProgressWidth(score)}%; background-color: {getGradeColor(score)}"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Performance Tasks -->
					{#if subject.performanceTasksScores && subject.performanceTasksScores.length > 0}
						<div class="breakdown-section">
							<div class="breakdown-header">
								<div class="breakdown-title">
									<span class="material-symbols-outlined">assignment</span>
									<span>Performance Tasks</span>
								</div>
								<div class="breakdown-average" style="color: {getGradeColor(subject.performanceTasks)}">
									Average: {formatGradeDisplay(subject.performanceTasks)}
								</div>
							</div>
							<div class="scores-grid">
								{#each subject.performanceTasksScores as score, i}
									<div class="score-card">
										<div class="score-label">{formatScoreLabel(i, 'performance')}</div>
										<div class="score-value" style="color: {getGradeColor(score)}">
											{formatGradeDisplay(score)}
										</div>
										<div class="score-bar">
											<div class="score-bar-fill" style="width: {getProgressWidth(score)}%; background-color: {getGradeColor(score)}"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Quarterly Assessment -->
					{#if subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0}
						<div class="breakdown-section">
							<div class="breakdown-header">
								<div class="breakdown-title">
									<span class="material-symbols-outlined">quiz</span>
									<span>Quarterly Assessment</span>
								</div>
								<div class="breakdown-average" style="color: {getGradeColor(subject.quarterlyAssessment)}">
									Average: {formatGradeDisplay(subject.quarterlyAssessment)}
								</div>
							</div>
							<div class="scores-grid">
								{#each subject.quarterlyAssessmentScores as score, i}
									<div class="score-card">
										<div class="score-label">{formatScoreLabel(i, 'quarterly')}</div>
										<div class="score-value" style="color: {getGradeColor(score)}">
											{formatGradeDisplay(score)}
										</div>
										<div class="score-bar">
											<div class="score-bar-fill" style="width: {getProgressWidth(score)}%; background-color: {getGradeColor(score)}"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<div class="empty-state">
						<span class="material-symbols-outlined">pending</span>
						<p>No detailed scores available yet</p>
						<small>Scores will appear here once your teacher uploads them</small>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'insights'}
			<div class="insights-tab" transition:fade="{{ duration: 200 }}">
				<div class="insight-card">
					<div class="insight-header">
						<span class="material-symbols-outlined">psychology</span>
						<h3>Performance Analysis</h3>
					</div>
					<p class="insight-text">{getPerformanceInsight()}</p>
				</div>

				{#if hasDetailedScores()}
					<div class="insight-card">
						<div class="insight-header">
							<span class="material-symbols-outlined">analytics</span>
							<h3>Assessment Breakdown</h3>
						</div>
						<p class="insight-text">{getAssessmentTypeInsight()}</p>
					</div>

					<div class="stats-grid">
						{#if subject.writtenWorkScores && subject.writtenWorkScores.length > 0}
							<div class="stat-card">
								<div class="stat-label">Written Work Tasks</div>
								<div class="stat-value">{subject.writtenWorkScores.length}</div>
							</div>
						{/if}
						{#if subject.performanceTasksScores && subject.performanceTasksScores.length > 0}
							<div class="stat-card">
								<div class="stat-label">Performance Tasks</div>
								<div class="stat-value">{subject.performanceTasksScores.length}</div>
							</div>
						{/if}
						{#if subject.quarterlyAssessmentScores && subject.quarterlyAssessmentScores.length > 0}
							<div class="stat-card">
								<div class="stat-label">Assessments</div>
								<div class="stat-value">{subject.quarterlyAssessmentScores.length}</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{/if}
</div>

<style>
	.grade-modal-content {
		width: 100%;
		max-width: 900px;
		background-color: var(--md-sys-color-surface-container-high);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		overflow: hidden;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: var(--spacing-lg);
		border-bottom: 2px solid var(--md-sys-color-outline-variant);
		background: var(--md-sys-color-surface-container);
		gap: var(--spacing-md);
	}

	.header-info {
		flex: 1;
		min-width: 0;
	}

	.subject-title {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--md-sys-color-on-surface);
		word-wrap: break-word;
	}

	.header-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.meta-item .material-symbols-outlined {
		font-size: 1rem;
	}

	.close-btn {
		background: var(--md-sys-color-surface-container-highest);
		border: none;
		padding: 8px;
		border-radius: 50%;
		cursor: pointer;
		color: var(--md-sys-color-on-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	.close-btn:hover {
		background: var(--md-sys-color-surface-container-highest);
		transform: scale(1.05);
	}

	.close-btn .material-symbols-outlined {
		font-size: 24px;
	}

	/* Grade Overview Card */
	.grade-overview-card {
		padding: var(--spacing-lg);
		background: linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-secondary-container) 100%);
		border-bottom: 2px solid var(--md-sys-color-outline-variant);
	}

	.grade-display {
		text-align: center;
		margin-bottom: var(--spacing-md);
	}

	.grade-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: var(--spacing-xs);
	}

	.grade-value {
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		margin-bottom: var(--spacing-xs);
	}

	.grade-status {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.grade-progress {
		margin-top: var(--spacing-md);
	}

	.progress-bar-container {
		width: 100%;
		height: 12px;
		background: var(--md-sys-color-surface-container-highest);
		border-radius: 6px;
		overflow: hidden;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-bar-fill {
		height: 100%;
		transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 6px;
	}

	/* Tabs */
	.modal-tabs {
		display: flex;
		gap: var(--spacing-xs);
		padding: var(--spacing-md) var(--spacing-lg) 0;
		background: var(--md-sys-color-surface-container);
		border-bottom: 2px solid var(--md-sys-color-outline-variant);
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		position: relative;
		bottom: -2px;
	}

	.tab-btn:hover:not(:disabled) {
		color: var(--md-sys-color-on-surface);
		background: var(--md-sys-color-surface-container-highest);
	}

	.tab-btn.active {
		color: var(--md-sys-color-primary);
		border-bottom-color: var(--md-sys-color-primary);
		font-weight: 600;
	}

	.tab-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tab-btn .material-symbols-outlined {
		font-size: 1.25rem;
	}

	/* Tab Content */
	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		background: var(--md-sys-color-surface-container);
	}

	/* Overview Tab */
	.assessment-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.assessment-card {
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		text-align: center;
		transition: all var(--transition-normal);
	}

	.assessment-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.assessment-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
		color: var(--md-sys-color-on-surface-variant);
	}

	.assessment-header .material-symbols-outlined {
		font-size: 1.5rem;
	}

	.assessment-name {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.assessment-score {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: var(--spacing-xs);
	}

	.assessment-weight {
		font-size: 0.875rem;
		color: var(--md-sys-color-on-surface-variant);
	}

	/* Breakdown Tab */
	.breakdown-section {
		margin-bottom: var(--spacing-xl);
	}

	.breakdown-section:last-child {
		margin-bottom: 0;
	}

	.breakdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.breakdown-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.breakdown-title .material-symbols-outlined {
		font-size: 1.5rem;
		color: var(--md-sys-color-primary);
	}

	.breakdown-average {
		font-size: 1rem;
		font-weight: 700;
	}

	.scores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--spacing-md);
	}

	.score-card {
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		transition: all var(--transition-fast);
	}

	.score-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.score-label {
		font-size: 0.875rem;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: var(--spacing-xs);
	}

	.score-value {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--spacing-sm);
	}

	.score-bar {
		width: 100%;
		height: 6px;
		background: var(--md-sys-color-surface-container);
		border-radius: 3px;
		overflow: hidden;
	}

	.score-bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Insights Tab */
	.insight-card {
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-md);
	}

	.insight-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		color: var(--md-sys-color-primary);
	}

	.insight-header .material-symbols-outlined {
		font-size: 1.75rem;
	}

	.insight-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.insight-text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--md-sys-color-on-surface-variant);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--spacing-md);
	}

	.stat-card {
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		text-align: center;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: var(--spacing-xs);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--md-sys-color-primary);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--md-sys-color-on-surface-variant);
	}

	.empty-state .material-symbols-outlined {
		font-size: 4rem;
		opacity: 0.5;
		margin-bottom: var(--spacing-md);
	}

	.empty-state p {
		margin: var(--spacing-sm) 0;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.empty-state small {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	/* Info Banner */
	.info-banner {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.info-banner.warning {
		background: var(--md-sys-color-error-container);
		color: var(--md-sys-color-on-error-container);
	}

	.info-banner .material-symbols-outlined {
		font-size: 1.25rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.grade-modal-content {
			max-height: 95vh;
		}

		.modal-header {
			padding: var(--spacing-md);
		}

		.subject-title {
			font-size: 1.25rem;
		}

		.header-meta {
			flex-direction: column;
			gap: var(--spacing-xs);
		}

		.grade-value {
			font-size: 3rem;
		}

		.tab-content {
			padding: var(--spacing-md);
		}

		.assessment-grid {
			grid-template-columns: 1fr;
		}

		.scores-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}

		.modal-tabs {
			padding: var(--spacing-sm) var(--spacing-md) 0;
		}

		.tab-btn {
			font-size: 0.875rem;
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.tab-btn span:not(.material-symbols-outlined) {
			display: none;
		}
	}
</style>
