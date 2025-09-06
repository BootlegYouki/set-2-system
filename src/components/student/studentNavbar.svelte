<script>
	import { onMount } from 'svelte';

	// Props
	let { studentName = 'John Does', studentId = '2024-001234', profileImage = null, onlogout } = $props();

	// Theme state (default to dark mode)
	let isDarkMode = $state(true);

	// Check initial theme preference
	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		
		// Default to dark mode if no saved preference
		isDarkMode = savedTheme !== 'light';
		updateTheme();
	});

	// Toggle theme mode
	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		updateTheme();
	}

	// Update theme
	function updateTheme() {
		if (isDarkMode) {
			document.documentElement.setAttribute('data-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
			localStorage.setItem('theme', 'light');
		}
	}

	// Get initials for avatar
	function getInitials(name) {
		return name
			.split(' ')
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<nav class="student-navbar">
	<div class="navbar-container">
		<!-- Left section - Logo/Title -->
		<div class="navbar-left">
			<div class="logo-section">
				<span class="material-symbols-outlined logo-icon">school</span>
				<span class="app-title">Welcome, {studentName}</span>
			</div>
		</div>

		<!-- Right section - User info and controls -->
		<div class="navbar-right">
			<!-- Dark mode toggle -->
			<button 
				class="icon-button dark-mode-toggle" 
				onclick={toggleDarkMode}
				aria-label="Toggle dark mode"
			>
				<span class="material-symbols-outlined">
					{isDarkMode ? 'dark_mode' : 'light_mode'}
				</span>
			</button>

			<!-- Logout button -->
			<button 
				class="icon-button logout-button" 
				onclick={onlogout}
				aria-label="Logout"
			>
				<span class="material-symbols-outlined">logout</span>
			</button>

			<!-- User profile section -->
			<div class="user-profile">
				<div class="user-info">
					<span class="user-name">{studentName}</span>
					<span class="user-id">ID: {studentId}</span>
				</div>
				
				<div class="user-avatar">
					{#if profileImage}
						<img src={profileImage} alt="Profile" class="avatar-image" />
					{:else}
						<div class="avatar-placeholder">
							{getInitials(studentName)}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</nav>

<style>
	.student-navbar {
		position: fixed;
    left: 0;
    right: 0;
		top: 0;
		z-index: var(--z-sticky);
		background-color: var(--md-sys-color-surface);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		box-shadow: var(--shadow-sm);
	}

	.navbar-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-lg);
		margin: 0 auto;
		height: 64px;
	}

	.navbar-left {
		display: flex;
		align-items: center;
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.logo-icon {
		font-size: 28px;
		color: var(--md-sys-color-primary);
	}

	.app-title {
		font-family: var(--md-sys-typescale-title-large-font);
		font-size: var(--md-sys-typescale-title-large-size);
		font-weight: var(--md-sys-typescale-title-large-weight);
		color: var(--md-sys-color-on-surface);
		margin: 0;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.icon-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: var(--radius-full);
		background-color: transparent;
		color: var(--md-sys-color-on-surface-variant);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.icon-button:hover {
		background-color: var(--md-sys-color-surface-variant);
		color: var(--md-sys-color-on-surface);
	}

	.icon-button:active {
		transform: scale(0.95);
	}

	.logout-button:hover {
		background-color: var(--md-sys-color-error-container);
		color: var(--md-sys-color-on-error-container);
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm);
		border-radius: var(--radius-lg);
		transition: background-color var(--transition-fast);
	}

	.user-profile:hover {
		background-color: var(--md-sys-color-surface-variant);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.user-name {
		font-family: var(--md-sys-typescale-body-large-font);
		font-size: var(--md-sys-typescale-body-large-size);
		font-weight: 500;
		color: var(--md-sys-color-on-surface);
		line-height: 1.2;
	}

	.user-id {
		font-family: var(--md-sys-typescale-label-large-font);
		font-size: 12px;
		color: var(--md-sys-color-on-surface-variant);
		line-height: 1.2;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		overflow: hidden;
		border: 2px solid var(--md-sys-color-outline-variant);
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		font-weight: 500;
		font-size: 14px;
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.navbar-container {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.user-info {
			display: none;
		}

		.app-title {
			font-size: 18px;
		}
	}
</style>