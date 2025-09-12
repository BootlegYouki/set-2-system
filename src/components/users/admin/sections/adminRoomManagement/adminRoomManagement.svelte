<script>
	import './adminRoomManagement.css';

	// Room management state
	let activeTab = 'create'; // 'create' or 'assign'
	let isCreating = false;
	let isAssigning = false;

	// Room creation state
	let roomName = '';
	let building = '';
	let floor = '';
	let description = '';

	// Room assignment state
	let selectedRoom = '';
	let selectedSection = '';

	// Custom dropdown state
	let isRoomDropdownOpen = false;
	let isSectionDropdownOpen = false;

	// Success/error messages
	let showSuccessMessage = false;
	let successMessage = '';
	let showErrorMessage = false;
	let errorMessage = '';



	// Mock data for existing rooms (Philippine Junior High School)
	let existingRooms = [
		{
			id: 1,
			name: 'Science Laboratory',
			building: 'Academic Building A',
			floor: '2nd Floor',
			status: 'available',
			assignedTo: null
		},
		{
			id: 2,
			name: 'Room 101',
			building: 'Academic Building A',
			floor: '1st Floor',
			status: 'assigned',
			assignedTo: 'Grade 7 - Section A (Matatag)'
		},
		{
			id: 3,
			name: 'Computer Laboratory',
			building: 'Academic Building B',
			floor: '3rd Floor',
			status: 'assigned',
			assignedTo: 'Grade 9 - Section B (Matapat)'
		},
		{
			id: 4,
			name: 'Room 205',
			building: 'Academic Building B',
			floor: '2nd Floor',
			status: 'available',
			assignedTo: null
		},
		{
			id: 5,
			name: 'Audio Visual Room',
			building: 'Main Building',
			floor: 'Ground Floor',
			status: 'assigned',
			assignedTo: 'Grade 10 - Section C (Mapaglingkod)'
		}
	];

	// Mock data for sections (Philippine DepEd Junior High School - Grades 7-10)
	let sections = [
		{ id: 'grade7-a', name: 'Grade 7 - Section A (Matatag)' },
		{ id: 'grade7-b', name: 'Grade 7 - Section B (Masigasig)' },
		{ id: 'grade7-c', name: 'Grade 7 - Section C (Malikhain)' },
		{ id: 'grade8-a', name: 'Grade 8 - Section A (Makabayan)' },
		{ id: 'grade8-b', name: 'Grade 8 - Section B (Malikhaing)' },
		{ id: 'grade8-c', name: 'Grade 8 - Section C (Masipag)' },
		{ id: 'grade9-a', name: 'Grade 9 - Section A (Matalinong)' },
		{ id: 'grade9-b', name: 'Grade 9 - Section B (Matapat)' },
		{ id: 'grade9-c', name: 'Grade 9 - Section C (Mapagmahal)' },
		{ id: 'grade10-a', name: 'Grade 10 - Section A (Maunlad)' },
		{ id: 'grade10-b', name: 'Grade 10 - Section B (Mapagkakatiwalaan)' },
		{ id: 'grade10-c', name: 'Grade 10 - Section C (Mapaglingkod)' }
	];

	// Teachers data removed - rooms can only be assigned to sections

	// Tab switching
	function switchTab(tab) {
		activeTab = tab;
		clearMessages();
	}

	// Clear messages
	function clearMessages() {
		showSuccessMessage = false;
		showErrorMessage = false;
	}

	// Handle room creation
	async function handleCreateRoom() {
		if (!roomName || !building || !floor) {
			showError('Please fill in all required fields.');
			return;
		}

		isCreating = true;
		clearMessages();

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Create new room
			const newRoom = {
				id: existingRooms.length + 1,
				name: roomName,
				building: building,
				floor: floor,
				status: 'available',
				assignedTo: null,
				description: description
			};

			existingRooms = [newRoom, ...existingRooms];

			// Show success message
			showSuccess(`Room "${roomName}" has been created successfully!`);

			// Reset form
			resetRoomForm();

		} catch (error) {
			console.error('Error creating room:', error);
			showError('Failed to create room. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Handle room assignment
	async function handleAssignRoom() {
		if (!selectedRoom || !selectedSection) {
			showError('Please fill in all required fields.');
			return;
		}

		isAssigning = true;
		clearMessages();

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Find and update the room
			const roomIndex = existingRooms.findIndex(room => room.id === parseInt(selectedRoom));
			if (roomIndex !== -1) {
				const assignedTo = sections.find(s => s.id === selectedSection)?.name;

				existingRooms[roomIndex] = {
					...existingRooms[roomIndex],
					status: 'assigned',
					assignedTo: assignedTo
				};

				existingRooms = [...existingRooms];

				// Show success message
				const roomName = existingRooms[roomIndex].name;
				showSuccess(`Room "${roomName}" has been assigned to ${assignedTo} successfully!`);

				// Reset assignment form
				resetAssignmentForm();
			}

		} catch (error) {
			console.error('Error assigning room:', error);
			showError('Failed to assign room. Please try again.');
		} finally {
			isAssigning = false;
		}
	}

	// Unassign room
	async function unassignRoom(roomId) {
		try {
			const roomIndex = existingRooms.findIndex(room => room.id === roomId);
			if (roomIndex !== -1) {
				const roomName = existingRooms[roomIndex].name;
				existingRooms[roomIndex] = {
					...existingRooms[roomIndex],
					status: 'available',
					assignedTo: null
				};
				existingRooms = [...existingRooms];
				showSuccess(`Room "${roomName}" has been unassigned successfully!`);
			}
		} catch (error) {
			console.error('Error unassigning room:', error);
			showError('Failed to unassign room. Please try again.');
		}
	}

	// Reset forms
	function resetRoomForm() {
		roomName = '';
		building = '';
		floor = '';
		description = '';
	}

	function resetAssignmentForm() {
		selectedRoom = '';
		selectedSection = '';
	}

	// Show messages
	function showSuccess(message) {
		successMessage = message;
		showSuccessMessage = true;
		setTimeout(() => {
			showSuccessMessage = false;
		}, 5000);
	}

	function showError(message) {
		errorMessage = message;
		showErrorMessage = true;
		setTimeout(() => {
			showErrorMessage = false;
		}, 5000);
	}

	// Get available rooms for assignment
	$: availableRooms = existingRooms.filter(room => room.status === 'available');

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isRoomDropdownOpen = false;
			isSectionDropdownOpen = false;
		}
	}

	// Toggle dropdowns
	function toggleRoomDropdown() {
		isRoomDropdownOpen = !isRoomDropdownOpen;
		isSectionDropdownOpen = false;
	}

	function toggleSectionDropdown() {
		isSectionDropdownOpen = !isSectionDropdownOpen;
		isRoomDropdownOpen = false;
	}

	// Select options and close dropdowns
	function selectRoom(room) {
		selectedRoom = room.id;
		isRoomDropdownOpen = false;
	}

	function selectSection(section) {
		selectedSection = section.id;
		isSectionDropdownOpen = false;
	}
