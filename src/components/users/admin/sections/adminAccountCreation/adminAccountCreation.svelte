<script>
	import './adminAccountCreation.css';

	// Account creation state
	let isCreating = false;
	let selectedAccountType = '';
	let selectedGender = '';
	let selectedSubject = '';
	let firstName = '';
	let lastName = '';
	let middleInitial = '';
	let showSuccessMessage = false;
	let successMessage = '';

	// Custom dropdown state
	let isDropdownOpen = false;
	let isGenderDropdownOpen = false;
	let isSubjectDropdownOpen = false;

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
			alert('Please fill in all required fields.');
			return;
		}

		// Check if teacher account requires subject selection
		if (selectedAccountType === 'teacher' && !selectedSubject) {
			alert('Please select a subject for the teacher account.');
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

			// Show success message
			successMessage = `${selectedAccountType === 'student' ? 'Student' : 'Teacher'} account created successfully for ${fullName}!`;
			showSuccessMessage = true;

			// Reset form
			selectedAccountType = '';
			selectedGender = '';
			selectedSubject = '';
			firstName = '';
			lastName = '';
			middleInitial = '';

			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);

		} catch (error) {
			console.error('Error creating account:', error);
			alert('Failed to create account. Please try again.');
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

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div class="success-message">
			<span class="material-symbols-outlined success-icon">check_circle</span>
			<span class="success-text">{successMessage}</span>
		</div>
	{/if}

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
							<span class="material-symbols-outlined loading-icon">hourglass_empty</span>
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
		<div class="section-header">
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
							>
								<span class="material-symbols-outlined">edit</span>
							</button>
							<button 
								type="button"
								class="account-remove-button"
								title="Remove Account"
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
				</div>
			{/each}
		</div>
	</div>
</div>