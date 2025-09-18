<script>
	import './adminAccountCreation.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { onMount } from 'svelte';

	// Account creation state
	let isCreating = false;
	let selectedAccountType = '';
	let selectedGender = '';
	let selectedSubject = '';
	let firstName = '';
	let lastName = '';
	let middleInitial = '';
	let email = '';

	// Custom dropdown state
	let isDropdownOpen = false;
	let isGenderDropdownOpen = false;
	let isSubjectDropdownOpen = false;

	// Edit account state
	let editingAccountId = null;
	let editFirstName = '';
	let editLastName = '';
	let editMiddleInitial = '';
	let isUpdating = false;

	// Account types
	const accountTypes = [
		{ id: 'student', name: 'Student Account', description: 'Create a new student account', icon: 'school' },
		{ id: 'teacher', name: 'Teacher Account', description: 'Create a new teacher account', icon: 'person' },
		{ id: 'admin', name: 'Admin Account', description: 'Create a new admin account', icon: 'admin_panel_settings' }
	];

	// Gender options
	const genderOptions = [
		{ id: 'male', name: 'Male', icon: 'male' },
		{ id: 'female', name: 'Female', icon: 'female' }
	];

	// Subject options for teachers (loaded from database)
	let subjectOptions = [];
	let isLoadingSubjects = false;

	// Recent account creations (loaded from database)
	let recentAccounts = [];
	let isLoadingAccounts = false;

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
			isGenderDropdownOpen = false;
			isSubjectDropdownOpen = false;
		}
	}

	// Handle account removal with modal confirmation
	async function handleRemoveAccount(account) {
		modalStore.confirm(
			'Remove Account',
			`<p>Are you sure you want to remove the account for <strong>"${account.name}"</strong>?</p>`,
			async () => {
				try {
					// Call the DELETE API endpoint
					const response = await fetch('/api/accounts', {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ id: account.id })
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || 'Failed to delete account');
					}

					// Remove the account from the array
					recentAccounts = recentAccounts.filter(a => a.id !== account.id);
					
					// Show success toast
					toastStore.success(`Account for "${account.name}" has been removed successfully`);
				} catch (error) {
					console.error('Error deleting account:', error);
					toastStore.error(`Failed to delete account: ${error.message}`);
				}
			},
			() => {
				// Do nothing on cancel
			},
			{ size: 'small' }
		);
	}

	// Edit account functions
	function toggleEditForm(account) {
		if (editingAccountId === account.id) {
			// Close the form
			editingAccountId = null;
			editFirstName = '';
			editLastName = '';
			editMiddleInitial = '';
		} else {
			// Open the form and populate with current values
			editingAccountId = account.id;
			// Use the individual fields from the API response if available
			if (account.firstName && account.lastName) {
				editFirstName = account.firstName;
				editLastName = account.lastName;
				editMiddleInitial = account.middleInitial || '';
			} else {
				// Fallback: Parse the name (assuming format: "LastName, FirstName M.I." or "LastName, FirstName")
				const nameParts = account.name.split(', ');
				if (nameParts.length >= 2) {
					editLastName = nameParts[0];
					const firstNamePart = nameParts[1];
					// Check if there's a middle initial
					const firstNameParts = firstNamePart.split(' ');
					editFirstName = firstNameParts[0];
					if (firstNameParts.length > 1 && firstNameParts[1].endsWith('.')) {
						editMiddleInitial = firstNameParts[1].replace('.', '');
					} else {
						editMiddleInitial = '';
					}
				}
			}
		}
	}

	async function handleEditAccount() {
		if (!editFirstName || !editLastName) {
			toastStore.error('Please fill in all required fields.');
			return;
		}

		isUpdating = true;

		try {
			const response = await fetch('/api/accounts', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: editingAccountId,
					firstName: editFirstName.trim(),
					lastName: editLastName.trim(),
					middleInitial: editMiddleInitial ? editMiddleInitial.trim() : null
				})
			});

			const result = await response.json();

			if (result.success) {
				// Update account in the array with the response data
				recentAccounts = recentAccounts.map(account => {
					if (account.id === editingAccountId) {
						return result.account;
					}
					return account;
				});

				// Show success toast
				toastStore.success(result.message);

				// Close edit form
				editingAccountId = null;
				editFirstName = '';
				editLastName = '';
				editMiddleInitial = '';
			} else {
				toastStore.error(result.error || 'Failed to update account');
			}

		} catch (error) {
			console.error('Error updating account:', error);
			toastStore.error('Failed to update account. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Toggle dropdown
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	// Select account type and close dropdown
	function selectAccountType(type) {
		selectedAccountType = type.id;
		isDropdownOpen = false;
		// Clear subject selection when switching account types
		if (type.id !== 'teacher') {
			selectedSubject = '';
		}
	}

	// Toggle gender dropdown
	function toggleGenderDropdown() {
		isGenderDropdownOpen = !isGenderDropdownOpen;
	}

	// Select gender and close dropdown
	function selectGender(gender) {
		selectedGender = gender.id;
		isGenderDropdownOpen = false;
	}

	// Toggle subject dropdown
	function toggleSubjectDropdown() {
		isSubjectDropdownOpen = !isSubjectDropdownOpen;
	}

	// Select subject and close dropdown
	function selectSubject(subject) {
		selectedSubject = subject.id;
		isSubjectDropdownOpen = false;
	}

	// Handle form submission
	async function handleCreateAccount() {
		if (!selectedAccountType || !selectedGender || !firstName || !lastName) {
			toastStore.error('Please fill in all required fields.');
			return;
		}

		// Check if student or teacher account requires email
		if ((selectedAccountType === 'student' || selectedAccountType === 'teacher') && !email) {
			toastStore.error('Please enter an email address.');
			return;
		}

		// Check if teacher account requires subject selection
		if (selectedAccountType === 'teacher' && !selectedSubject) {
			toastStore.error('Please select a subject for the teacher account.');
			return;
		}

		isCreating = true;

		try {
			// Call API to create account
			const response = await fetch('/api/accounts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					accountType: selectedAccountType,
					gender: selectedGender,
					subjectId: selectedSubject,
					firstName,
					lastName,
					middleInitial,
					email
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create account');
			}

			// Add to recent accounts
			recentAccounts = [data.account, ...recentAccounts];

			// Show success toast
			const accountTypeLabel = selectedAccountType === 'student' ? 'Student' : selectedAccountType === 'teacher' ? 'Teacher' : 'Admin';
			toastStore.success(`${accountTypeLabel} account created successfully for ${data.account.full_name}! Password is the same as account number: ${data.account.account_number}`);

			// Reset form
			selectedAccountType = '';
			selectedGender = '';
			selectedSubject = '';
			firstName = '';
			lastName = '';
			middleInitial = '';
			email = '';

		} catch (error) {
			console.error('Error creating account:', error);
			toastStore.error(error.message || 'Failed to create account. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Get selected account type object
	$: selectedTypeObj = accountTypes.find(type => type.id === selectedAccountType);

	// Get selected gender object
	$: selectedGenderObj = genderOptions.find(gender => gender.id === selectedGender);

	// Get selected subject object
	$: selectedSubjectObj = subjectOptions.find(subject => subject.id === selectedSubject);

	// Generate next account number for the selected type
	function getNextAccountNumber(accountType) {
		const prefix = accountType === 'student' ? 'STU' : accountType === 'teacher' ? 'TCH' : 'ADM';
		const filteredAccounts = recentAccounts.filter(account => 
			account.number && account.number.startsWith(prefix)
		);
		
		if (filteredAccounts.length === 0) {
			return `${prefix}-2024-001`;
		}
		
		// Extract numbers and find the highest
		const numbers = filteredAccounts.map(account => {
			const match = account.number.match(/-([0-9]+)$/);
			return match ? parseInt(match[1]) : 0;
		});
		
		const nextNumber = Math.max(...numbers) + 1;
		return `${prefix}-2024-${nextNumber.toString().padStart(3, '0')}`;
	}

	// Load subjects from database
	async function loadSubjects() {
		isLoadingSubjects = true;
		try {
			const response = await fetch('/api/subjects');
			if (!response.ok) {
				throw new Error('Failed to load subjects');
			}
			const data = await response.json();
			
			// Format subjects for the dropdown (include year level and code)
			subjectOptions = data.data.map(subject => ({
				id: subject.id,
				name: subject.name,
				code: subject.code,
				gradeLevel: subject.gradeLevel,
				displayName: `${subject.name} (${subject.code}) - ${subject.gradeLevel}`
			}));
		} catch (error) {
			console.error('Error loading subjects:', error);
			toastStore.error('Failed to load subjects');
		} finally {
			isLoadingSubjects = false;
		}
	}

	// Load existing accounts from database
	async function loadAccounts() {
		isLoadingAccounts = true;
		try {
			const response = await fetch('/api/accounts');
			if (!response.ok) {
				throw new Error('Failed to load accounts');
			}
			const data = await response.json();
			
			// API already returns data in the correct format
			recentAccounts = data.accounts;
		} catch (error) {
			console.error('Error loading accounts:', error);
			toastStore.error('Failed to load existing accounts');
		} finally {
			isLoadingAccounts = false;
		}
	}

	// Load accounts and subjects when component mounts
	onMount(() => {
		loadAccounts();
		loadSubjects();
	});
</script>

<svelte:window on:click={handleClickOutside} />

<div class="account-creation-container">
	<!-- Header -->
	<div class="account-header">
		<div class="header-content">
			<h1 class="page-title">Account Creation</h1>
			<p class="page-subtitle">Create new student, teacher, and admin accounts for the system</p>
		</div>
	</div>

	<!-- Account Creation Form -->
	<div class="creation-form-section">
		<div class="account-section-header">
			<h2 class="section-title">Create New Account</h2>
			<p class="section-subtitle">Fill in the details below to create a new account</p>
		</div>

		<div class="form-container">
			<form on:submit|preventDefault={handleCreateAccount}>
				<!-- Account Type and Gender Selection Row -->
				<div class="account-type-gender-row">
					<!-- Account Type Selection -->
					<div class="form-group">
						<label class="form-label" for="account-type">Account Type *</label>
						<div class="custom-dropdown" class:open={isDropdownOpen}>
							<button 
								type="button"
								class="dropdown-trigger" 
								class:selected={selectedAccountType}
								on:click={toggleDropdown}
								id="account-type"
							>
								{#if selectedTypeObj}
									<div class="selected-option">
										<span class="material-symbols-outlined option-icon">{selectedTypeObj.icon}</span>
										<div class="option-content">
											<span class="option-name">{selectedTypeObj.name}</span>
											<span class="option-description">{selectedTypeObj.description}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">Select account type</span>
								{/if}
								<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
							</button>
							<div class="dropdown-menu">
								{#each accountTypes as type (type.id)}
									<button 
										type="button"
										class="dropdown-option" 
										class:selected={selectedAccountType === type.id}
										on:click={() => selectAccountType(type)}
									>
										<span class="material-symbols-outlined option-icon">{type.icon}</span>
										<div class="option-content">
											<span class="option-name">{type.name}</span>
											<span class="option-description">{type.description}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Gender Selection -->
					<div class="form-group">
						<label class="form-label" for="gender">Gender *</label>
						<div class="custom-dropdown" class:open={isGenderDropdownOpen}>
							<button 
								type="button"
								class="dropdown-trigger" 
								class:selected={selectedGender}
								on:click={toggleGenderDropdown}
								id="gender"
							>
								{#if selectedGenderObj}
									<div class="selected-option">
										<span class="material-symbols-outlined option-icon">{selectedGenderObj.icon}</span>
										<div class="option-content">
											<span class="option-name">{selectedGenderObj.name}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">Select gender</span>
								{/if}
								<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
							</button>
							<div class="dropdown-menu">
								{#each genderOptions as gender (gender.id)}
									<button 
										type="button"
										class="dropdown-option" 
										class:selected={selectedGender === gender.id}
										on:click={() => selectGender(gender)}
									>
										<span class="material-symbols-outlined option-icon">{gender.icon}</span>
										<div class="option-content">
											<span class="option-name">{gender.name}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Subject Selection (only for teachers) -->
					{#if selectedAccountType === 'teacher'}
						<div class="form-group">
							<label class="form-label" for="subject">Subject *</label>
							<div class="custom-dropdown" class:open={isSubjectDropdownOpen}>
								<button 
									type="button"
									class="dropdown-trigger" 
									class:selected={selectedSubject}
									on:click={toggleSubjectDropdown}
									id="subject"
								>
									{#if selectedSubjectObj}
										<div class="selected-option">
											<div class="option-content">
												<span class="option-name">{selectedSubjectObj.displayName}</span>
											</div>
										</div>
									{:else}
										<span class="placeholder">Select subject</span>
									{/if}
									<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
								</button>
								<div class="dropdown-menu">
									{#each subjectOptions as subject (subject.id)}
										<button 
											type="button"
											class="dropdown-option" 
											class:selected={selectedSubject === subject.id}
											on:click={() => selectSubject(subject)}
										>
											<div class="option-content">
												<span class="option-name">{subject.displayName}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Name Fields -->
				<div class="name-fields-row">
					<div class="form-group">
						<label class="form-label" for="last-name">Last Name *</label>
						<input 
							type="text" 
							id="last-name"
							class="form-input" 
							bind:value={lastName}
							placeholder="Enter last name"
							required
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="first-name">First Name *</label>
						<input 
							type="text" 
							id="first-name"
							class="form-input" 
							bind:value={firstName}
							placeholder="Enter first name"
							required
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="middle-initial">M.I.</label>
						<input 
							type="text" 
							id="middle-initial"
							class="form-input" 
							bind:value={middleInitial}
							placeholder="M"
							maxlength="1"
							style="text-transform: uppercase;"
						/>
					</div>
				</div>

				<!-- Email Field (for students and teachers only) -->
				{#if selectedAccountType === 'student' || selectedAccountType === 'teacher'}
					<div class="form-group">
						<label class="form-label" for="email">Email Address *</label>
						<input 
							type="email" 
							id="email"
							class="form-input" 
							bind:value={email}
							placeholder="Enter email address"
							required
						/>
					</div>
				{/if}

				<!-- Account Number Info -->
				<div class="form-group">
					<div class="form-label">
						{selectedAccountType === 'student' ? 'Student Number' : selectedAccountType === 'teacher' ? 'Teacher Number' : selectedAccountType === 'admin' ? 'Admin Number' : 'Account Number'}
					</div>
					<div class="number-display">
						{#if selectedAccountType}
							<span class="auto-number">{getNextAccountNumber(selectedAccountType)}</span>
							<span class="auto-label">(Auto-generated)</span>
						{:else}
							<span class="placeholder-number">Select account type first</span>
						{/if}
					</div>
					<p class="form-help">Account number will be automatically assigned. Password will be set to the same as the account number.</p>
				</div>

				<!-- Submit Button -->
				<div class="form-actions">
					<button 
						type="submit" 
						class="create-button"
						class:loading={isCreating}
						disabled={isCreating || !selectedAccountType || !selectedGender || !firstName || !lastName || (selectedAccountType === 'teacher' && !selectedSubject) || ((selectedAccountType === 'student' || selectedAccountType === 'teacher') && !email)}
					>
						{#if isCreating}
							Creating Account...
						{:else}
							<span class="material-symbols-outlined">person_add</span>
							Create Account
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Recent Account Creations -->
	<div class="recent-accounts-section">
		<div class="account-section-header">
			<h2 class="section-title">Recent Account Creations</h2>
			<p class="section-subtitle">Recently created accounts in the system</p>
		</div>

		<div class="accounts-grid">
			{#if isLoadingAccounts}
				<div class="loading-container">
						<span class="loader"></span>
					<p class="loading-text">Loading accounts...</p>
				</div>
			{:else}
				{#each recentAccounts as account (account.id)}
			<div class="account-card">
				<div class="account-card-header">
					<div class="account-title">
						<h3 class="account-name">{account.name} · {account.type}</h3>
					</div>
					<div class="account-action-buttons">
						<button 
							type="button"
							class="account-edit-button"
							title="{editingAccountId === account.id ? 'Cancel Edit' : 'Edit Account'}"
							on:click={() => toggleEditForm(account)}
						>
							<span class="material-symbols-outlined">{editingAccountId === account.id ? 'close' : 'edit'}</span>
						</button>
						<button 
							type="button"
							class="account-remove-button"
							title="Remove Account"
							on:click={() => handleRemoveAccount(account)}
						>
							<span class="material-symbols-outlined">delete</span>
						</button>
					</div>
				</div>
				
				<div class="account-details">
					<div class="account-detail-item">
						<span class="material-symbols-outlined">{account.type === 'Student' ? 'school' : account.type === 'Teacher' ? 'person' : 'admin_panel_settings'}</span>
						<span>{account.number}</span>
					</div>
					<div class="account-detail-item">
						<span class="material-symbols-outlined">badge</span>
						<span>{account.type} Account</span>
					</div>
					<div class="account-detail-item">
						<span class="material-symbols-outlined">calendar_today</span>
						<span>Created: {account.createdDate}</span>
					</div>
					<div class="account-detail-item">
						<span class="material-symbols-outlined">update</span>
						<span>Updated: {account.updatedDate}</span>
					</div>
				</div>

				<!-- Edit Form (conditionally shown) -->
				{#if editingAccountId === account.id}
					<div class="edit-form-section">
						<div class="edit-form-container">
							<div class="edit-form-header">
								<h4 class="edit-form-title">Edit Account Name</h4>
								<p class="edit-form-subtitle">Update the name information for this account</p>
							</div>

							<div class="edit-form-content">
								<form on:submit|preventDefault={handleEditAccount}>
									<!-- Name Fields -->
									<div class="edit-name-fields-row">
										<div class="form-group">
											<label class="form-label" for="edit-last-name">Last Name *</label>
											<input 
												type="text" 
												id="edit-last-name"
												class="form-input" 
												bind:value={editLastName}
												placeholder="Enter last name"
												required
											/>
										</div>

										<div class="form-group">
											<label class="form-label" for="edit-first-name">First Name *</label>
											<input 
												type="text" 
												id="edit-first-name"
												class="form-input" 
												bind:value={editFirstName}
												placeholder="Enter first name"
												required
											/>
										</div>

										<div class="form-group">
											<label class="form-label" for="edit-middle-initial">M.I.</label>
											<input 
												type="text" 
												id="edit-middle-initial"
												class="form-input" 
												bind:value={editMiddleInitial}
												placeholder="M"
												maxlength="1"
												style="text-transform: uppercase;"
											/>
										</div>
									</div>

									<!-- Form Actions -->
									<div class="edit-form-actions">
										<button 
											type="button" 
											class="account-cancel-button"
											on:click={() => toggleEditForm(account)}
										>
											Cancel
										</button>
										<button 
											type="submit" 
											class="account-submit-button"
											class:loading={isUpdating}
											disabled={isUpdating || !editFirstName || !editLastName}
										>
											{#if isUpdating}
												Updating...
											{:else}
												Save Changes
											{/if}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="no-results">
				<span class="material-symbols-outlined no-results-icon">person_off</span>
				<p>No accounts found. Create your first account above.</p>
			</div>
		{/each}
		{/if}
		</div>
	</div>
</div>
