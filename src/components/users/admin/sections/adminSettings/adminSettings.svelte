<script>
	import './adminSettings.css';
	import { onMount } from 'svelte';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { showSuccess, showError } from '../../../../common/js/toastStore.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';

	// Loading states
	let loading = $state(false);
	let saving = $state(false);

	// Current school year state
	let currentSchoolYear = $state('2024-2025');
	let newSchoolYear = $state('');
	let previousSchoolYear = $state(null);
	let canUndo = $state(false);

	// School year dates
	let startDate = $state('');
	let endDate = $state('');

	// Quarter dates
	let quarter1Start = $state('');
	let quarter1End = $state('');
	let quarter2Start = $state('');
	let quarter2End = $state('');
	let quarter3Start = $state('');
	let quarter3End = $state('');
	let quarter4Start = $state('');
	let quarter4End = $state('');

	// Load admin settings from backend
	async function loadAdminSettings() {
		try {
			loading = true;
			const result = await api.get('/api/admin-settings');
			
			if (result.success) {
				const settings = result.data;
				
				// Update state with loaded settings
				currentSchoolYear = settings.current_school_year || '2024-2025';
				startDate = settings.school_year_start_date || '';
				endDate = settings.school_year_end_date || '';
				quarter1Start = settings.quarter_1_start_date || '';
				quarter1End = settings.quarter_1_end_date || '';
				quarter2Start = settings.quarter_2_start_date || '';
				quarter2End = settings.quarter_2_end_date || '';
				quarter3Start = settings.quarter_3_start_date || '';
				quarter3End = settings.quarter_3_end_date || '';
				quarter4Start = settings.quarter_4_start_date || '';
				quarter4End = settings.quarter_4_end_date || '';
			}
		} catch (error) {
			console.error('Error loading admin settings:', error);
			showError('Failed to load admin settings');
		} finally {
			loading = false;
		}
	}

	// Save admin settings to backend
	async function saveAdminSettings() {
		try {
			saving = true;
			
			const settings = {
				current_school_year: currentSchoolYear,
				school_year_start_date: startDate,
				school_year_end_date: endDate,
				quarter_1_start_date: quarter1Start,
				quarter_1_end_date: quarter1End,
				quarter_2_start_date: quarter2Start,
				quarter_2_end_date: quarter2End,
				quarter_3_start_date: quarter3Start,
				quarter_3_end_date: quarter3End,
				quarter_4_start_date: quarter4Start,
				quarter_4_end_date: quarter4End
			};

			const result = await api.put('/api/admin-settings', { settings });
			
			if (result.success) {
				showSuccess('Admin settings saved successfully');
			} else {
				throw new Error(result.error || 'Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving admin settings:', error);
			showError('Failed to save admin settings');
		} finally {
			saving = false;
		}
	}

	// Date validation
	let dateValidationError = $state('');

	// Validate dates whenever they change
	$effect(() => {
		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);
			
			if (start >= end) {
				dateValidationError = 'Start date must be before end date';
			} else {
				dateValidationError = '';
			}
		}
	});

	// Quarter validation
	let quarterValidationErrors = {
		quarter1: '',
		quarter2: '',
		quarter3: '',
		quarter4: ''
	};

	$effect(() => {
		// Validate Quarter 1
		if (quarter1Start && quarter1End) {
			const q1Start = new Date(quarter1Start);
			const q1End = new Date(quarter1End);
			
			if (q1Start >= q1End) {
				quarterValidationErrors.quarter1 = '1st Quarter start date must be before end date';
			} else {
				quarterValidationErrors.quarter1 = '';
			}
		}

		// Validate Quarter 2
		if (quarter2Start && quarter2End) {
			const q2Start = new Date(quarter2Start);
			const q2End = new Date(quarter2End);
			
			if (q2Start >= q2End) {
				quarterValidationErrors.quarter2 = '2nd Quarter start date must be before end date';
			} else {
				quarterValidationErrors.quarter2 = '';
			}
		}

		// Validate Quarter 3
		if (quarter3Start && quarter3End) {
			const q3Start = new Date(quarter3Start);
			const q3End = new Date(quarter3End);
			
			if (q3Start >= q3End) {
				quarterValidationErrors.quarter3 = '3rd Quarter start date must be before end date';
			} else {
				quarterValidationErrors.quarter3 = '';
			}
		}

		// Validate Quarter 4
		if (quarter4Start && quarter4End) {
			const q4Start = new Date(quarter4Start);
			const q4End = new Date(quarter4End);
			
			if (q4Start >= q4End) {
				quarterValidationErrors.quarter4 = '4th Quarter start date must be before end date';
			} else {
				quarterValidationErrors.quarter4 = '';
			}
		}
	});

	// Handle date changes
	async function handleDateChange() {
		if (dateValidationError) {
			console.error('Cannot apply changes: Date validation error');
			return;
		}

		// Check for quarter validation errors
		const hasQuarterErrors = Object.values(quarterValidationErrors).some(error => error !== '');
		if (hasQuarterErrors) {
			console.error('Cannot apply changes: Quarter validation errors');
			return;
		}

		// Save settings to backend
		await saveAdminSettings();
	}

	// Modal states - removed since we'll use modalStore
	// let showSchoolYearModal = $state(false);
	// let showPasswordModal = $state(false);

	// Password change states
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordLoading = $state(false);

	// School year change states
	let schoolYearLoading = $state(false);

	// Generate next school year
	function generateNextSchoolYear() {
		const [startYear] = currentSchoolYear.split('-');
		const nextStart = parseInt(startYear) + 1;
		const nextEnd = nextStart + 1;
		return `${nextStart}-${nextEnd}`;
	}

	// Handle school year change button click
	function handleSchoolYearChange() {
		newSchoolYear = generateNextSchoolYear();
		
		modalStore.confirm(
			'Confirm School Year Change',
			`<div class="admin-settings-school-year-change-content">
				<div class="admin-settings-change-info">
					<div class="admin-settings-current-year">
						<span class="label">Current School Year:</span>
						<span class="year">${currentSchoolYear}</span>
					</div>
					<div class="admin-settings-new-year">
						<span class="label">New School Year:</span>
						<span class="year">${newSchoolYear}</span>
					</div>
				</div>
				<div class="admin-settings-warning">
          <p>This action will promote eligible students and archive graduates. This cannot be undone easily.</p>
				</div>
			</div>`,
			confirmSchoolYearChange,
			() => {
				newSchoolYear = '';
			},
			{ size: 'medium' }
		);
	}

	// Confirm school year change
	async function confirmSchoolYearChange() {
		try {
			schoolYearLoading = true;
			
			// Simulate API call delay
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Store previous year for undo functionality
			previousSchoolYear = currentSchoolYear;
			currentSchoolYear = newSchoolYear;
			canUndo = true;
			
			showSuccess(`School year changed to ${newSchoolYear}`);
		} catch (error) {
			showError('Failed to change school year');
		} finally {
			schoolYearLoading = false;
		}
	}

	// Toggle password visibility function
	function togglePasswordVisibility(inputId) {
		const input = document.getElementById(inputId);
		const button = input.nextElementSibling;
		const icon = button.querySelector('.password-eye-icon');
		
		if (input.type === 'password') {
			input.type = 'text';
			icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
		} else {
			input.type = 'password';
			icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
		}
	}

	// Make function globally available
	if (typeof window !== 'undefined') {
		window.togglePasswordVisibility = togglePasswordVisibility;
	}

	// Handle password change button click
	function handlePasswordChangeModal() {
		const passwordFormContent = `
			<div class="admin-settings-password-form">
				<div class="admin-settings-form-group">
					<label for="current-password">Current Password</label>
					<div class="admin-settings-password-input-wrapper">
						<input 
							id="current-password"
							type="password" 
							placeholder="Enter current password"
							class="admin-settings-form-input"
						/>
						<button type="button" class="admin-settings-password-toggle" onclick="togglePasswordVisibility('current-password')">
							<svg class="password-eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						</button>
					</div>
				</div>
				
				<div class="admin-settings-form-group">
					<label for="new-password">New Password</label>
					<div class="admin-settings-password-input-wrapper">
						<input 
							id="new-password"
							type="password" 
							placeholder="Enter new password"
							class="admin-settings-form-input"
						/>
						<button type="button" class="admin-settings-password-toggle" onclick="togglePasswordVisibility('new-password')">
							<svg class="password-eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						</button>
					</div>
				</div>
				
				<div class="admin-settings-form-group">
					<label for="confirm-password">Confirm New Password</label>
					<div class="admin-settings-password-input-wrapper">
						<input 
							id="confirm-password"
							type="password" 
							placeholder="Confirm new password"
							class="admin-settings-form-input"
						/>
						<button type="button" class="admin-settings-password-toggle" onclick="togglePasswordVisibility('confirm-password')">
							<svg class="password-eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		`;

		modalStore.confirm(
			'Change Password',
			passwordFormContent,
			handlePasswordChange,
			() => {
				// Reset password fields
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			},
			{ size: 'medium' }
		);
	}
	async function handlePasswordChange() {
		// Get values from the modal inputs
		const currentPasswordInput = document.getElementById('current-password');
		const newPasswordInput = document.getElementById('new-password');
		const confirmPasswordInput = document.getElementById('confirm-password');
		
		if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
			showError('Password form inputs not found');
			return;
		}
		
		const currentPassword = currentPasswordInput.value;
		const newPassword = newPasswordInput.value;
		const confirmPassword = confirmPasswordInput.value;

		// Validation
		if (!currentPassword) {
			showError('Current password is required');
			return;
		}

		if (!newPassword) {
			showError('New password is required');
			return;
		}

		if (newPassword !== confirmPassword) {
			showError('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			showError('Password must be at least 8 characters long');
			return;
		}

		// Check if new password is different from current
		if (currentPassword === newPassword) {
			showError('New password must be different from current password');
			return;
		}

		try {
			passwordLoading = true;
			
			// Call the password change API
			const response = await api.post('/api/change-password', {
				currentPassword,
				newPassword
			});

			if (response.success) {
				// Reset form inputs
				currentPasswordInput.value = '';
				newPasswordInput.value = '';
				confirmPasswordInput.value = '';
				
				showSuccess('Password changed successfully!');
				
				// Close the modal
				modalStore.close();
			} else {
				showError(response.error || 'Failed to change password');
			}
		} catch (error) {
			console.error('Password change error:', error);
			showError(error.message || 'Failed to change password');
		} finally {
			passwordLoading = false;
		}
	}

	// Undo school year change
	function undoSchoolYearChange() {
		if (previousSchoolYear && canUndo) {
			currentSchoolYear = previousSchoolYear;
			previousSchoolYear = null;
			canUndo = false;
			showSuccess('School year change has been undone');
		}
	}

	onMount(() => {
		// Load admin settings when component initializes
		loadAdminSettings();
	});
