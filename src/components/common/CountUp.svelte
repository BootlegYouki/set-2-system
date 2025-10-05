<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { CountUp } from 'countup.js';

	// Props
	export let value = 0;
	export let decimals = 1; // Number of decimal places
	export let duration = 2; // Animation duration in seconds
	export let useEasing = true; // Use easing animation
	export let useGrouping = true; // Use thousand separators
	export let separator = ','; // Thousand separator
	export let decimal = '.'; // Decimal separator
	export let prefix = ''; // Prefix string
	export let suffix = ''; // Suffix string
	export let startVal = 0; // Starting value

	let countUpElement;
	let countUpInstance;
	let isInitialized = false;
	let hasAnimated = false;

	// Helper function to format number and remove .0 decimals
	function formatNumber(num, decimalPlaces) {
		const formatted = num.toFixed(decimalPlaces);
		// Remove .0 if it's a whole number
		return formatted.replace(/\.0+$/, '');
	}

	onMount(() => {
		if (browser && countUpElement) {
			// Initialize with startVal, don't animate yet
			countUpElement.textContent = `${prefix}${formatNumber(startVal, decimals)}${suffix}`;
			isInitialized = true;
			
			// If value is already available, start animation
			if (value !== startVal && value > 0) {
				startAnimation();
			}
		}
	});

	function startAnimation() {
		if (!browser || !countUpElement || !isInitialized || hasAnimated) return;
		
		try {
			// Create new CountUp instance for animation
			countUpInstance = new CountUp(countUpElement, value, {
				startVal: startVal,
				decimalPlaces: decimals,
				duration: duration,
				useEasing: useEasing,
				useGrouping: useGrouping,
				separator: separator,
				decimal: decimal,
				prefix: prefix,
				suffix: suffix,
				// Custom formatter to remove .0 decimals
				formattingFn: (n) => {
					const formatted = n.toFixed(decimals);
					return formatted.replace(/\.0+$/, '');
				}
			});

			if (!countUpInstance.error) {
				countUpInstance.start();
				hasAnimated = true;
			} else {
				console.error('CountUp error:', countUpInstance.error);
				// Fallback to direct display
				countUpElement.textContent = `${prefix}${formatNumber(value, decimals)}${suffix}`;
			}
		} catch (error) {
			console.error('Failed to initialize CountUp:', error);
			// Fallback to direct display
			countUpElement.textContent = `${prefix}${formatNumber(value, decimals)}${suffix}`;
		}
	}

	// Watch for value changes and trigger animation
	$: if (isInitialized && value !== startVal && value > 0 && !hasAnimated) {
		startAnimation();
	}

	// Handle subsequent value updates after initial animation
	$: if (countUpInstance && browser && hasAnimated && value !== startVal) {
		try {
			countUpInstance.update(value);
		} catch (error) {
			console.error('CountUp update error:', error);
			// Fallback to direct display
			countUpElement.textContent = `${prefix}${formatNumber(value, decimals)}${suffix}`;
		}
	}
</script>

<span bind:this={countUpElement} class="countup-container">
	{#if !browser}
		{prefix}{formatNumber(value, decimals)}{suffix}
	{/if}
</span>

<style>
	.countup-container {
		display: inline-block;
		font-variant-numeric: tabular-nums;
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		line-height: inherit;
	}
</style>