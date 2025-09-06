<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let value = 0;
	export let format = 'd'; // Format string for odometer
	export let theme = 'default'; // Theme for odometer
	export let duration = 2000; // Animation duration in ms
	export let auto = true; // Auto start animation
	export let selector = null; // Custom selector
	export let useCommaDecimal = false; // Use comma as decimal separator
	export let animation = 'ease'; // Animation easing

	let odometerElement;
	let odometerInstance;

	onMount(async () => {
		if (browser) {
			try {
				// Dynamically import odometer
				const Odometer = (await import('odometer')).default;
				
				// Import CSS
				await import('odometer/themes/odometer-theme-default.css');
				
				// Initialize odometer
				odometerInstance = new Odometer({
					el: odometerElement,
					format: format,
					theme: theme,
					duration: duration,
					auto: auto,
					animation: animation,
					value: 0
				});
				
				// Handle comma decimal separator by post-processing
				if (useCommaDecimal) {
					const observer = new MutationObserver(() => {
						const odometerText = odometerElement.textContent;
						if (odometerText && odometerText.includes('.')) {
							odometerElement.textContent = odometerText.replace('.', ',');
						}
					});
					observer.observe(odometerElement, { childList: true, subtree: true, characterData: true });
				}
				
				// Set initial value
				setTimeout(() => {
					if (odometerInstance) {
						odometerInstance.update(value);
					}
				}, 100);
			} catch (error) {
				console.error('Failed to load odometer:', error);
			}
		}
	});

	// Update value when prop changes
	$: if (odometerInstance && browser) {
		odometerInstance.update(value);
	}
</script>

<div bind:this={odometerElement} class="odometer-container">
	{#if !browser}
		{value}
	{/if}
</div>

<style>
	.odometer-container {
		display: inline-block;
		font-variant-numeric: tabular-nums;
	}

	:global(.odometer) {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		line-height: inherit;
	}

	:global(.odometer .odometer-digit) {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
	}
</style>