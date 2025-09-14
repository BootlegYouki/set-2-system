<script>
	import './adminAccountCreation.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';

	// Account creation state
	let isCreating = false;
	let selectedAccountType = '';
	let selectedGender = '';
	let selectedSubject = '';
	let firstName = '';
	let lastName = '';
	let middleInitial = '';

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
		{ id: 'teacher', name: 'Teacher Account', description: 'Create a new teacher account', icon: 'person' }
	];

	// Gender options
	const genderOptions = [
		{ id: 'male', name: 'Male', icon: 'male' },
		{ id: 'female', name: 'Female', icon: 'female' }
	];

	// Subject options for teachers
	const subjectOptions = [
		{ id: 'mathematics', name: 'Mathematics', icon: 'calculate' },
		{ id: 'english', name: 'English', icon: 'book' },
		{ id: 'science', name: 'Science', icon: 'science' },
		{ id: 'history', name: 'History', icon: 'history_edu' },
		{ id: 'physical_education', name: 'Physical Education', icon: 'sports' },
		{ id: 'art', name: 'Art', icon: 'palette' },
		{ id: 'music', name: 'Music', icon: 'music_note' },
		{ id: 'computer_science', name: 'Computer Science', icon: 'computer' }
	];

	// Recent account creations (mock data)
	let recentAccounts = [
		{
			id: 1,
			name: 'John Doe',
			type: 'Student',
			number: 'STU-2024-001',
			createdDate: '01/15/2024',
			status: 'active'
		},
		{
			id: 2,
			name: 'Jane Smith',
			type: 'Teacher',
			number: 'TCH-2024-001',
			createdDate: '01/14/2024',
			status: 'active'
		},
		{
			id: 3,
			name: 'Mike Johnson',
			type: 'Student',
			number: 'STU-2024-002',
			createdDate: '01/13/2024',
			status: 'active'
		}
	];

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
			isGenderDropdownOpen = false;
			isSubjectDropdownOpen = false;
		}
	}

	// Handle account removal with modal confirmation
	function handleRemoveAccount(account) {
		modalStore.confirm(
			'Remove Account',
			`<p>Are you sure you want to remove the account for <strong>"${account.name}"</strong>?</p>`,
			() => {
				// Remove the account from the array
				recentAccounts = recentAccounts.filter(a => a.id !== account.id);
				
				// Show success toast
				toastStore.success(`Account for "${account.name}" has been removed successfully`);
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
			// Parse the name (assuming format: "LastName, FirstName M.I." or "LastName, FirstName")
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

	async function handleEditAccount() {
		if (!editFirstName || !editLastName) {
			alert('Please fill in all required fields.');
			return;
		}

		isUpdating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Construct full name
			const fullName = `${editLastName}, ${editFirstName}${editMiddleInitial ? ' ' + editMiddleInitial + '.' : ''}`;

			// Update account in the array
			recentAccounts = recentAccounts.map(account => {
				if (account.id === editingAccountId) {
					return {
						...account,
						name: fullName
					};
				}
				return account;
			});

			// Show success toast
			toastStore.success(`Account updated successfully for ${fullName}!`);

			// Close edit form
			editingAccountId = null;
			editFirstName = '';
			editLastName = '';
			editMiddleInitial = '';

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

		// Check if teacher account requires subject selection
		if (selectedAccountType === 'teacher' && !selectedSubject) {
			toastStore.error('Please select a subject for the teacher account.');
			return;
		}

		isCreating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Generate incremental account number
			const fullAccountNumber = getNextAccountNumber(selectedAccountType);

			// Construct full name
			const fullName = `${lastName}, ${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''}`;

			// Add to recent accounts
			const newAccount = {
				id: recentAccounts.length + 1,
				name: fullName,
				type: selectedAccountType === 'student' ? 'Student' : 'Teacher',
				number: fullAccountNumber,
				createdDate: new Date().toLocaleDateString('en-US'),
				status: 'active'
			};

			recentAccounts = [newAccount, ...recentAccounts];

			// Show success toast
			toastStore.success(`${selectedAccountType === 'student' ? 'Student' : 'Teacher'} account created successfully for ${fullName}!`);

			// Reset form
			selectedAccountType = '';
			selectedGender = '';
			selectedSubject = '';
			firstName = '';
			lastName = '';
			middleInitial = '';

		} catch (error) {
			console.error('Error creating account:', error);
			toastStore.error('Failed to create account. Please try again.');
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
		const prefix = accountType === 'student' ? 'STU' : 'TCH';
		const filteredAccounts = recentAccounts.filter(account => 
			account.number.startsWith(prefix)
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
</script>

<svelte:window on:click={handleClickOutside} />

<div class="account-creation-container">
	<!-- Header -->
	<div class="account-header">
		<div class="header-content">
			<h1 class="page-title">Account Creation</h1>
			<p class="page-subtitle">Create new student and teacher accounts for the system</p>
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
											<span class="material-symbols-outlined option-icon">{selectedSubjectObj.icon}</span>
											<div class="option-content">
												<span class="option-name">{selectedSubjectObj.name}</span>
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
											<span class="material-symbols-outlined option-icon">{subject.icon}</span>
											<div class="option-content">
												<span class="option-name">{subject.name}</span>
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

				<!-- Account Number Info -->
				<div class="form-group">
					<div class="form-label">
						{selectedAccountType === 'student' ? 'Student Number' : selectedAccountType === 'teacher' ? 'Teacher Number' : 'Account Number'}
					</div>
					<div class="number-display">
						{#if selectedAccountType}
							<span class="auto-number">{getNextAccountNumber(selectedAccountType)}</span>
							<span class="auto-label">(Auto-generated)</span>
						{:else}
							<span class="placeholder-number">Select account type first</span>
						{/if}
					</div>
					<p class="form-help">Account number will be automatically assigned. Default password will be set to "password123"</p>
				</div>

				<!-- Submit Button -->
				<div class="form-actions">
					<button 
						type="submit" 
						class="create-button"
						class:loading={isCreating}
						disabled={isCreating || !selectedAccountType || !selectedGender || !firstName || !lastName || (selectedAccountType === 'teacher' && !selectedSubject)}
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
								title="Edit Account"
								on:click={() => toggleEditForm(account)}
							>
								<span class="material-symbols-outlined">edit</span>
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
							<span class="material-symbols-outlined">{account.type === 'Student' ? 'school' : 'person'}</span>
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
			{/each}
		</div>
	</div>
</div>