</script>

<style>
	/* Quarter Styles */
	.admin-settings-quarters-section {
		margin-top: 1.5rem;
	}

	.admin-settings-quarters-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
		border-bottom: 2px solid var(--border-light);
		padding-bottom: 0.5rem;
	}

	.admin-settings-quarters-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.admin-settings-quarter-group {
		flex: 1;
		min-width: 200px;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid;
		background: rgba(255, 255, 255, 0.5);
	}

	/* Quarter Color Themes */
	.quarter-1 {
		border-color: var(--border-light);
		background: rgba(59, 130, 246, 0.05);
	}

	.quarter-2 {
		border-color: var(--border-light);
		background: rgba(16, 185, 129, 0.05);
	}

	.quarter-3 {
		border-color: var(--border-light);
		background: rgba(245, 158, 11, 0.05);
	}

	.quarter-4 {
		border-color: var(--border-light);
		background: rgba(239, 68, 68, 0.05);
	}

	.admin-settings-quarter-header {
		margin-bottom: 1rem;
		text-align: center;
	}

	.admin-settings-quarter-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>

<div class="admin-settings-container">
	<!-- Header -->
	<div class="admin-settings-header">
		<div class="admin-settings-header-content">
			<h1 class="admin-settings-page-title">Admin Settings</h1>
			<p class="admin-settings-page-subtitle">Manage system settings and configurations</p>
		</div>
	</div>

	<!-- School Year Management Section -->
	<div class="admin-settings-section">
		<div class="admin-settings-section-header">
			<h2 class="admin-settings-section-title">School Year Management</h2>
			<p class="admin-settings-section-subtitle">Manage the current academic year</p>
		</div>
		
		<div class="admin-settings-card">
			<div class="admin-settings-card-content">
				<div class="admin-settings-item">
					<div class="admin-settings-item-info">
						<h3 class="admin-settings-item-label">Current School Year</h3>
						<p class="admin-settings-item-description">The active academic year for the system</p>
					</div>
					<div class="admin-settings-item-value">
						<span class="admin-settings-current-year">{currentSchoolYear}</span>
					</div>
				</div>
				
				<div class="admin-settings-actions">
					<button 
						class="admin-settings-action-button admin-settings-primary" 
						onclick={handleSchoolYearChange}
					>
						<span class="material-symbols-outlined">keyboard_arrow_up</span>
						Advance School Year
					</button>
					
					<button 
						class="admin-settings-action-button admin-settings-secondary" 
						onclick={undoSchoolYearChange}
						disabled={!canUndo}
					>
						<span class="material-symbols-outlined">undo</span>
						Undo Last Change
					</button>
				</div>
			</div>
		</div>

		<!-- School Year Dates Card -->
		<div class="admin-settings-card">
			<div class="admin-settings-card-content">
				<div class="admin-settings-item">
					<div class="admin-settings-item-info">
						<h3 class="admin-settings-item-label">School Year Dates</h3>
						<p class="admin-settings-item-description">Set the start and end dates for classes</p>
					</div>
				</div>

				<!-- School Year Dates Section -->
				<div class="admin-settings-dates-section">
					<div class="admin-settings-date-group">
						<div class="admin-settings-date-item">
							<label for="start-date" class="admin-settings-date-label">Start of Classes</label>
							<input 
								id="start-date"
								type="text" 
								bind:value={startDate}
								class="admin-settings-date-input"
								class:error={dateValidationError}
								placeholder="YYYY-MM-DD"
							/>
						</div>
						<div class="admin-settings-date-item">
							<label for="end-date" class="admin-settings-date-label">End of Classes</label>
							<input 
								id="end-date"
								type="text" 
								bind:value={endDate}
								class="admin-settings-date-input"
								class:error={dateValidationError}
								placeholder="YYYY-MM-DD"
							/>
						</div>
					</div>

					<!-- Quarter Dates Section -->
					<div class="admin-settings-quarters-section">
						<h4 class="admin-settings-quarters-title">Quarter Schedules</h4>
						
						<div class="admin-settings-quarters-row">
							<!-- 1st Quarter -->
							<div class="admin-settings-quarter-group quarter-1">
								<div class="admin-settings-quarter-header">
									<span class="admin-settings-quarter-label">1st Quarter</span>
								</div>
								<div class="admin-settings-date-group">
									<div class="admin-settings-date-item">
										<label for="q1-start" class="admin-settings-date-label">Start</label>
										<input 
											id="q1-start"
											type="text" 
											bind:value={quarter1Start}
											class="admin-settings-date-input quarter-1-input"
											class:error={quarterValidationErrors.quarter1}
											placeholder="YYYY-MM-DD"
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q1-end" class="admin-settings-date-label">End</label>
										<input 
											id="q1-end"
											type="text" 
											bind:value={quarter1End}
											class="admin-settings-date-input quarter-1-input"
											class:error={quarterValidationErrors.quarter1}
											placeholder="YYYY-MM-DD"
										/>
									</div>
								</div>
								{#if quarterValidationErrors.quarter1}
									<div class="admin-settings-date-error">
										<span class="material-symbols-outlined">error</span>
										{quarterValidationErrors.quarter1}
									</div>
								{/if}
							</div>

							<!-- 2nd Quarter -->
							<div class="admin-settings-quarter-group quarter-2">
								<div class="admin-settings-quarter-header">
									<span class="admin-settings-quarter-label">2nd Quarter</span>
								</div>
								<div class="admin-settings-date-group">
									<div class="admin-settings-date-item">
										<label for="q2-start" class="admin-settings-date-label">Start</label>
										<input 
											id="q2-start"
											type="text" 
											bind:value={quarter2Start}
											class="admin-settings-date-input quarter-2-input"
											class:error={quarterValidationErrors.quarter2}
											placeholder="YYYY-MM-DD"
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q2-end" class="admin-settings-date-label">End</label>
										<input 
											id="q2-end"
											type="text" 
											bind:value={quarter2End}
											class="admin-settings-date-input quarter-2-input"
											class:error={quarterValidationErrors.quarter2}
											placeholder="YYYY-MM-DD"
										/>
									</div>
								</div>
								{#if quarterValidationErrors.quarter2}
									<div class="admin-settings-date-error">
										<span class="material-symbols-outlined">error</span>
										{quarterValidationErrors.quarter2}
									</div>
								{/if}
							</div>

							<!-- 3rd Quarter -->
							<div class="admin-settings-quarter-group quarter-3">
								<div class="admin-settings-quarter-header">
									<span class="admin-settings-quarter-label">3rd Quarter</span>
								</div>
								<div class="admin-settings-date-group">
									<div class="admin-settings-date-item">
										<label for="q3-start" class="admin-settings-date-label">Start</label>
										<input 
											id="q3-start"
											type="text" 
											bind:value={quarter3Start}
											class="admin-settings-date-input quarter-3-input"
											class:error={quarterValidationErrors.quarter3}
											placeholder="YYYY-MM-DD"
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q3-end" class="admin-settings-date-label">End</label>
										<input 
											id="q3-end"
											type="text" 
											bind:value={quarter3End}
											class="admin-settings-date-input quarter-3-input"
											class:error={quarterValidationErrors.quarter3}
											placeholder="YYYY-MM-DD"
										/>
									</div>
								</div>
								{#if quarterValidationErrors.quarter3}
									<div class="admin-settings-date-error">
										<span class="material-symbols-outlined">error</span>
										{quarterValidationErrors.quarter3}
									</div>
								{/if}
							</div>

							<!-- 4th Quarter -->
							<div class="admin-settings-quarter-group quarter-4">
								<div class="admin-settings-quarter-header">
									<span class="admin-settings-quarter-label">4th Quarter</span>
								</div>
								<div class="admin-settings-date-group">
									<div class="admin-settings-date-item">
										<label for="q4-start" class="admin-settings-date-label">Start</label>
										<input 
											id="q4-start"
											type="text" 
											bind:value={quarter4Start}
											class="admin-settings-date-input quarter-4-input"
											class:error={quarterValidationErrors.quarter4}
											placeholder="YYYY-MM-DD"
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q4-end" class="admin-settings-date-label">End</label>
										<input 
											id="q4-end"
											type="text" 
											bind:value={quarter4End}
											class="admin-settings-date-input quarter-4-input"
											class:error={quarterValidationErrors.quarter4}
											placeholder="YYYY-MM-DD"
										/>
									</div>
								</div>
								{#if quarterValidationErrors.quarter4}
									<div class="admin-settings-date-error">
										<span class="material-symbols-outlined">error</span>
										{quarterValidationErrors.quarter4}
									</div>
								{/if}
							</div>
						</div>
					</div>

					{#if dateValidationError}
						<div class="admin-settings-date-error">
							<span class="material-symbols-outlined">error</span>
							{dateValidationError}
						</div>
					{/if}
				</div>

				<div class="admin-settings-actions">
					<button 
						class="admin-settings-action-button admin-settings-primary" 
						onclick={handleDateChange}
						disabled={saving || loading || !!dateValidationError || 
								 quarterValidationErrors.quarter1 || 
								 quarterValidationErrors.quarter2 || 
								 quarterValidationErrors.quarter3 || 
								 quarterValidationErrors.quarter4 ||
								 !startDate || !endDate}
					>
						{#if saving}
							Saving...
						{:else}
							<span class="material-symbols-outlined">check</span>
							Apply Date Changes
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Account Security Section -->
	<div class="admin-settings-section">
		<div class="admin-settings-section-header">
			<h2 class="admin-settings-section-title">Account Security</h2>
			<p class="admin-settings-section-subtitle">Manage your account password and security settings</p>
		</div>
		
		<div class="admin-settings-card">
			<div class="admin-settings-card-content">
				<div class="admin-settings-item">
					<div class="admin-settings-item-info">
						<h3 class="admin-settings-item-label">Password</h3>
						<p class="admin-settings-item-description">Change your account password for security</p>
					</div>
					<div class="admin-settings-actions">
						<button 
							class="admin-settings-action-button admin-settings-primary" 
							onclick={handlePasswordChangeModal}
						>
							<span class="material-symbols-outlined">lock</span>
							Change Password
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>