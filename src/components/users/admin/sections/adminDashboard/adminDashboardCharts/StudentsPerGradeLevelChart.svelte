<script>
	import { onMount, onDestroy } from 'svelte';
	import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js';
	import { api } from '../../../../../../routes/api/helper/api-helper.js';

	// Register Chart.js components
	Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title);

	let chartCanvas;
	let chartInstance;
	let loading = true;
	let error = null;
	let chartData = null;

	const gradeLevels = ['7', '8', '9', '10'];

	const colors = [
		'rgb(0, 114, 178)', // Grade 7 - Red
		'rgb(230, 159, 0)', // Grade 8 - Blue
		'rgb(86, 180, 233)', // Grade 9 - Yellow
		'rgb(102, 102, 102)' // Grade 10 - Teal
	];

	async function fetchStudentsData() {
		try {
			loading = true;
			error = null;

			// Fetch students data from API
			const response = await api.get('/api/dashboard/students-per-grade');

			if (response.success) {
				chartData = response.data;
				loading = false;
				// Create chart after loading is set to false, so canvas is rendered
				setTimeout(() => {
					if (chartCanvas) {
						createChart(response.data);
					}
				}, 0);
			} else {
				throw new Error(response.error || 'Failed to fetch students data');
			}
		} catch (err) {
			console.error('Error fetching students per grade level:', err);
			error = err.message;
			loading = false;
		}
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
		const transformedData = gradeLevels.map((level, index) => {
			const gradeData = data.find((d) => d.grade_level === level);
			return gradeData ? gradeData.count : 0;
		});

		const ctx = chartCanvas.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: gradeLevels.map((g) => `Grade ${g}`),
				datasets: [
					{
						label: 'Students',
						data: transformedData,
						backgroundColor: colors,
						borderWidth: 5,
						borderRadius: 2,
						borderColor: getComputedStyle(document.documentElement)
							.getPropertyValue('--md-sys-color-surface-container')
							.trim(),
						hoverBorderWidth: 1,
						hoverBorderColor: getComputedStyle(document.documentElement)
							.getPropertyValue('--md-sys-color-surface-container')
							.trim()
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '50%', // control donut thickness
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: 'Students per Grade Level',
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
						callbacks: {
							label: function (context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
								return `${label}: ${value} students (${percentage}%)`;
							}
						}
					},
					centerText: {
						display: true,
						text: (chart) => {
							const data = chart.data.datasets[0].data;
							const total = data.reduce((a, b) => a + b, 0);
							return `${total}\nTotal\nStudents`;
						},
						color: getComputedStyle(document.documentElement)
							.getPropertyValue('--md-sys-color-on-surface')
							.trim(),
						font: {
							size: 20,
							weight: 'bold'
						}
					}
				}
			},
			plugins: [
				{
					id: 'centerText',
					beforeDraw(chart) {
						const {
							ctx,
							chartArea: { width, height }
						} = chart;
						const pluginOpts = chart.config.options.plugins.centerText;
						if (!pluginOpts?.display) return;

						// Get total students
						const data = chart.data.datasets[0].data;
						const total = data.reduce((a, b) => a + b, 0);

						// Style setup
						const color = pluginOpts.color;
						const bigFontSize = pluginOpts.font.size * 1.5; // larger number
						const smallFontSize = pluginOpts.font.size * 0.8; // smaller label
						const verticalOffset = 45;

						ctx.save();
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillStyle = color;

						// Positioning
						const centerX = width / 2;
						const centerY = height / 2;

						// Draw the large number (total)
						ctx.font = `${pluginOpts.font.weight} ${bigFontSize}px sans-serif`;
						ctx.fillText(total, centerX, centerY - smallFontSize / 1.5 + verticalOffset);

						// Draw the smaller text below
						ctx.font = `400 ${smallFontSize}px sans-serif`;
						ctx.fillText('Total Students', centerX, centerY + bigFontSize / 1.8 + verticalOffset);

						ctx.restore();
					}
				}
			]
		});
	}

	// Listen for theme changes and update chart colors
	function handleThemeChange() {
		if (chartInstance && chartData) {
			createChart(chartData);
		}
	}

	onMount(() => {
		fetchStudentsData();

		// Refresh every 60 seconds
		const refreshInterval = setInterval(() => {
			fetchStudentsData();
		}, 5 * 60 * 1000);

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
			clearInterval(refreshInterval);
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
			<button class="retry-button" on:click={fetchStudentsData}>
				<span class="material-symbols-outlined">refresh</span>
				Retry
			</button>
		</div>
	{:else}
		<canvas bind:this={chartCanvas}></canvas>
		<div class="graph-label">
			{#each gradeLevels as grade, index}
				<div class="legend-item">
					<div class="legend-circle" style="background-color: {colors[index]};"></div>
					<span class="legend-text">Grade {grade}</span>
				</div>
			{/each}
		</div>
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
		display: flex;
		flex-direction: column;
	}

	canvas {
		max-height: 100%;
		max-width: 100%;
	}

	.graph-label {
		display: flex;
		gap: var(--spacing-md);
		margin-top: var(--spacing-md);
		justify-content: center;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.legend-circle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-text {
		font-family: var(--md-sys-typescale-body-small-font);
		font-size: var(--md-sys-typescale-body-small-size);
		color: var(--md-sys-color-on-surface);
		font-weight: 500;
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
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
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
