<script>
	import './adminSettings.css';
	import { onMount } from 'svelte';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { showSuccess, showError } from '../../../../common/js/toastStore.js';

	// Current school year state
	let currentSchoolYear = $state('2024-2025');
	let newSchoolYear = $state('');
	let previousSchoolYear = $state(null);
	let canUndo = $state(false);

	// School year dates
	let startDate = $state('2024-08-15');
	let endDate = $state('2025-05-31');

	// Quarter dates
	let quarter1Start = $state('2024-08-15');
	let quarter1End = $state('2024-10-31');
	let quarter2Start = $state('2024-11-01');
	let quarter2End = $state('2025-01-31');
	let quarter3Start = $state('2025-02-01');
	let quarter3End = $state('2025-04-15');
	let quarter4Start = $state('2025-04-16');
	let quarter4End = $state('2025-05-31');

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
	function handleDateChange() {
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

		console.log('Applying date changes:', {
			schoolYear: { startDate, endDate },
			quarters: {
				quarter1: { start: quarter1Start, end: quarter1End },
				quarter2: { start: quarter2Start, end: quarter2End },
				quarter3: { start: quarter3Start, end: quarter3End },
				quarter4: { start: quarter4Start, end: quarter4End }
			}
		});
		// TODO: Implement actual date saving logic
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

	// Handle password change button click
	function handlePasswordChangeModal() {
		const passwordFormContent = `
			<div class="admin-settings-password-form">
				<div class="admin-settings-form-group">
					<label for="current-password">Current Password</label>
					<input 
						id="current-password"
						type="password" 
						placeholder="Enter current password"
						class="admin-settings-form-input"
					/>
				</div>
				
				<div class="admin-settings-form-group">
					<label for="new-password">New Password</label>
					<input 
						id="new-password"
						type="password" 
						placeholder="Enter new password"
						class="admin-settings-form-input"
					/>
				</div>
				
				<div class="admin-settings-form-group">
					<label for="confirm-password">Confirm New Password</label>
					<input 
						id="confirm-password"
						type="password" 
						placeholder="Confirm new password"
						class="admin-settings-form-input"
					/>
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
		if (newPassword !== confirmPassword) {
			showError('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			showError('Password must be at least 8 characters long');
			return;
		}

		try {
			passwordLoading = true;
			
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Reset form
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			showPasswordModal = false;
			
			showSuccess('Password changed successfully!');
		} catch (error) {
			showError('Failed to change password');
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
		// Initialize component
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
						disabled={!!dateValidationError || 
								 quarterValidationErrors.quarter1 || 
								 quarterValidationErrors.quarter2 || 
								 quarterValidationErrors.quarter3 || 
								 quarterValidationErrors.quarter4 ||
								 !startDate || !endDate}
					>
						<span class="material-symbols-outlined">check</span>
						Apply Date Changes
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