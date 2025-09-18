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
	let selectedYearLevel = '';
	let firstName = '';
	let lastName = '';
	let middleInitial = '';
	let email = '';
	
	// Additional Information for students
	let birthdate = '';
	let address = '';
	let guardian = '';
	let contactNumber = '';
	let calculatedAge = 0;

	// Custom dropdown state
	let isDropdownOpen = false;
	let isGenderDropdownOpen = false;
	let isSubjectDropdownOpen = false;
	let isYearLevelDropdownOpen = false;
	let isFilterDropdownOpen = false;

	// Filter state
	let selectedFilter = 'all';

	// Edit account state
	let editingAccountId = null;
	let editFirstName = '';
	let editLastName = '';
	let editMiddleInitial = '';
	let editSubject = '';
	let editSubjectId = null;
	let editYearLevel = '';
	let isEditSubjectDropdownOpen = false;
	let isEditYearLevelDropdownOpen = false;
	let isUpdating = false;
	
	// Edit additional information for students
	let editBirthdate = '';
	let editAddress = '';
	let editGuardian = '';
	let editContactNumber = '';
	let editCalculatedAge = 0;
	
	// Current account being edited (reactive)
	$: currentAccount = editingAccountId ? recentAccounts.find(account => account.id === editingAccountId) : null;

	// Contact number validation
	function validateContactNumber(value) {
		if (!value) return false;
		
		// Remove any non-digit characters
		const digitsOnly = value.replace(/\D/g, '');
		
		// Check if it starts with 09 and has exactly 11 digits
		return digitsOnly.startsWith('09') && digitsOnly.length === 11;
	}

	function formatContactNumber(value) {
		// Remove any non-digit characters
		const digitsOnly = value.replace(/\D/g, '');
		
		// Limit to 11 digits
		return digitsOnly.slice(0, 11);
	}

	function handleContactNumberInput(event, isEdit = false) {
		const formatted = formatContactNumber(event.target.value);
		if (isEdit) {
			editContactNumber = formatted;
		} else {
			contactNumber = formatted;
		}
		event.target.value = formatted;
	}

	// Date validation function
	function validateDate(dateString) {
		if (!dateString) return true; // Allow empty dates
		
		// Check if the date string is complete (YYYY-MM-DD format for HTML date input)
		if (dateString.length < 10) return true; // Allow partial input
		
		const date = new Date(dateString);
		const year = date.getFullYear();
		const currentYear = new Date().getFullYear();
		
		// Check if date is valid and year is reasonable (between 1900 and current year + 10)
		if (isNaN(date.getTime()) || year < 1900 || year > currentYear + 10) {
			return false;
		}
		
		return true;
	}

	function handleDateInput(event, isEdit = false) {
		const dateValue = event.target.value;
		
		// Update the bound value immediately without validation during typing
		if (isEdit) {
			editBirthdate = dateValue;
		} else {
			birthdate = dateValue;
		}
		
		// Only validate on blur (when user finishes typing) or if they try to submit
		// This prevents interruption during typing
	}

	// Search functionality
	let searchQuery = '';

	// Account types
	const accountTypes = [
		{ id: 'student', name: 'Student Account', description: 'Create a new student account', icon: 'school' },
		{ id: 'teacher', name: 'Teacher Account', description: 'Create a new teacher account', icon: 'person' },
		{ id: 'admin', name: 'Admin Account', description: 'Create a new admin account', icon: 'admin_panel_settings' }
	];

	// Filter options
	const filterOptions = [
		{ id: 'all', name: 'All Accounts', icon: 'group' },
		{ id: 'student', name: 'Students', icon: 'school' },
		{ id: 'teacher', name: 'Teachers', icon: 'person' },
		{ id: 'admin', name: 'Admins', icon: 'admin_panel_settings' }
	];

	// Gender options
	const genderOptions = [
		{ id: 'male', name: 'Male', icon: 'male' },
		{ id: 'female', name: 'Female', icon: 'female' }
	];

	// Year level options for students
	const yearLevelOptions = [
		{ id: '1st', name: '1st Year', icon: 'looks_one' },
		{ id: '2nd', name: '2nd Year', icon: 'looks_two' },
		{ id: '3rd', name: '3rd Year', icon: 'looks_3' },
		{ id: '4th', name: '4th Year', icon: 'looks_4' }
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
			isYearLevelDropdownOpen = false;
			isEditSubjectDropdownOpen = false;
			isEditYearLevelDropdownOpen = false;
			isFilterDropdownOpen = false;
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
			editSubject = '';
			editSubjectId = null;
			editYearLevel = '';
			editBirthdate = '';
			editAddress = '';
			editGuardian = '';
			editContactNumber = '';
			editCalculatedAge = 0;
			isEditSubjectDropdownOpen = false;
			isEditYearLevelDropdownOpen = false;
		} else {
			// Open the form and populate with current values
			editingAccountId = account.id;
			// Use the individual fields from the API response if available
			if (account.firstName && account.lastName) {
				editFirstName = account.firstName;
				editLastName = account.lastName;
				editMiddleInitial = account.middleInitial || '';
				editSubject = account.subject || '';
				editSubjectId = account.subjectId || null;
				editYearLevel = account.yearLevel || '';
				// Format birthdate for date input (YYYY-MM-DD) - timezone safe
				if (account.birthdate) {
					const date = new Date(account.birthdate);
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					editBirthdate = `${year}-${month}-${day}`;
				} else {
					editBirthdate = '';
				}
				editAddress = account.address || '';
				editGuardian = account.guardian || '';
				editContactNumber = account.contactNumber || '';
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
				editSubject = account.subject || '';
				editSubjectId = account.subjectId || null;
				editYearLevel = account.yearLevel || '';
				// Format birthdate for date input (YYYY-MM-DD) - timezone safe
				if (account.birthdate) {
					const date = new Date(account.birthdate);
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					editBirthdate = `${year}-${month}-${day}`;
				} else {
					editBirthdate = '';
				}
				editAddress = account.address || '';
				editGuardian = account.guardian || '';
				editContactNumber = account.contactNumber || '';
			}
		}
	}

	async function handleEditAccount() {
		if (!editFirstName || !editLastName) {
			toastStore.error('Please fill in all required fields.');
			return;
		}

		// Additional validation for student accounts
		if (currentAccount && currentAccount.type.toLowerCase() === 'student') {
			if (!editBirthdate || !editAddress || !editGuardian || !editContactNumber) {
				toastStore.error('Please fill in all required student information fields.');
				return;
			}
			
			// Validate contact number format
			if (!validateContactNumber(editContactNumber)) {
				toastStore.error('Invalid contact number.');
				return;
			}
		}

		isUpdating = true;

		try {
			// Prepare the request body
			const requestBody = {
				id: editingAccountId,
				firstName: editFirstName.trim(),
				lastName: editLastName.trim(),
				middleInitial: editMiddleInitial ? editMiddleInitial.trim() : null
			};

			// Add subject only for teacher accounts
			if (currentAccount && currentAccount.type.toLowerCase() === 'teacher') {
				// Use the subject name from the selected subject for the API
				const selectedSubjectObj = subjectOptions.find(subject => subject.id === editSubjectId);
				requestBody.subject = selectedSubjectObj ? selectedSubjectObj.name : null;
			}

			// Add year level and additional info for student accounts
			if (currentAccount && currentAccount.type.toLowerCase() === 'student') {
				requestBody.yearLevel = editYearLevel || null;
				requestBody.birthdate = editBirthdate || null;
				requestBody.address = editAddress ? editAddress.trim() : null;
				requestBody.guardian = editGuardian ? editGuardian.trim() : null;
				requestBody.contactNumber = editContactNumber ? editContactNumber.trim() : null;
			}

			const response = await fetch('/api/accounts', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
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
				editSubject = '';
				editYearLevel = '';
				editBirthdate = '';
				editAddress = '';
				editGuardian = '';
				editContactNumber = '';
				editCalculatedAge = 0;
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
		// Clear year level selection when switching account types
		if (type.id !== 'student') {
			selectedYearLevel = '';
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

	// Toggle year level dropdown
	function toggleYearLevelDropdown() {
		isYearLevelDropdownOpen = !isYearLevelDropdownOpen;
	}

	// Select year level and close dropdown
	function selectYearLevel(yearLevel) {
		selectedYearLevel = yearLevel.id;
		isYearLevelDropdownOpen = false;
	}

	// Toggle edit subject dropdown
	function toggleEditSubjectDropdown() {
		isEditSubjectDropdownOpen = !isEditSubjectDropdownOpen;
	}

	// Select edit subject and close dropdown
	function selectEditSubject(subject) {
		editSubjectId = subject.id;
		editSubject = subject.displayName;
		isEditSubjectDropdownOpen = false;
	}

	// Toggle edit year level dropdown
	function toggleEditYearLevelDropdown() {
		isEditYearLevelDropdownOpen = !isEditYearLevelDropdownOpen;
	}

	// Select edit year level and close dropdown
	function selectEditYearLevel(yearLevel) {
		editYearLevel = yearLevel.id;
		isEditYearLevelDropdownOpen = false;
	}

	// Toggle filter dropdown
	function toggleFilterDropdown() {
		isFilterDropdownOpen = !isFilterDropdownOpen;
	}

	// Select filter and close dropdown
	function selectFilter(filter) {
		selectedFilter = filter.id;
		isFilterDropdownOpen = false;
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

		// Check if student account requires year level selection
		if (selectedAccountType === 'student' && !selectedYearLevel) {
			toastStore.error('Please select a year level for the student account.');
			return;
		}
		
		// Check if student account requires additional information
		if (selectedAccountType === 'student') {
			if (!birthdate || !address || !guardian || !contactNumber) {
				toastStore.error('Please fill in all additional information fields for the student account.');
				return;
			}
			
			// Validate contact number format
				if (!validateContactNumber(contactNumber)) {
					toastStore.error('Invalid contact number.');
					return;
				}
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
					yearLevel: selectedYearLevel,
					firstName,
					lastName,
					middleInitial,
					email,
					birthdate: selectedAccountType === 'student' ? birthdate : null,
					address: selectedAccountType === 'student' ? address : null,
					guardian: selectedAccountType === 'student' ? guardian : null,
					contactNumber: selectedAccountType === 'student' ? contactNumber : null
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
			selectedYearLevel = '';
			firstName = '';
			lastName = '';
			middleInitial = '';
			email = '';
			birthdate = '';
			address = '';
			guardian = '';
			contactNumber = '';
			calculatedAge = 0;

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

	// Get selected year level object
	$: selectedYearLevelObj = yearLevelOptions.find(yearLevel => yearLevel.id === selectedYearLevel);

	// Get selected filter object
	$: selectedFilterObj = filterOptions.find(filter => filter.id === selectedFilter);

	// Get selected edit year level object
	$: selectedEditYearLevelObj = yearLevelOptions.find(yearLevel => yearLevel.id === editYearLevel);

	// Calculate age from birthdate
	$: {
		if (birthdate) {
			const birthDate = new Date(birthdate);
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
			calculatedAge = age >= 0 ? age : 0;
		} else {
			calculatedAge = 0;
		}
	}

	// Calculate age from edit birthdate
	$: {
		if (editBirthdate) {
			const birthDate = new Date(editBirthdate);
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
			editCalculatedAge = age >= 0 ? age : 0;
		} else {
			editCalculatedAge = 0;
		}
	}

	// Filter accounts based on selected filter and search query
	$: filteredAccounts = recentAccounts.filter(account => {
		// First apply type filter
		const accountType = account.type.toLowerCase();
		const typeMatches = selectedFilter === 'all' || accountType === selectedFilter;
		
		// Then apply search filter
		if (!searchQuery.trim()) {
			return typeMatches;
		}
		
		const query = searchQuery.toLowerCase().trim();
		const nameMatches = account.name.toLowerCase().includes(query);
		const numberMatches = account.number.toString().includes(query);
		const subjectMatches = account.subject && account.subject.toLowerCase().includes(query);
		
		return typeMatches && (nameMatches || numberMatches || subjectMatches);
	});

	// Generate next account number for the selected type
	function getNextAccountNumber(accountType) {
		const prefix = accountType === 'student' ? 'STU' : accountType === 'teacher' ? 'TCH' : 'ADM';
		const filteredAccounts = recentAccounts.filter(account => 
			account.number && account.number.startsWith(prefix)
		);
		
		if (filteredAccounts.length === 0) {
			return `${prefix}-2025-0001`;
		}
		
		// Extract numbers and find the highest
		const numbers = filteredAccounts.map(account => {
			const match = account.number.match(/-([0-9]+)$/);
			return match ? parseInt(match[1]) : 0;
		});
		
		const nextNumber = Math.max(...numbers) + 1;
		return `${prefix}-2025-${nextNumber.toString().padStart(4, '0')}`;
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

					<!-- Year Level Selection (only for students) -->
					{#if selectedAccountType === 'student'}
						<div class="form-group">
							<label class="form-label" for="year-level">Year Level *</label>
							<div class="custom-dropdown" class:open={isYearLevelDropdownOpen}>
								<button 
									type="button"
									class="dropdown-trigger" 
									class:selected={selectedYearLevel}
									on:click={toggleYearLevelDropdown}
									id="year-level"
								>
									{#if selectedYearLevelObj}
										<div class="selected-option">
											<span class="material-symbols-outlined option-icon">{selectedYearLevelObj.icon}</span>
											<div class="option-content">
												<span class="option-name">{selectedYearLevelObj.name}</span>
											</div>
										</div>
									{:else}
										<span class="placeholder">Select year level</span>
									{/if}
									<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
								</button>
								<div class="dropdown-menu">
									{#each yearLevelOptions as yearLevel (yearLevel.id)}
										<button 
											type="button"
											class="dropdown-option" 
											class:selected={selectedYearLevel === yearLevel.id}
											on:click={() => selectYearLevel(yearLevel)}
										>
											<span class="material-symbols-outlined option-icon">{yearLevel.icon}</span>
											<div class="option-content">
												<span class="option-name">{yearLevel.name}</span>
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

				<!-- Additional Information Section (for students only) -->
				{#if selectedAccountType === 'student'}
					<div class="additional-info-section">
						<h3 class="section-subtitle">Additional Information</h3>
						<p class="section-description">Required information for student accounts</p>
						
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="birthdate">Birthdate *</label>
								<input 
									type="date" 
									id="birthdate"
									class="form-input" 
									bind:value={birthdate}
									on:blur={(e) => {
										if (birthdate && !validateDate(birthdate)) {
											toastStore.error('Invalid date. Please enter a valid date.');
											birthdate = '';
											e.target.value = '';
										}
									}}
									required
								/>
							</div>

							<div class="form-group">
								<label class="form-label" for="age">Age</label>
								<input 
									type="number" 
									id="age"
									class="form-input age-display" 
									value={calculatedAge}
									readonly
									placeholder="Auto-calculated"
								/>
							</div>
						</div>

						<div class="form-group">
							<label class="form-label" for="address">Address *</label>
							<textarea 
								id="address"
								class="form-input form-textarea" 
								bind:value={address}
								placeholder="Enter complete address"
								rows="3"
								required
							></textarea>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="guardian">Guardian/Parent Name *</label>
								<input 
									type="text" 
									id="guardian"
									class="form-input" 
									bind:value={guardian}
									placeholder="Enter guardian/parent name"
									required
								/>
							</div>

							<div class="form-group">
								<label class="form-label" for="contact-number">Contact Number *</label>
								<input 
									type="tel" 
									id="contact-number"
									class="form-input" 
									bind:value={contactNumber}
									on:input={(e) => handleContactNumberInput(e, false)}
									placeholder="09xxxxxxxxxx"
									maxlength="11"
									required
								/>
							</div>
						</div>
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
						disabled={isCreating || !selectedAccountType || !selectedGender || !firstName || !lastName || (selectedAccountType === 'teacher' && !selectedSubject) || ((selectedAccountType === 'student' || selectedAccountType === 'teacher') && !email) || (selectedAccountType === 'student' && (!birthdate || !address || !guardian || !contactNumber))}
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
			<div class="section-header-content">
				<div class="section-title-group">
					<h2 class="section-title">Recent Account Creations</h2>
					<p class="section-subtitle">Recently created accounts in the system</p>
				</div>
				
				<!-- Search and Filter Container -->
				<div class="search-filter-container">
					<!-- Search Input -->
					<div class="search-container">
						<div class="search-input-wrapper">
							<span class="material-symbols-outlined search-icon">search</span>
							<input 
								type="text" 
								class="search-input" 
								placeholder="Search accounts by name, number, or subject..."
								bind:value={searchQuery}
							/>
							{#if searchQuery}
								<button 
									type="button" 
									class="clear-search-button"
									on:click={() => searchQuery = ''}
								>
									<span class="material-symbols-outlined">close</span>
								</button>
							{/if}
						</div>
					</div>

					<!-- Filter Dropdown -->
					<div class="filter-container">
						<div class="custom-dropdown" class:open={isFilterDropdownOpen}>
							<button 
								type="button"
								class="dropdown-trigger filter-trigger" 
								class:selected={selectedFilter !== 'all'}
								on:click={toggleFilterDropdown}
							>
								{#if selectedFilterObj}
									<div class="selected-option">
										<span class="material-symbols-outlined option-icon">{selectedFilterObj.icon}</span>
										<div class="option-content">
											<span class="option-name">{selectedFilterObj.name}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">Filter by type</span>
								{/if}
								<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
							</button>
							<div class="dropdown-menu">
								{#each filterOptions as filter (filter.id)}
									<button 
										type="button"
										class="dropdown-option" 
										class:selected={selectedFilter === filter.id}
										on:click={() => selectFilter(filter)}
									>
										<span class="material-symbols-outlined option-icon">{filter.icon}</span>
										<div class="option-content">
											<span class="option-name">{filter.name}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="accounts-grid">
			{#if isLoadingAccounts}
				<div class="loading-container">
						<span class="account-loader"></span>
					<p class="loading-text">Loading accounts...</p>
				</div>
			{:else}
				{#each filteredAccounts as account (account.id)}
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
					{#if account.type === 'Student' && account.yearLevel}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">school</span>
							<span>{account.yearLevel} Year</span>
						</div>
					{/if}
					{#if account.type === 'Student' && account.age}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">cake</span>
							<span>Age: {account.age}</span>
						</div>
					{/if}
					{#if account.type === 'Student' && account.guardian}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">family_restroom</span>
							<span>Guardian: {account.guardian}</span>
						</div>
					{/if}
					{#if account.type === 'Student' && account.contactNumber}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">phone</span>
							<span>Contact: {account.contactNumber}</span>
						</div>
					{/if}
					{#if account.type === 'Student' && account.address}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">home</span>
							<span>Address: {account.address}</span>
						</div>
					{/if}
					{#if account.type === 'Teacher' && account.subject}
						<div class="account-detail-item">
							<span class="material-symbols-outlined">subject</span>
							<span>{account.subject}</span>
						</div>
					{/if}
					<div class="account-detail-item">
						<span class="material-symbols-outlined">calendar_today</span>
						<span>Created: {account.createdDate}</span>
					</div>
					<div class="account-detail-item">
						<span class="material-symbols-outlined">update</span>
						<span>Updated: {account.updatedDate}</span>
					</div>
				</div>

				<!-- Edit Form (shown when editing this account) -->
				{#if editingAccountId === account.id}
					<div class="edit-form-section">
						<div class="edit-form-container">
							<div class="edit-form-header">
								<h4 class="edit-form-title">Edit Account Information</h4>
								<p class="edit-form-subtitle">Update the name information for this account</p>
							</div>
							
							<form on:submit|preventDefault={handleEditAccount} class="edit-form-content">
								<div class="edit-name-fields-row">
									<div class="form-group">
										<label class="form-label" for="edit-last-name-{account.id}">Last Name *</label>
										<input 
											type="text" 
											id="edit-last-name-{account.id}"
											class="form-input" 
											bind:value={editLastName}
											placeholder="Enter last name"
											required
										/>
									</div>

									<div class="form-group">
										<label class="form-label" for="edit-first-name-{account.id}">First Name *</label>
										<input 
											type="text" 
											id="edit-first-name-{account.id}"
											class="form-input" 
											bind:value={editFirstName}
											placeholder="Enter first name"
											required
										/>
									</div>

									<div class="form-group">
										<label class="form-label" for="edit-middle-initial-{account.id}">M.I.</label>
										<input 
											type="text" 
											id="edit-middle-initial-{account.id}"
											class="form-input" 
											bind:value={editMiddleInitial}
											placeholder="M"
											maxlength="1"
											style="text-transform: uppercase;"
										/>
									</div>
								</div>

								<!-- Subject field for teacher accounts only -->
								{#if account.type.toLowerCase() === 'teacher'}
									<div class="form-group">
										<label class="form-label" for="edit-subject-{account.id}">Subject</label>
										<div class="custom-dropdown" class:open={isEditSubjectDropdownOpen}>
											<button 
												type="button"
												class="dropdown-trigger" 
												class:selected={editSubjectId}
												on:click={toggleEditSubjectDropdown}
												id="edit-subject-{account.id}"
											>
												{#if editSubject}
													<div class="selected-option">
														<div class="option-content">
															<span class="option-name">{editSubject}</span>
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
														class:selected={editSubjectId === subject.id}
														on:click={() => selectEditSubject(subject)}
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

								<!-- Year Level field for student accounts only -->
								{#if account.type.toLowerCase() === 'student'}
									<div class="form-group">
										<label class="form-label" for="edit-year-level-{account.id}">Year Level</label>
										<div class="custom-dropdown" class:open={isEditYearLevelDropdownOpen}>
											<button 
												type="button"
												class="dropdown-trigger" 
												class:selected={editYearLevel}
												on:click={toggleEditYearLevelDropdown}
												id="edit-year-level-{account.id}"
											>
												{#if selectedEditYearLevelObj}
													<div class="selected-option">
														<span class="material-symbols-outlined option-icon">{selectedEditYearLevelObj.icon}</span>
														<div class="option-content">
															<span class="option-name">{selectedEditYearLevelObj.name}</span>
														</div>
													</div>
												{:else}
													<span class="placeholder">Select year level</span>
												{/if}
												<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
											</button>
											<div class="dropdown-menu">
												{#each yearLevelOptions as yearLevel (yearLevel.id)}
													<button 
														type="button"
														class="dropdown-option" 
														class:selected={editYearLevel === yearLevel.id}
														on:click={() => selectEditYearLevel(yearLevel)}
													>
														<span class="material-symbols-outlined option-icon">{yearLevel.icon}</span>
														<div class="option-content">
															<span class="option-name">{yearLevel.name}</span>
														</div>
													</button>
												{/each}
											</div>
										</div>
									</div>

									<!-- Additional Information for Student Edit -->
									<div class="additional-info-section">
										<h4 class="section-subtitle">Additional Information</h4>
										<p class="section-description">Update student additional information</p>
										
										<div class="form-row">
											<div class="form-group">
												<label class="form-label" for="edit-birthdate-{account.id}">Birthdate *</label>
												<input 
													type="date" 
													id="edit-birthdate-{account.id}"
													class="form-input" 
													bind:value={editBirthdate}
													on:blur={(e) => {
														if (editBirthdate && !validateDate(editBirthdate)) {
															toastStore.error('Invalid date. Please enter a valid date.');
															editBirthdate = '';
															e.target.value = '';
														}
													}}
													required
												/>
											</div>

											<div class="form-group">
												<label class="form-label" for="edit-age-{account.id}">Age</label>
												<input 
													type="number" 
													id="edit-age-{account.id}"
													class="form-input age-display" 
													value={editCalculatedAge}
													readonly
													placeholder="Auto-calculated"
												/>
											</div>
										</div>

										<div class="form-group">
											<label class="form-label" for="edit-address-{account.id}">Address *</label>
											<textarea 
												id="edit-address-{account.id}"
												class="form-input form-textarea" 
												bind:value={editAddress}
												placeholder="Enter complete address"
												rows="3"
												required
											></textarea>
										</div>

										<div class="form-row">
											<div class="form-group">
												<label class="form-label" for="edit-guardian-{account.id}">Guardian/Parent Name *</label>
												<input 
													type="text" 
													id="edit-guardian-{account.id}"
													class="form-input" 
													bind:value={editGuardian}
													placeholder="Enter guardian/parent name"
													required
												/>
											</div>

											<div class="form-group">
												<label class="form-label" for="edit-contact-number-{account.id}">Contact Number *</label>
												<input 
													type="tel" 
													id="edit-contact-number-{account.id}"
													class="form-input" 
													bind:value={editContactNumber}
													on:input={(e) => handleContactNumberInput(e, true)}
													placeholder="09xxxxxxxxxx"
													maxlength="11"
													required
												/>
											</div>
										</div>
									</div>
								{/if}

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
										disabled={isUpdating || !editFirstName || !editLastName || (currentAccount && currentAccount.type.toLowerCase() === 'student' && (!editBirthdate || !editAddress || !editGuardian || !editContactNumber))}
									>
										{#if isUpdating}
											Updating...
										{:else}
											Update Account
										{/if}
									</button>
								</div>
							</form>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="no-results">
				<span class="material-symbols-outlined no-results-icon">
					{searchQuery ? 'search_off' : 'person_off'}
				</span>
				<p>
					{#if searchQuery}
						No accounts found matching "{searchQuery}".
					{:else}
						No {selectedFilter === 'all' ? '' : selectedFilterObj?.name.toLowerCase() || ''} accounts found.
					{/if}
				</p>
				{#if searchQuery}
					<button 
						type="button" 
						class="clear-search-button-inline"
						on:click={() => searchQuery = ''}
					>
						Clear search
					</button>
				{/if}
			</div>
		{/each}
		{/if}
		</div>
	</div>
</div>
