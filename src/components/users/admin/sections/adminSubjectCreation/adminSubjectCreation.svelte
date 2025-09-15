<script>
	import './adminSubjectCreation.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';

	// Subject creation state
	let isCreating = false;
	let selectedGradeLevel = '';
	let subjectName = '';
	let subjectCode = '';

	// Dropdown states
	let isGradeDropdownOpen = false;
	let isGradeFilterDropdownOpen = false;

	// Search and filter state
	let searchTerm = '';
	let selectedGradeFilter = ''; // All grade levels

	// Edit subject states
	let editingSubjectId = null;
	let editSubjectName = '';
	let editSubjectCode = '';
	let editSelectedGradeLevel = '';
	let isUpdating = false;

	// Edit dropdown states
	let isEditGradeDropdownOpen = false;

	// Grade levels for Philippines DepEd (Grades 7-10)
	const gradeLevels = [
		{ value: 7, label: 'Grade 7', description: 'Junior High School - First Year' },
		{ value: 8, label: 'Grade 8', description: 'Junior High School - Second Year' },
		{ value: 9, label: 'Grade 9', description: 'Junior High School - Third Year' },
		{ value: 10, label: 'Grade 10', description: 'Junior High School - Fourth Year' }
	];

	// Computed properties
	$: selectedGradeLevelObj = gradeLevels.find(grade => grade.value === selectedGradeLevel);
	$: selectedGradeFilterObj = gradeLevels.find(grade => grade.value === selectedGradeFilter);
	$: filteredSubjects = recentSubjects.filter(subject => {
		const matchesSearchTerm =
			(subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				subject.code.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchesGrade = selectedGradeFilter ? subject.gradeLevel === `Grade ${selectedGradeFilter}` : true;

		return matchesSearchTerm && matchesGrade;
	});

	// Recent subject creations (mock data)
	let recentSubjects = [
		{
			id: 1,
			name: 'Mathematics',
			code: 'MATH-7',
			gradeLevel: 'Grade 7',
			createdDate: '01/15/2024',
			status: 'active'
		},
		{
			id: 2,
			name: 'English',
			code: 'ENG-8',
			gradeLevel: 'Grade 8',
			createdDate: '01/14/2024',
			status: 'active'
		},
		{
			id: 3,
			name: 'Science',
			code: 'SCI-9',
			gradeLevel: 'Grade 9',
			createdDate: '01/13/2024',
			status: 'active'
		},
		{
			id: 4,
			name: 'Filipino',
			code: 'FIL-10',
			gradeLevel: 'Grade 10',
			createdDate: '01/12/2024',
			status: 'active'
		}
	];

	// Handle form submission
	async function handleCreateSubject() {
		if (!selectedGradeLevel || !subjectName.trim() || !subjectCode.trim()) {
			toastStore.error('Please fill in all required fields');
			return;
		}

		isCreating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));

			// Add to recent subjects
			const newSubject = {
				id: recentSubjects.length + 1,
				name: subjectName,
				code: subjectCode,
				gradeLevel: `Grade ${selectedGradeLevel}`,
				createdDate: new Date().toLocaleDateString('en-US'),
				status: 'active'
			};

			recentSubjects = [newSubject, ...recentSubjects];

			// Reset form
			selectedGradeLevel = '';
			subjectName = '';
			subjectCode = '';

			// Show success toast
			toastStore.success(`Subject "${newSubject.name}" created successfully with code ${newSubject.code}`);

		} catch (error) {
			console.error('Error creating subject:', error);
			toastStore.error('Failed to create subject. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Handle subject removal
	function handleRemoveSubject(subject) {
		modalStore.confirm(
			'Remove Subject',
			`<p>Are you sure you want to remove the subject <strong>"${subject.name}"</strong>?</p>`,
			() => {
				// Remove the subject from the array
				recentSubjects = recentSubjects.filter(s => s.id !== subject.id);
				
				// Show success toast
				toastStore.success(`Subject "${subject.name}" has been removed successfully`);
			},
			null, // onCancel - no action needed
			{ size: 'small' }
		);
	}

	// Functions
	function toggleGradeDropdown() {
		isGradeDropdownOpen = !isGradeDropdownOpen;
	}

	function selectGradeLevel(grade) {
		selectedGradeLevel = grade.value;
		isGradeDropdownOpen = false;
	}

	function toggleGradeFilterDropdown() {
		isGradeFilterDropdownOpen = !isGradeFilterDropdownOpen;
	}

	function selectGradeFilter(grade) {
		if (grade) {
			selectedGradeFilter = grade.value;
		} else {
			selectedGradeFilter = '';
		}
		isGradeFilterDropdownOpen = false;
	}

	// Handle click outside to close dropdowns
	function handleClickOutside(event) {
		if (!event.target.closest('.adminsubject-custom-dropdown')) {
			isGradeDropdownOpen = false;
			isEditGradeDropdownOpen = false;
		}
		if (!event.target.closest('.adminsubject-grade-filter')) {
			isGradeFilterDropdownOpen = false;
		}
	}

	// Edit subject functions
	function toggleEditForm(subject) {
		if (editingSubjectId === subject.id) {
			// Close the form
			editingSubjectId = null;
			editSubjectName = '';
			editSubjectCode = '';
			editSelectedGradeLevel = '';
			isEditGradeDropdownOpen = false;
		} else {
			// Open the form
			editingSubjectId = subject.id;
			editSubjectName = subject.name;
			editSubjectCode = subject.code;
			editSelectedGradeLevel = parseInt(subject.gradeLevel.replace('Grade ', ''));
		}
	}

	async function handleEditSubject() {
		if (!editSubjectName.trim() || !editSubjectCode.trim() || !editSelectedGradeLevel) {
			toastStore.error('Please fill in all required fields');
			return;
		}

		isUpdating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Update subject in the array
			recentSubjects = recentSubjects.map(subject => {
				if (subject.id === editingSubjectId) {
					return {
						...subject,
						name: editSubjectName,
						code: editSubjectCode,
						gradeLevel: `Grade ${editSelectedGradeLevel}`
					};
				}
				return subject;
			});

			// Show success toast
			toastStore.success(`Subject "${editSubjectName}" updated successfully with code ${editSubjectCode}`);

			// Close edit form
			editingSubjectId = null;
			editSubjectName = '';
			editSubjectCode = '';
			editSelectedGradeLevel = '';
			isEditGradeDropdownOpen = false;

		} catch (error) {
			console.error('Error updating subject:', error);
			toastStore.error('Failed to update subject. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Edit dropdown functions
	function toggleEditGradeDropdown() {
		isEditGradeDropdownOpen = !isEditGradeDropdownOpen;
	}

	function selectEditGradeLevel(grade) {
		editSelectedGradeLevel = grade.value;
		isEditGradeDropdownOpen = false;
	}

	// Computed properties for edit form
	$: editSelectedGradeLevelObj = gradeLevels.find(grade => grade.value === editSelectedGradeLevel);

	// Remove auto-generation of subject code
</script>

<svelte:window on:click={handleClickOutside} />

<div class="admin-subject-creation-container">
	<!-- Header -->
	<div class="admin-subject-header">
		<div class="admin-header-content">
			<h1 class="admin-page-title">Subject Creation</h1>
			<p class="admin-page-subtitle">Create and manage subjects for the curriculum</p>
		</div>
	</div>

	<div class="admin-creation-layout">
		<!-- Left Column: Creation Form -->
		<div class="admin-creation-form-section">
			<div class="admin-section-header">
				<h2 class="admin-section-title">Create New Subject</h2>
				<p class="admin-section-subtitle">Fill in the details below to create a new subject</p>
			</div>

			<div class="admin-form-container">
				<form on:submit|preventDefault={handleCreateSubject}>
					<!-- Grade Level, Subject Name, and Subject Code Row -->
					<div class="admin-form-row">
						<!-- Grade Level Selection -->
						<div class="admin-form-group admin-form-group-third">
							<label class="admin-form-label" for="grade-level">Grade Level *</label>
							<div class="adminsubject-custom-dropdown" class:open={isGradeDropdownOpen}>
								<button
									type="button"
									class="adminsubject-dropdown-trigger"
									class:selected={selectedGradeLevel}
									on:click={toggleGradeDropdown}
									id="grade-level"
								>
									{#if selectedGradeLevelObj}
										<div class="adminsubject-selected-option">
											<span class="material-symbols-outlined adminsubject-option-icon">school</span>
											<div class="adminsubject-option-content">
												<span class="adminsubject-option-name">{selectedGradeLevelObj.label}</span>
											</div>
										</div>
									{:else}
										<span class="adminsubject-placeholder">Select grade level</span>
									{/if}
									<span class="material-symbols-outlined adminsubject-dropdown-arrow">expand_more</span>
								</button>
								<div class="adminsubject-dropdown-menu">
									{#each gradeLevels as grade (grade.value)}
										<button
											type="button"
											class="adminsubject-dropdown-option"
											class:selected={selectedGradeLevel === grade.value}
											on:click={() => selectGradeLevel(grade)}
										>
											<span class="material-symbols-outlined adminsubject-option-icon">school</span>
											<div class="adminsubject-option-content">
												<span class="adminsubject-option-name">{grade.label}</span>
												<span class="adminsubject-option-description">{grade.description}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>

						<!-- Subject Name -->
						<div class="admin-form-group admin-form-group-third">
							<label for="subjectName" class="admin-form-label">Subject Name *</label>
							<input
								id="subjectName"
								type="text"
								class="admin-form-input"
								bind:value={subjectName}
								placeholder="e.g., Mathematics, English"
								disabled={!selectedGradeLevel}
								required
							/>
						</div>

						<!-- Subject Code -->
						<div class="admin-form-group admin-form-group-third">
							<label for="subjectCode" class="admin-form-label">Subject Code *</label>
							<input
								id="subjectCode"
								type="text"
								class="admin-form-input"
								bind:value={subjectCode}
								placeholder="e.g., MATH-7, ENG-8"
								required
							/>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="admin-form-actions">
						<button
							type="submit"
							class="admin-create-button"
							class:loading={isCreating}
							disabled={isCreating || !selectedGradeLevel || !subjectName.trim()}
						>
							{#if isCreating}
								Creating...
							{:else}
								<span class="material-symbols-outlined">add_circle</span>
								Create Subject
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Right Column: Recent Subjects -->
		<div class="admin-recent-subjects-section">
			<div class="admin-section-header">
				<h2 class="admin-section-title">Recent Subjects</h2>
				<p class="admin-section-subtitle">Subjects created recently</p>
			</div>

			<div class="adminsubject-filters-container">
				<!-- Search Input -->
				<div class="adminsubject-search-container">
					<input
						type="text"
						placeholder="Search by subject name or code..."
						class="adminsubject-search-input"
						bind:value={searchTerm}
					/>
					<span class="material-symbols-outlined adminsubject-search-icon">search</span>
				</div>

				<!-- Grade Level Filter -->
				<div class="adminsubject-grade-filter adminsubject-custom-dropdown" class:open={isGradeFilterDropdownOpen}>
					<button
						type="button"
						class="adminsubject-dropdown-trigger"
						class:selected={selectedGradeFilter}
						on:click={toggleGradeFilterDropdown}
					>
						{#if selectedGradeFilterObj}
						<div class="adminsubject-selected-option">
							<span class="material-symbols-outlined adminsubject-option-icon">school</span>
							<div class="adminsubject-option-content">
								<span class="adminsubject-option-name">{selectedGradeFilterObj.label}</span>
							</div>
						</div>
						{:else}
							<span class="adminsubject-placeholder">All Grades</span>
						{/if}
						<span class="material-symbols-outlined adminsubject-dropdown-arrow">expand_more</span>
					</button>
					<div class="adminsubject-dropdown-menu">
						<button
							type="button"
							class="adminsubject-dropdown-option"
						class:selected={selectedGradeFilter === ''}
						on:click={() => selectGradeFilter(null)}
					>
						<span class="material-symbols-outlined adminsubject-option-icon">clear_all</span>
						<div class="adminsubject-option-content">
							<span class="adminsubject-option-name">All Grades</span>
							</div>
						</button>
						{#each gradeLevels as grade (grade.value)}
							<button
								type="button"
								class="adminsubject-dropdown-option"
							class:selected={selectedGradeFilter === grade.value}
							on:click={() => selectGradeFilter(grade)}
						>
							<span class="material-symbols-outlined adminsubject-option-icon">school</span>
							<div class="adminsubject-option-content">
								<span class="adminsubject-option-name">{grade.label}</span>
								<span class="adminsubject-option-description">{grade.description}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="adminsubject-subjects-grid">
				{#each filteredSubjects as subject (subject.id)}
					<div class="adminsubject-subject-card">
						<div class="adminsubject-subject-header">
							<div class="adminsubject-subject-title">
								<h3 class="adminsubject-subject-name">{subject.name} · {subject.gradeLevel}</h3>
							</div>
							<div class="adminsubject-action-buttons">
								<button 
									type="button" 
									class="adminsubject-edit-button" 
									on:click={() => toggleEditForm(subject)}
									title="{editingSubjectId === subject.id ? 'Cancel Edit' : 'Edit Subject'}"
								>
									<span class="material-symbols-outlined">
										{editingSubjectId === subject.id ? 'close' : 'edit'}
									</span>
								</button>
								<button 
									type="button" 
									class="adminsubject-remove-button" 
									title="Remove Subject"
									on:click={() => handleRemoveSubject(subject)}
								>
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						</div>

						<div class="adminsubject-subject-details">
							<div class="adminsubject-subject-item-detail">
								<span class="material-symbols-outlined">qr_code_2</span>
								<span>{subject.code}</span>
							</div>
							<div class="adminsubject-subject-item-detail">
								<span class="material-symbols-outlined">calendar_today</span>
								<span>Created: {subject.createdDate}</span>
							</div>
						</div>

						<!-- Inline Edit Form -->
						{#if editingSubjectId === subject.id}
							<div class="adminsubject-edit-form-section">
								<div class="adminsubject-edit-form-container">
									<div class="adminsubject-edit-form-header">
										<h2 class="adminsubject-edit-form-title">Edit Subject</h2>
										<p class="adminsubject-edit-form-subtitle">Update subject information</p>
									</div>
									
									<form class="adminsubject-edit-form-content" on:submit|preventDefault={handleEditSubject}>
										<!-- Grade Level, Subject Name, and Subject Code Row -->
										<div class="adminsubject-edit-form-row">
											<!-- Grade Level Selection -->
											<div class="adminsubject-form-group adminsubject-form-group-third">
												<label class="adminsubject-form-label" for="edit-grade-level">Grade Level *</label>
												<div class="adminsubject-custom-dropdown" class:open={isEditGradeDropdownOpen}>
													<button
														type="button"
														class="adminsubject-dropdown-trigger"
														class:selected={editSelectedGradeLevel}
														on:click={toggleEditGradeDropdown}
														id="edit-grade-level"
													>
														{#if editSelectedGradeLevelObj}
															<div class="adminsubject-selected-option">
																<span class="material-symbols-outlined adminsubject-option-icon">school</span>
																<div class="adminsubject-option-content">
																	<span class="adminsubject-option-name">{editSelectedGradeLevelObj.label}</span>
																</div>
															</div>
														{:else}
															<span class="adminsubject-placeholder">Select grade level</span>
														{/if}
														<span class="material-symbols-outlined adminsubject-dropdown-arrow">expand_more</span>
													</button>
													<div class="adminsubject-dropdown-menu">
														{#each gradeLevels as grade (grade.value)}
															<button
																type="button"
																class="adminsubject-dropdown-option"
																class:selected={editSelectedGradeLevel === grade.value}
																on:click={() => selectEditGradeLevel(grade)}
															>
																<span class="material-symbols-outlined adminsubject-option-icon">school</span>
																<div class="adminsubject-option-content">
																	<span class="adminsubject-option-name">{grade.label}</span>
																	<span class="adminsubject-option-description">{grade.description}</span>
																</div>
															</button>
														{/each}
													</div>
												</div>
											</div>

											<!-- Subject Name -->
											<div class="adminsubject-form-group adminsubject-form-group-third">
												<label for="editSubjectName" class="adminsubject-form-label">Subject Name *</label>
												<input
													id="editSubjectName"
													type="text"
													class="adminsubject-form-input"
													bind:value={editSubjectName}
													placeholder="e.g., Mathematics, English"
													required
												/>
											</div>

											<!-- Subject Code -->
											<div class="adminsubject-form-group adminsubject-form-group-third">
												<label for="editSubjectCode" class="adminsubject-form-label">Subject Code *</label>
												<input
													id="editSubjectCode"
													type="text"
													class="adminsubject-form-input"
													bind:value={editSubjectCode}
													placeholder="e.g., MATH-7, ENG-8"
													required
												/>
											</div>
										</div>

										<!-- Form Actions -->
										<div class="adminsubject-edit-form-actions">
											<button type="button" class="adminsubject-cancel-button" on:click={() => toggleEditForm(subject)}>
												Cancel
											</button>
											<button 
												type="submit" 
												class="adminsubject-submit-button"
												disabled={isUpdating || !editSubjectName.trim() || !editSubjectCode.trim() || !editSelectedGradeLevel}
											>
												{#if isUpdating}
													Updating...
												{:else}
													Update Subject
												{/if}
											</button>
										</div>
									</form>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="adminsubject-no-results">
						<span class="material-symbols-outlined adminsubject-no-results-icon">search_off</span>
						<p>No subjects found matching your search.</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
