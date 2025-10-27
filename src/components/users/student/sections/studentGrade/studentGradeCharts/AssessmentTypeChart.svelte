<script>
	import { onMount, onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';

	// Register Chart.js components
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

	export let subjects = [];

	let chartCanvas;
	let chartInstance;

	function createChart() {
		if (!chartCanvas || !subjects || subjects.length === 0) {
			return;
		}

		if (chartInstance) {
			chartInstance.destroy();
		}

		// Filter verified subjects with grades
		const validSubjects = subjects.filter(s => s.numericGrade > 0 && s.verified);

		if (validSubjects.length === 0) {
			return;
		}

		const labels = validSubjects.map(s => s.name);

		// Extract assessment type averages
		const writtenWorkData = validSubjects.map(s => s.writtenWork || 0);
		const performanceTasksData = validSubjects.map(s => s.performanceTasks || 0);
		const quarterlyAssessmentData = validSubjects.map(s => s.quarterlyAssessment || 0);

		const ctx = chartCanvas.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Written Work',
						data: writtenWorkData,
						backgroundColor: 'rgba(33, 150, 243, 0.85)',
						borderColor: 'rgb(33, 150, 243)',
						borderWidth: 2,
						borderRadius: 6,
						barPercentage: 0.8,
						categoryPercentage: 0.9
					},
					{
						label: 'Performance Tasks',
						data: performanceTasksData,
						backgroundColor: 'rgba(156, 39, 176, 0.85)',
						borderColor: 'rgb(156, 39, 176)',
						borderWidth: 2,
						borderRadius: 6,
						barPercentage: 0.8,
						categoryPercentage: 0.9
					},
					{
						label: 'Quarterly Assessment',
						data: quarterlyAssessmentData,
						backgroundColor: 'rgba(255, 152, 0, 0.85)',
						borderColor: 'rgb(255, 152, 0)',
						borderWidth: 2,
						borderRadius: 6,
						barPercentage: 0.8,
						categoryPercentage: 0.9
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						display: true,
						position: 'top',
						labels: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface')
								.trim(),
							padding: 15,
							font: {
								size: 13,
								weight: '600'
							},
							usePointStyle: true,
							pointStyle: 'circle',
							boxWidth: 10,
							boxHeight: 10
						}
					},
					title: {
						display: true,
						text: 'Assessment Type Performance Comparison',
						font: {
							size: 16,
							weight: 'bold'
						},
						color: getComputedStyle(document.documentElement)
							.getPropertyValue('--md-sys-color-on-surface')
							.trim(),
						padding: {
							top: 10,
							bottom: 20
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						padding: 12,
						titleFont: {
							size: 14,
							weight: 'bold'
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							label: function (context) {
								const label = context.dataset.label || '';
								const value = context.parsed.y;
								let performance = '';
								if (value >= 85) performance = ' (Excellent)';
								else if (value >= 80) performance = ' (Good)';
								else if (value >= 75) performance = ' (Satisfactory)';
								else if (value > 0) performance = ' (Needs Improvement)';
								return `${label}: ${value.toFixed(1)}${performance}`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						max: 100,
						grid: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-outline-variant')
								.trim(),
							lineWidth: 1
						},
						ticks: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface-variant')
								.trim(),
							font: {
								size: 12,
								weight: '500'
							},
							padding: 8,
							callback: function(value) {
								return value + '%';
							}
						},
						title: {
							display: true,
							text: 'Grade (%)',
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface-variant')
								.trim(),
							font: {
								size: 12,
								weight: '600'
							}
						}
					},
					x: {
						grid: {
							display: false
						},
						ticks: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface-variant')
								.trim(),
							font: {
								size: 12,
								weight: '500'
							},
							maxRotation: 0,
							minRotation: 0,
							autoSkip: false
						}
					}
				}
			}
		});
	}

	// Listen for theme changes
	function handleThemeChange() {
		if (chartInstance) {
			createChart();
		}
	}

	onMount(() => {
		if (subjects && subjects.length > 0) {
			createChart();
		}

		// Listen for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					handleThemeChange();
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		return () => {
			observer.disconnect();
		};
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});

	// Recreate chart when subjects change
	$: if (subjects && chartCanvas) {
		createChart();
	}
</script>

<div class="chart-container">
	{#if subjects.filter(s => s.numericGrade > 0 && s.verified).length === 0}
		<div class="chart-empty">
			<span class="material-symbols-outlined">show_chart</span>
			<p>No assessment data available</p>
		</div>
	{:else}
		<canvas bind:this={chartCanvas}></canvas>
	{/if}
</div>

<style>
	.chart-container {
		background-color: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--elevation-1);
		transition: all var(--transition-normal);
	}

	.chart-container:hover {
		box-shadow: var(--elevation-2);
	}

	canvas {
		max-height: 100%;
		max-width: 100%;
	}

	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		color: var(--md-sys-color-on-surface-variant);
		padding: var(--spacing-xl);
	}

	.chart-empty .material-symbols-outlined {
		font-size: 48px;
		color: var(--md-sys-color-outline);
	}

	.chart-empty p {
		font-family: var(--md-sys-typescale-body-medium-font);
		font-size: var(--md-sys-typescale-body-medium-size);
		margin: 0;
	}
</style>

