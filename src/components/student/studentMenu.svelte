<script>
	// Props
	let { activeSection = 'grades' } = $props();

	// Navigation items
	const navigationItems = [
		{
			id: 'grades',
			label: 'My Grades',
			icon: 'grade',
			active: true
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: 'schedule',
			active: false
		},
		{
			id: 'documents',
			label: 'Documents',
			icon: 'description',
			active: false
		}
	];

	// Update active state
	$effect(() => {
		navigationItems.forEach(item => {
			item.active = item.id === activeSection;
		});
	});

	// Handle navigation
	function handleNavigation(sectionId) {
		activeSection = sectionId;
		// Dispatch custom event for parent component
		dispatchEvent(new CustomEvent('navigate', {
			detail: { section: sectionId },
			bubbles: true
		}));
	}
</script>

<!-- Bottom Navigation -->
<nav class="bottom-navigation" role="navigation" aria-label="Student portal navigation">
		<div class="nav-container">
			{#each navigationItems as item (item.id)}
				<button 
					class="nav-item" 
					class:active={item.active}
					onclick={() => handleNavigation(item.id)}
					aria-label={item.label}
					aria-current={item.active ? 'page' : undefined}
				>
					<div class="nav-icon-container">
						<span class="material-symbols-outlined nav-icon">
							{item.icon}
						</span>
						{#if item.active}
							<div class="active-indicator"></div>
						{/if}
					</div>
					<span class="nav-label">{item.label}</span>
				</button>
			{/each}
		</div>
</nav>

<style>
	.bottom-navigation {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-sticky);
		background-color: var(--md-sys-color-surface);
		border-top: 1px solid var(--md-sys-color-outline-variant);
		box-shadow: var(--shadow-sm);
	}

	.nav-container {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-md);
		max-width: 600px;
		margin: 0 auto;
		height: 64px;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: var(--spacing-sm);
		border: none;
		background: transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		min-width: 64px;
		position: relative;
	}

	.nav-item:hover {
		background-color: var(--md-sys-color-surface-variant);
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		color: var(--md-sys-color-primary);
	}

	.nav-icon-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.nav-icon {
		font-size: 24px;
		color: var(--md-sys-color-on-surface-variant);
		transition: color var(--transition-fast);
	}

	.nav-item.active .nav-icon {
		color: var(--md-sys-color-primary);
		font-variation-settings: 'FILL' 1;
	}

	.active-indicator {
		position: absolute;
		top: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 3px;
		background-color: var(--md-sys-color-primary);
		border-radius: var(--radius-full);
		animation: slideIn 0.2s ease-out;
	}

	.nav-label {
		font-family: var(--md-sys-typescale-label-large-font);
		font-size: 12px;
		font-weight: var(--md-sys-typescale-label-large-weight);
		color: var(--md-sys-color-on-surface-variant);
		transition: color var(--transition-fast);
		text-align: center;
		line-height: 1.2;
	}

	.nav-item.active .nav-label {
		color: var(--md-sys-color-primary);
		font-weight: 600;
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.nav-container {
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.nav-item {
			min-width: 56px;
			padding: 6px;
		}

		.nav-label {
			font-size: 11px;
		}

		.nav-icon {
			font-size: 22px;
		}
	}

	/* Dark mode specific adjustments */
	[data-theme="dark"] .bottom-navigation {
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Safe area for devices with notches */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.bottom-navigation {
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
</style>