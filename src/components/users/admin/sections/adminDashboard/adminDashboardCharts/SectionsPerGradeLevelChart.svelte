<script>
	import { onMount, onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
	import { dashboardStore } from '../../../../../../lib/stores/admin/dashboardStore.js';

	// Register Chart.js components
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

	let chartCanvas;
	let chartInstance;

	// Subscribe to store for this chart
	$: chartState = $dashboardStore.charts.sectionsPerGrade;
	$: loading = chartState.isLoading;
	$: error = chartState.error;
	$: chartData = chartState.data;

	const gradeLevels = ['7', '8', '9', '10'];

	// Create chart when data is available (always with animation since no cache)
	$: if (chartData && !loading && chartCanvas) {
		setTimeout(() => {
			createChart(chartData);
		}, 0);
	}

	function createChart(data) {
		// Check if canvas is available
		if (!chartCanvas) {
			console.warn('Canvas not yet available');
			return;
		}

		if (chartInstance) {
			chartInstance.destroy();
		}

		// Transform data into chart format
		const transformedData = gradeLevels.map((level) => {
			const sectionData = data.find(d => d.grade_level === level);
			return sectionData ? sectionData.section_count : 0;
		});

		const ctx = chartCanvas.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: gradeLevels.map(g => `Grade ${g}`),
				datasets: [{
					label: 'Number of Sections',
					data: transformedData,
					backgroundColor: [
						'rgba(54, 162, 235, 0.6)',   // Grade 7 - Blue
						'rgba(75, 192, 192, 0.6)',   // Grade 8 - Teal
						'rgba(153, 102, 255, 0.6)',  // Grade 9 - Purple
						'rgba(255, 159, 64, 0.6)'    // Grade 10 - Orange
					],
					borderColor: [
						'rgb(54, 162, 235)',   // Grade 7 - Blue
						'rgb(75, 192, 192)',   // Grade 8 - Teal
						'rgb(153, 102, 255)',  // Grade 9 - Purple
						'rgb(255, 159, 64)'    // Grade 10 - Orange
					],
					borderWidth: 2,
					borderRadius: 8,
					borderSkipped: false
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						suggestedMax: Math.max(...transformedData) + 2, // Add some padding above the highest value
						ticks: {
							stepSize: 1,
							callback: function(value) {
								return Math.floor(value);
							},
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface-variant').trim()
						},
						grid: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-outline-variant').trim()
						},
						title: {
							display: true,
							text: 'Number of Sections',
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface').trim(),
							font: {
								size: 12,
								weight: 'bold'
							}
						}
					},
					x: {
						ticks: {
							color: getComputedStyle(document.documentElement)
								.getPropertyValue('--md-sys-color-on-surface-variant').trim()
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: 'Sections per Grade Level',
						font: {
							size: 16,
							weight: 'bold'
						},
						color: getComputedStyle(document.documentElement)
							.getPropertyValue('--md-sys-color-on-surface').trim(),
						padding: {
							top: 10,
							bottom: 20
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const value = context.parsed.y || 0;
								return `Sections: ${value}`;
							}
						}
					}
				}
			}
		});
	}

	// Listen for theme changes and update chart colors
	function handleThemeChange() {
		if (chartInstance && chartData) {
			createChart(chartData);
		}
	}

	onMount(() => {
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
</script>

<div class="chart-container">
	{#if loading}
		<div class="chart-loading">
			<div class="chart-loader"></div>
			<p>Loading chart data...</p>
		</div>
	{:else if error}
		<div class="chart-error">
			<span class="material-symbols-outlined">error</span>
			<p>{error}</p>
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
		height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--elevation-1);
	}

	canvas {
		max-height: 100%;
		max-width: 100%;
	}

	.chart-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		color: var(--md-sys-color-on-surface-variant);
	}

	.chart-loading p {
		color: var(--md-sys-color-on-surface-variant);
	}

	.chart-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		color: var(--md-sys-color-error);
	}

	.chart-error p {
		color: var(--md-sys-color-on-surface);
	}

	.chart-loader {
		width: 40px;
		height: 40px;
		border: 4px solid var(--md-sys-color-outline-variant);
		border-top: 4px solid var(--md-sys-color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.chart-error .material-symbols-outlined {
		font-size: 48px;
		color: var(--md-sys-color-error);
	}

	.retry-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-family: var(--md-sys-typescale-label-large-font);
		font-size: var(--md-sys-typescale-label-large-size);
		font-weight: var(--md-sys-typescale-label-large-weight);
		transition: all var(--transition-normal);
	}

	.retry-button:hover {
		background-color: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
	}

	.retry-button .material-symbols-outlined {
		font-size: 18px;
	}
</style>