</script>

<div class="admin-room-management-container" on:click={handleClickOutside} on:keydown={handleClickOutside} role="button" tabindex="0">
	<!-- Header -->
	<div class="admin-room-header">
		<div class="header-content">
			<h1 class="page-title">Room Management</h1>
			<p class="page-subtitle">Create and manage rooms, assign them to sections</p>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if showSuccessMessage}
		<div class="admin-room-success-message">
			<span class="material-symbols-outlined admin-room-success-icon">check_circle</span>
			<span class="admin-room-success-text">{successMessage}</span>
		</div>
	{/if}

	{#if showErrorMessage}
		<div class="admin-room-error-message">
			<span class="material-symbols-outlined admin-room-error-icon">error</span>
			<span class="admin-room-error-text">{errorMessage}</span>
		</div>
	{/if}

	<!-- Tab Navigation -->
	<div class="admin-room-tab-navigation">
		<button 
			class="admin-room-tab-button" 
			class:admin-room-active={activeTab === 'create'}
			on:click={() => switchTab('create')}
		>
			<span class="material-symbols-outlined">add_business</span>
			Create Room
		</button>
		<button 
			class="admin-room-tab-button" 
			class:admin-room-active={activeTab === 'assign'}
			on:click={() => switchTab('assign')}
		>
			<span class="material-symbols-outlined">assignment</span>
			Assign Room
		</button>
	</div>

	<!-- Tab Content -->
	<div class="admin-room-tab-content">
		{#if activeTab === 'create'}
			<!-- Room Creation Form -->
			<div class="admin-room-creation-form-section">
				<div class="admin-room-section-header">
					<h2 class="admin-room-section-title">Create New Room</h2>
					<p class="admin-room-section-subtitle">Fill in the details below to create a new room</p>
				</div>

				<div class="admin-room-form-container">
					<form on:submit|preventDefault={handleCreateRoom}>
						<!-- Room Basic Info -->
						<div class="admin-room-form-row">
							<div class="admin-room-form-group">
								<label class="admin-room-form-label" for="room-name">Room Name *</label>
								<input 
									type="text" 
									id="room-name"
									class="admin-room-form-input" 
									bind:value={roomName}
									placeholder="Enter room name"
									required
								/>
							</div>
						</div>



						<!-- Location Info -->
						<div class="admin-room-form-row">
							<div class="admin-room-form-group">
								<label class="admin-room-form-label" for="building">Building *</label>
								<input 
									type="text" 
									id="building"
									class="admin-room-form-input" 
									bind:value={building}
									placeholder="Enter building name"
									required
								/>
							</div>

							<div class="admin-room-form-group">
								<label class="admin-room-form-label" for="floor">Floor *</label>
								<input 
									type="text" 
									id="floor"
									class="admin-room-form-input" 
									bind:value={floor}
									placeholder="e.g., 1st Floor"
									required
								/>
							</div>
						</div>

						<!-- Description -->
						<div class="admin-room-form-group">
							<label class="admin-room-form-label" for="description">Description</label>
							<textarea 
								id="description"
								class="admin-room-form-textarea" 
								bind:value={description}
								placeholder="Enter room description (optional)"
								rows="3"
							></textarea>
						</div>

						<!-- Submit Button -->
						<div class="admin-room-form-actions">
							<button 
								type="submit" 
								class="admin-room-create-button"
								class:admin-room-loading={isCreating}
								disabled={isCreating || !roomName || !building || !floor}
							>
								{#if isCreating}
									<span class="material-symbols-outlined admin-room-loading-icon">hourglass_empty</span>
									Creating Room...
								{:else}
									<span class="material-symbols-outlined">add_business</span>
									Create Room
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>

		{:else if activeTab === 'assign'}
			<!-- Room Assignment Form -->
			<div class="admin-room-assignment-form-section">
				<div class="admin-room-section-header">
					<h2 class="admin-room-section-title">Assign Room</h2>
					<p class="admin-room-section-subtitle">Assign available rooms to sections</p>
				</div>

				<div class="admin-room-form-container">
					<form on:submit|preventDefault={handleAssignRoom}>
						<!-- Room and Section Selection Row -->
						<div class="admin-room-assignment-form-row">
							<!-- Room Selection -->
							<div class="admin-room-form-group">
								<label class="admin-room-form-label" for="room-select">Select Room *</label>
								<div class="custom-dropdown" class:open={isRoomDropdownOpen}>
									<button 
										type="button"
										class="dropdown-trigger" 
										class:selected={selectedRoom}
										on:click={toggleRoomDropdown}
										id="room-select"
									>
										{#if selectedRoom}
											{@const selectedRoomObj = availableRooms.find(room => room.id === parseInt(selectedRoom))}
											{#if selectedRoomObj}
												<div class="selected-option">
													<span class="material-symbols-outlined option-icon">meeting_room</span>
													<div class="option-content">
														<span class="option-name">{selectedRoomObj.name}</span>
														<span class="option-description">{selectedRoomObj.building}, {selectedRoomObj.floor}</span>
													</div>
												</div>
											{/if}
										{:else}
											<span class="placeholder">Select a room</span>
										{/if}
										<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
									</button>
									<div class="dropdown-menu">
										{#each availableRooms as room (room.id)}
											<button 
												type="button"
												class="dropdown-option" 
												class:selected={selectedRoom === room.id.toString()}
												on:click={() => selectRoom(room)}
											>
												<span class="material-symbols-outlined option-icon">meeting_room</span>
												<div class="option-content">
													<span class="option-name">{room.name}</span>
													<span class="option-description">{room.building}, {room.floor}</span>
												</div>
											</button>
										{/each}
									</div>
								</div>
								{#if availableRooms.length === 0}
									<p class="admin-room-form-help admin-room-warning">No available rooms to assign. Create rooms first or unassign existing ones.</p>
								{/if}
							</div>

							<!-- Section Selection -->
							<div class="admin-room-form-group">
								<label class="admin-room-form-label" for="section-select">Select Section *</label>
								<div class="custom-dropdown" class:open={isSectionDropdownOpen}>
									<button 
										type="button"
										class="dropdown-trigger" 
										class:selected={selectedSection}
										on:click={toggleSectionDropdown}
										id="section-select"
									>
										{#if selectedSection}
											{@const selectedSectionObj = sections.find(section => section.id === selectedSection)}
											{#if selectedSectionObj}
												<div class="selected-option">
													<span class="material-symbols-outlined option-icon">group</span>
													<div class="option-content">
														<span class="option-name">{selectedSectionObj.name}</span>
														<span class="option-description">Grade {selectedSectionObj.id.charAt(5)} Section</span>
													</div>
												</div>
											{/if}
										{:else}
											<span class="placeholder">Select a section</span>
										{/if}
										<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
									</button>
									<div class="dropdown-menu">
										{#each sections as section (section.id)}
											<button 
												type="button"
												class="dropdown-option" 
												class:selected={selectedSection === section.id}
												on:click={() => selectSection(section)}
											>
												<span class="material-symbols-outlined option-icon">group</span>
												<div class="option-content">
													<span class="option-name">{section.name}</span>
													<span class="option-description">Grade {section.id.charAt(5)} Section</span>
												</div>
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- Submit Button -->
						<div class="admin-room-form-actions">
							<button 
								type="submit" 
								class="admin-room-assign-button"
								class:admin-room-loading={isAssigning}
								disabled={isAssigning || !selectedRoom || !selectedSection}
							>
								{#if isAssigning}
									<span class="material-symbols-outlined admin-room-loading-icon">hourglass_empty</span>
									Assigning Room...
								{:else}
									<span class="material-symbols-outlined">assignment</span>
									Assign Room
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>

	<!-- Existing Rooms List -->
	<div class="admin-room-rooms-list-section">
		<div class="admin-room-section-header">
			<h2 class="admin-room-section-title">Existing Rooms</h2>
			<p class="admin-room-section-subtitle">Manage and view all rooms in the system</p>
		</div>

		<div class="admin-room-rooms-grid">
			{#each existingRooms as room (room.id)}
				<div class="admin-room-room-card">
					<div class="admin-room-room-header">
						<div class="admin-room-room-title">
							<h3 class="admin-room-room-name">{room.name}</h3>
						</div>
						<div class="admin-room-action-buttons">
						{#if room.assignedTo}
							<button 
								type="button"
								class="admin-room-unassign-button"
								on:click={() => unassignRoom(room.id)}
								title="Unassign Room"
							>
								<span class="material-symbols-outlined">remove_circle</span>
							</button>
						{/if}
						<button 
							type="button"
							class="admin-room-edit-button"
							title="Edit Room"
						>
							<span class="material-symbols-outlined">edit</span>
						</button>
						<button 
							type="button"
							class="admin-room-remove-button"
							title="Remove Room"
						>
							<span class="material-symbols-outlined">delete</span>
						</button>
					</div>
					</div>
					
					<div class="admin-room-room-details">
						<div class="admin-room-room-location">
							<span class="material-symbols-outlined">location_on</span>
							<span>{room.building}, {room.floor}</span>
						</div>
						{#if room.assignedTo}
							<div class="admin-room-room-assignment">
								<span class="material-symbols-outlined">group</span>
								<span>Assigned to: {room.assignedTo}</span>
							</div>
						{:else}
							<div class="admin-room-room-assignment">
								<span class="material-symbols-outlined">check_circle</span>
								<span>Available</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>