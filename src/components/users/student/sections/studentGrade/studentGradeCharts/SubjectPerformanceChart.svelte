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

		// Filter out subjects with no grades
		const validSubjects = subjects.filter(s => s.numericGrade > 0 && s.verified);

		if (validSubjects.length === 0) {
			return;
		}

		// Prepare data
		const labels = validSubjects.map(s => s.name);
		const grades = validSubjects.map(s => s.numericGrade);

		// Color based on performance
		const backgroundColors = grades.map(grade => {
			if (grade >= 85) return 'rgba(76, 175, 80, 0.8)'; // Green - Excellent
			if (grade >= 80) return 'rgba(33, 150, 243, 0.8)'; // Blue - Good
			if (grade >= 75) return 'rgba(255, 152, 0, 0.8)'; // Orange - Satisfactory
			return 'rgba(244, 67, 54, 0.8)'; // Red - Needs Improvement
		});

		const borderColors = grades.map(grade => {
			if (grade >= 85) return 'rgb(76, 175, 80)';
			if (grade >= 80) return 'rgb(33, 150, 243)';
			if (grade >= 75) return 'rgb(255, 152, 0)';
			return 'rgb(244, 67, 54)';
		});

		const ctx = chartCanvas.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Grade',
						data: grades,
						backgroundColor: backgroundColors,
						borderColor: borderColors,
						borderWidth: 2,
						borderRadius: 8,
						barThickness: 35,
						maxBarThickness: 45
					}
				]
			},
			options: {
				indexAxis: 'y', // Horizontal bar chart
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: 'Subject Performance Overview',
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
								const grade = context.parsed.x;
								let performance = '';
								if (grade >= 85) performance = 'Excellent';
								else if (grade >= 80) performance = 'Good';
								else if (grade >= 75) performance = 'Satisfactory';
								else performance = 'Needs Improvement';
								return `Grade: ${grade.toFixed(1)} (${performance})`;
							}
						}
					}
				},
				scales: {
					x: {
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
					y: {
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
							padding: 10
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
			<span class="material-symbols-outlined">analytics</span>
			<p>No grade data available</p>
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

