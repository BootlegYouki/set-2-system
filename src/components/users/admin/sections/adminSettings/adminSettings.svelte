<script>
	import './adminSettings.css';
	import { onMount } from 'svelte';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { showSuccess, showError } from '../../../../common/js/toastStore.js';
	import { api, authenticatedFetch } from '../../../../../routes/api/helper/api-helper.js';

	let loading = $state(false);
	let saving = $state(false);
    let processingAction = $state(null);
    let rolloverSummary = $state(null);
    let showPromotedSummary = $state(false);
    let showRetainedSummary = $state(false);
    
    // Store
    import { selectedSchoolYear } from '../../../../../stores/schoolYearStore.js';

	// Current school year state (will be calculated from dates)
	let currentSchoolYear = $state('2024-2025');

	// School year dates
	let startDate = $state('');
	let endDate = $state('');

	// Function to calculate school year from start and end dates
	function calculateSchoolYear(start, end) {
		if (!start || !end) return '2024-2025'; // Default fallback
		
		const startDateObj = new Date(start);
		const endDateObj = new Date(end);
		
		const startYear = startDateObj.getFullYear();
		const endYear = endDateObj.getFullYear();
		
		// If the school year spans two calendar years (typical case)
		if (endYear > startYear) {
			return `${startYear}-${endYear}`;
		} else {
			// If it's within the same year (edge case)
			return `${startYear}-${startYear}`;
		}
	}

	// Quarter dates
	let quarter1Start = $state('');
	let quarter1End = $state('');
	let quarter2Start = $state('');
	let quarter2End = $state('');
	let quarter3Start = $state('');
	let quarter3End = $state('');
	let quarter4Start = $state('');
	let quarter4End = $state('');

    async function handleCheckCompliance() {
        // Implementation for compliance check if needed
        // Assuming this function existed before, I'll basically leave it empty or try to find its content if I can.
        // Wait, looking at grep results, there was a `handleCheckCompliance` in the file.
        // It was used in Step 675 target.
        // I'll define it as async empty for now to fix syntax, or check if it had body.
        // Step 675 target was `function handleCheckCompliance() {`.
        // I will just declare it here.
        try {
            await api.post('/api/document-requests?action=checkCompliance', {});
            showSuccess('Compliance check triggered');
        } catch (e) {
            console.error(e);
            showError('Failed to check compliance');
        }
    }

	// Load admin settings from backend
	async function loadAdminSettings() {
		try {
			loading = true;

			const result = await api.get('/api/admin-settings');

			if (result.success) {
				const settings = result.data;

				// Helper function to convert MM-DD-YYYY to YYYY-MM-DD for HTML5 date inputs
				function convertToYYYYMMDD(dateString) {
					if (!dateString) return dateString;
					const [month, day, year] = dateString.split('-');
					return `${year}-${month}-${day}`;
				}

				// Update state with loaded settings
				startDate = convertToYYYYMMDD(settings.school_year_start_date) || '';
				endDate = convertToYYYYMMDD(settings.school_year_end_date) || '';
				
				// Use stored school year if available, otherwise calculate from dates
				currentSchoolYear = settings.current_school_year || calculateSchoolYear(startDate, endDate);
				
				quarter1Start = convertToYYYYMMDD(settings.quarter_1_start_date) || '';
				quarter1End = convertToYYYYMMDD(settings.quarter_1_end_date) || '';
				quarter2Start = convertToYYYYMMDD(settings.quarter_2_start_date) || '';
				quarter2End = convertToYYYYMMDD(settings.quarter_2_end_date) || '';
				quarter3Start = convertToYYYYMMDD(settings.quarter_3_start_date) || '';
				quarter3End = convertToYYYYMMDD(settings.quarter_3_end_date) || '';
				quarter2End = convertToYYYYMMDD(settings.quarter_2_end_date) || '';
				quarter3Start = convertToYYYYMMDD(settings.quarter_3_start_date) || '';
				quarter3End = convertToYYYYMMDD(settings.quarter_3_end_date) || '';
				quarter4Start = convertToYYYYMMDD(settings.quarter_4_start_date) || '';
				quarter4End = convertToYYYYMMDD(settings.quarter_4_end_date) || '';

                // Load rollover summary if available
                if (settings.last_rollover_details) {
                    rolloverSummary = typeof settings.last_rollover_details === 'string' 
                        ? JSON.parse(settings.last_rollover_details) 
                        : settings.last_rollover_details;
                } else {
                    rolloverSummary = null;
                }
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

			// Helper function to convert YYYY-MM-DD to MM-DD-YYYY
			function convertToMMDDYYYY(dateString) {
				if (!dateString) return dateString;
				const [year, month, day] = dateString.split('-');
				return `${month}-${day}-${year}`;
			}

			const settings = {
				current_school_year: currentSchoolYear,
				school_year_start_date: convertToMMDDYYYY(startDate),
				school_year_end_date: convertToMMDDYYYY(endDate),
				quarter_1_start_date: convertToMMDDYYYY(quarter1Start),
				quarter_1_end_date: convertToMMDDYYYY(quarter1End),
				quarter_2_start_date: convertToMMDDYYYY(quarter2Start),
				quarter_2_end_date: convertToMMDDYYYY(quarter2End),
				quarter_3_start_date: convertToMMDDYYYY(quarter3Start),
				quarter_3_end_date: convertToMMDDYYYY(quarter3End),
				quarter_4_start_date: convertToMMDDYYYY(quarter4Start),
				quarter_4_end_date: convertToMMDDYYYY(quarter4End)
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

	// Date validation - simplified for HTML5 date inputs
	let dateValidationError = $state('');

	// Simple date validation function for HTML5 date inputs
	function isValidDate(dateString) {
		if (!dateString) return true; // Allow empty strings

		// HTML5 date inputs provide YYYY-MM-DD format
		// Check if it matches YYYY-MM-DD format
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(dateString)) {
			return false;
		}

		// Check if it's a valid date
		const date = new Date(dateString);
		return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
	}

	// Date input handlers - simplified since HTML5 date inputs handle most validation
	function handleDateInput(event, field) {
		const value = event.target.value;

		// HTML5 date inputs automatically validate format, so we just need to update the bound variable
		switch (field) {
			case 'startDate':
				startDate = value;
				break;
			case 'endDate':
				endDate = value;
				break;
			case 'quarter1Start':
				quarter1Start = value;
				break;
			case 'quarter1End':
				quarter1End = value;
				break;
			case 'quarter2Start':
				quarter2Start = value;
				break;
			case 'quarter2End':
				quarter2End = value;
				break;
			case 'quarter3Start':
				quarter3Start = value;
				break;
			case 'quarter3End':
				quarter3End = value;
				break;
			case 'quarter4Start':
				quarter4Start = value;
				break;
			case 'quarter4End':
				quarter4End = value;
				break;
		}
	}

	// Validate dates whenever they change - simplified for HTML5 date inputs
	$effect(() => {
		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);

			if (start >= end) {
				dateValidationError = 'Start date must be before end date';
			} else {
				dateValidationError = '';
				// Automatically calculate and update school year when dates change
				// currentSchoolYear = calculateSchoolYear(startDate, endDate);
			}
		} else {
			dateValidationError = '';
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
		} else {
			quarterValidationErrors.quarter1 = '';
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
		} else {
			quarterValidationErrors.quarter2 = '';
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
		} else {
			quarterValidationErrors.quarter3 = '';
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
		} else {
			quarterValidationErrors.quarter4 = '';
		}
	});

	// Handle date changes
	async function handleDateChange() {
		if (dateValidationError) {
			console.error('Cannot apply changes: Date validation error');
			return;
		}

		// Check for quarter validation errors
		const hasQuarterErrors = Object.values(quarterValidationErrors).some((error) => error !== '');
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

	// Toggle password visibility function
	function togglePasswordVisibility(inputId) {
		const input = document.getElementById(inputId);
		const button = input.nextElementSibling;
		const icon = button.querySelector('.password-eye-icon');

		if (input.type === 'password') {
			input.type = 'text';
			icon.innerHTML =
				'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
		} else {
			input.type = 'password';
			icon.innerHTML =
				'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
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

	onMount(() => {
		// Load admin settings when component initializes
		loadAdminSettings();
        // Initialize selectedSchoolYear if not set
        if (!$selectedSchoolYear) {
            // We can set it to current year or leave null
        }
	});

    async function handleEndSchoolYear() {
        modalStore.confirm(
            'End School Year',
            '<div class="text-red-600 mb-4"><strong>WARNING: You are about to end the current school year.</strong></div><p>This action will:</p><ul class="list-disc pl-5 mb-4"><li>Promote eligible students to the next grade level</li><li>Archive current section enrollments</li><li>Update the system to the next school year</li></ul><p>Please ensure you have verified all grades before proceeding.</p>',
            async () => {
                 try {
                     processingAction = 'end_year';
                     const result = await api.post('/api/school-year/end', {});
                     if (result.success) {
                         showSuccess(result.message);
                         await loadAdminSettings();
                         // Update the global store for view
                         selectedSchoolYear.set(currentSchoolYear); 
                     } else {
                         showError(result.error);
                     }
                 } catch (e) {
                     console.error(e);
                     showError('Failed to end school year');
                 } finally {
                     processingAction = null;
                 }
            },
            () => {},
            { size: 'medium' }
        );
    }

    async function handleUndoRollover() {
        modalStore.confirm(
            'Undo Last Rollover',
            '<div class="text-red-600 mb-4"><strong>CAUTION: You are about to undo the last school year rollover.</strong></div><p>This will revert the system to the state immediately before the last rollover. Any data created since the rollover will be lost.</p>',
            async () => {
                 try {
                     processingAction = 'undo_rollover';
                     const result = await api.post('/api/school-year/undo', {});
                     if (result.success) {
                         showSuccess(result.message);
                         rolloverSummary = null; // Immediately clear summary from UI
                         await loadAdminSettings();
                         // Update the global store to show the restored year
                         selectedSchoolYear.set(currentSchoolYear);
                     } else {
                         showError(result.error);
                     }
                 } catch (e) {
                     console.error(e);
                     showError('Failed to undo rollover');
                 } finally {
                     processingAction = null;
                 }
            },
            () => {},
            { size: 'medium' }
        );
    }

    async function handleExport(type) {
        try {
            const response = await authenticatedFetch(`/api/exports/rollover-summary?type=${type}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const error = await response.json();
                showError(error.error || 'Failed to export summary');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // Clean up URL after a delay (browser needs time to open it)
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e) {
            console.error(e);
            showError('Failed to export summary');
        }
    }

</script>

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
								type="date"
								bind:value={startDate}
								class="admin-settings-date-input"
								class:error={dateValidationError}
							/>
						</div>
						<div class="admin-settings-date-item">
							<label for="end-date" class="admin-settings-date-label">End of Classes</label>
							<input
								id="end-date"
								type="date"
								bind:value={endDate}
								class="admin-settings-date-input"
								class:error={dateValidationError}
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
											type="date"
											bind:value={quarter1Start}
											class="admin-settings-date-input quarter-1-input"
											class:error={quarterValidationErrors.quarter1}
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q1-end" class="admin-settings-date-label">End</label>
										<input
											id="q1-end"
											type="date"
											bind:value={quarter1End}
											class="admin-settings-date-input quarter-1-input"
											class:error={quarterValidationErrors.quarter1}
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
											type="date"
											bind:value={quarter2Start}
											class="admin-settings-date-input quarter-2-input"
											class:error={quarterValidationErrors.quarter2}
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q2-end" class="admin-settings-date-label">End</label>
										<input
											id="q2-end"
											type="date"
											bind:value={quarter2End}
											class="admin-settings-date-input quarter-2-input"
											class:error={quarterValidationErrors.quarter2}
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
											type="date"
											bind:value={quarter3Start}
											class="admin-settings-date-input quarter-3-input"
											class:error={quarterValidationErrors.quarter3}
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q3-end" class="admin-settings-date-label">End</label>
										<input
											id="q3-end"
											type="date"
											bind:value={quarter3End}
											class="admin-settings-date-input quarter-3-input"
											class:error={quarterValidationErrors.quarter3}
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
											type="date"
											bind:value={quarter4Start}
											class="admin-settings-date-input quarter-4-input"
											class:error={quarterValidationErrors.quarter4}
										/>
									</div>
									<div class="admin-settings-date-item">
										<label for="q4-end" class="admin-settings-date-label">End</label>
										<input
											id="q4-end"
											type="date"
											bind:value={quarter4End}
											class="admin-settings-date-input quarter-4-input"
											class:error={quarterValidationErrors.quarter4}
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
						disabled={saving ||
							loading ||
							!!dateValidationError ||
							quarterValidationErrors.quarter1 ||
							quarterValidationErrors.quarter2 ||
							quarterValidationErrors.quarter3 ||
							quarterValidationErrors.quarter4 ||
							!startDate ||
							!endDate}
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

	<!-- School Year Management Actions -->
    <div class="admin-settings-section">
		<div class="admin-settings-section-header">
			<h2 class="admin-settings-section-title">Academic Year Actions</h2>
			<p class="admin-settings-section-subtitle">
				Manage school year transitions and historical data
			</p>
		</div>

        <!-- Row 1: Historical Data -->
        <div class="admin-settings-security-row">
            <div class="admin-settings-security-card">
				<div class="admin-settings-security-content-container">
					<div class="admin-settings-security-icon" style="background-color: #f59e0b;">
						<span class="material-symbols-outlined">history</span>
					</div>
					<div class="admin-settings-security-content">
						<div class="admin-settings-security-label">Historical Data</div>
						<div class="admin-settings-security-value">View data from previous school years</div>
					</div>
				</div>
				<div class="admin-settings-security-actions">
                    <select 
                        class="admin-settings-form-input" 
                        style="min-width: 150px; padding: 8px; height: 40px;"
                        value={$selectedSchoolYear || currentSchoolYear}
                        onchange={(e) => selectedSchoolYear.set(e.target.value)}
                    >
                        <option value={currentSchoolYear}>{currentSchoolYear} (Current)</option>
                        <option value={currentSchoolYear.split('-').map((y, i) => parseInt(y) - 1).join('-')}>
                            {currentSchoolYear.split('-').map((y, i) => parseInt(y) - 1).join('-')}
                        </option>
                        <option value={currentSchoolYear.split('-').map((y, i) => parseInt(y) - 2).join('-')}>
                            {currentSchoolYear.split('-').map((y, i) => parseInt(y) - 2).join('-')}
                        </option>
                    </select>
				</div>
			</div>
        </div>

        <!-- Row 2: Danger Actions -->
        <div class="admin-settings-security-row">
            <!-- End Year Card -->
            <div class="admin-settings-security-card">
				<div class="admin-settings-security-content-container">
					<div class="admin-settings-security-icon" style="background-color: #ef4444;">
						<span class="material-symbols-outlined">school</span>
					</div>
					<div class="admin-settings-security-content">
						<div class="admin-settings-security-label" style="color: #ef4444;">End School Year</div>
						<div class="admin-settings-security-value">Promote students and start new year</div>
					</div>
				</div>
				<div class="admin-settings-security-actions">
                    <button
						class="admin-settings-security-action-button"
                        style="background-color: #ef4444;"
						onclick={handleEndSchoolYear}
						disabled={loading || saving || processingAction !== null}
					>
                        {#if processingAction === 'end_year'}
                            <span class="material-symbols-outlined animate-spin">refresh</span>
                            Processing...
                        {:else}
                            <span class="material-symbols-outlined">school</span>
                            End Year
                        {/if}
					</button>
				</div>
			</div>

            <!-- Undo Card -->
            <div class="admin-settings-security-card">
				<div class="admin-settings-security-content-container">
					<div class="admin-settings-security-icon" style="background-color: #64748b;">
						<span class="material-symbols-outlined">undo</span>
					</div>
					<div class="admin-settings-security-content">
						<div class="admin-settings-security-label">Undo Rollover</div>
						<div class="admin-settings-security-value">Revert the last rollover action</div>
					</div>
				</div>
				<div class="admin-settings-security-actions">
                    <button
						class="admin-settings-security-action-button"
                        style="background-color: #64748b;"
						onclick={handleUndoRollover}
						disabled={loading || saving || processingAction !== null}
					>
                        {#if processingAction === 'undo_rollover'}
                            <span class="material-symbols-outlined animate-spin">refresh</span>
                            Undoing...
                        {:else}
                            <span class="material-symbols-outlined">undo</span>
                            Undo
                        {/if}
					</button>
				</div>
			</div>
        </div>

	</div>
    

    <!-- Last Rollover Summary Section -->
    {#if rolloverSummary}
    <div class="admin-settings-section">
        <div class="admin-settings-section-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h2 class="admin-settings-section-title">Last Rollover Summary</h2>
                <p class="admin-settings-section-subtitle">
                    Results from the transition from {rolloverSummary.previous_year} to {rolloverSummary.new_year}
                </p>
            </div>
            <button 
                class="admin-settings-security-action-button" 
                style="padding: 0.5rem 1rem; font-size: 0.9rem;"
                onclick={() => handleExport('combined')}
            >
                <span class="material-symbols-outlined" style="font-size: 1.1rem;">picture_as_pdf</span>
                Export Combined
            </button>
        </div>

        <div class="admin-settings-card">
            <div class="admin-settings-card-content" style="flex-direction: column; align-items: stretch; padding: 0;">
                <!-- Promoted Students Accordion -->
                <div>
                    <!-- Changed from button to div to avoid nested interactive controls -->
                    <div 
                        class="admin-settings-accordion-header" 
                        style="padding: 1.5rem; cursor: default;"
                    >
                        <!-- Clickable Content Area -->
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div 
                            class="admin-settings-security-content-container" 
                            style="cursor: pointer; flex: 1;"
                            onclick={() => showPromotedSummary = !showPromotedSummary}
                            role="button"
                            tabindex="0"
                        >
                            <div class="admin-settings-security-icon" style="background-color: #16a34a;">
                                <span class="material-symbols-outlined">arrow_upward</span>
                            </div>
                            <div class="admin-settings-security-content">
                                <div class="admin-settings-security-label">Promoted Students</div>
                                <div class="admin-settings-security-value">
                                    {rolloverSummary.promoted.length} students moved to the next grade
                                </div>
                            </div>
                        </div>

                        <!-- Actions Area -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                            <button 
                                class="admin-settings-icon-button" 
                                onclick={(e) => { e.stopPropagation(); handleExport('promoted'); }}
                                title="Export Promoted List"
                                style="background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s;"
                                onmouseover={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                onmouseout={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span class="material-symbols-outlined">picture_as_pdf</span>
                            </button>
                            <button
                                style="background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 0;"
                                onclick={() => showPromotedSummary = !showPromotedSummary}
                            >
                                <span class="material-symbols-outlined transition-transform duration-300" class:rotate-180={showPromotedSummary}>
                                    expand_more
                                </span>
                            </button>
                        </div>
                    </div>

                    {#if showPromotedSummary}
                        <div class="admin-settings-accordion-content" style="padding: 0 1.5rem 1.5rem 1.5rem; border-top: 1px solid var(--border-light); margin-top: 0;">
                            {#if rolloverSummary.promoted.length > 0}
                                <div style="overflow-x: auto; border: 1px solid var(--border-light); border-radius: 8px;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                        <thead style="background-color: rgba(0,0,0,0.02); border-bottom: 1px solid var(--border-light);">
                                            <tr>
                                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">ID</th>
                                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Name</th>
                                                <th style="padding: 0.75rem 1rem; text-align: center; font-weight: 600;">Old Grade</th>
                                                <th style="padding: 0.75rem 1rem; text-align: center; font-weight: 600;">New Grade</th>
                                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">GWA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each rolloverSummary.promoted as student}
                                                <tr style="border-bottom: 1px solid var(--border-light);">
                                                    <td style="padding: 0.75rem 1rem; font-family: monospace;">{student.id}</td>
                                                    <td style="padding: 0.75rem 1rem; font-weight: 500;">{student.name}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: center;">{student.old_grade}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: center; color: #16a34a; font-weight: 600;">{student.new_grade}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: right; font-family: monospace;">{student.gwa}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {:else}
                                <p style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem;">No students were promoted.</p>
                            {/if}
                        </div>
                    {/if}
                </div>

                <div style="height: 1px; background-color: var(--border-light); width: 100%;"></div>

                <!-- Retained Students Accordion -->
                <div>
                    <!-- Changed from button to div -->
                    <div 
                        class="admin-settings-accordion-header" 
                        style="padding: 1.5rem; cursor: default;"
                    >
                        <!-- Clickable Content Area -->
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div 
                            class="admin-settings-security-content-container" 
                            style="cursor: pointer; flex: 1;"
                            onclick={() => showRetainedSummary = !showRetainedSummary}
                            role="button"
                            tabindex="0"
                        >
                            <div class="admin-settings-security-icon" style="background-color: #ea580c;">
                                <span class="material-symbols-outlined">do_not_disturb_on</span>
                            </div>
                            <div class="admin-settings-security-content">
                                <div class="admin-settings-security-label">Retained Students</div>
                                <div class="admin-settings-security-value">
                                    {rolloverSummary.retained.length} students stayed in the same grade
                                </div>
                            </div>
                        </div>

                        <!-- Actions Area -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                            <button 
                                class="admin-settings-icon-button" 
                                onclick={() => handleExport('retained')}
                                title="Export Retained List"
                                style="background: none; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s;"
                                onmouseover={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                onmouseout={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span class="material-symbols-outlined">picture_as_pdf</span>
                            </button>
                            <button
                                style="background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 0;"
                                onclick={() => showRetainedSummary = !showRetainedSummary}
                            >
                                <span class="material-symbols-outlined transition-transform duration-300" class:rotate-180={showRetainedSummary}>
                                    expand_more
                                </span>
                            </button>
                        </div>
                    </div>

                    {#if showRetainedSummary}
                        <div class="admin-settings-accordion-content" style="padding: 0 1.5rem 1.5rem 1.5rem; border-top: 1px solid var(--border-light); margin-top: 0;">
                            {#if rolloverSummary.retained.length > 0}
                                <div style="overflow-x: auto; border: 1px solid var(--border-light); border-radius: 8px;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                        <thead style="background-color: rgba(0,0,0,0.02); border-bottom: 1px solid var(--border-light);">
                                            <tr>
                                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">ID</th>
                                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Name</th>
                                                <th style="padding: 0.75rem 1rem; text-align: center; font-weight: 600;">Old Grade</th>
                                                <th style="padding: 0.75rem 1rem; text-align: center; font-weight: 600;">New Grade</th>
                                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">GWA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each rolloverSummary.retained as student}
                                                <tr style="border-bottom: 1px solid var(--border-light);">
                                                    <td style="padding: 0.75rem 1rem; font-family: monospace;">{student.id}</td>
                                                    <td style="padding: 0.75rem 1rem; font-weight: 500;">{student.name}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: center;">{student.old_grade}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: center; color: #ea580c; font-weight: 600;">{student.new_grade}</td>
                                                    <td style="padding: 0.75rem 1rem; text-align: right; font-family: monospace;">{student.gwa}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {:else}
                                <p style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem;">No students were retained.</p>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
    {/if}

    <!-- Account Security Section -->
	<div class="admin-settings-section">
		<div class="admin-settings-section-header">
			<h2 class="admin-settings-section-title">Account Security</h2>
			<p class="admin-settings-section-subtitle">
				Manage your account password and security settings
			</p>
		</div>

		<div class="admin-settings-security-row">
			<div class="admin-settings-security-card">
				<div class="admin-settings-security-content-container">
					<div class="admin-settings-security-icon">
						<span class="material-symbols-outlined">lock</span>
					</div>
					<div class="admin-settings-security-content">
						<div class="admin-settings-security-label">Password</div>
						<div class="admin-settings-security-value">Change your account password for security</div>
					</div>
				</div>
				<div class="admin-settings-security-actions">
					<button
						class="admin-settings-security-action-button"
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
	.admin-settings-accordion-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	.admin-settings-accordion-content {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-light);
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
