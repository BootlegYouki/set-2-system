<script>
	import './adminRoomManagement.css';
	import { toastStore } from '../../../../common/js/toastStore.js';
import { modalStore } from '../../../../common/js/modalStore.js';

	// Room management state
	let isCreating = false;

	// Room creation state
	let roomName = '';
	let building = '';
	let floor = '';

	// Edit room states
	let editingRoomId = null;
	let editRoomName = '';
	let editBuilding = '';
	let editFloor = '';
	let isUpdating = false;

	// Assign room states (for inline assignment)
	let assigningRoomId = null;
	let assignSelectedSection = '';
	let isAssigningInline = false;
	let isAssignSectionDropdownOpen = false;





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



	// Handle room removal with confirmation
	const handleRemoveRoom = (room) => {
		modalStore.confirm(
			'Remove Room',
			`Are you sure you want to remove room ${room.name}? This action cannot be undone.`,
			() => {
				// Remove room from the list
				existingRooms = existingRooms.filter(r => r.id !== room.id);
				toastStore.success(`Room ${room.name} has been removed successfully.`);
			},
			() => {
				// User cancelled - do nothing
			}
		);
	};

	// Handle room creation
	async function handleCreateRoom() {
		if (!roomName || !building || !floor) {
			toastStore.warning('Please fill in all required fields.');
			return;
		}

		isCreating = true;


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
				assignedTo: null
			};

			existingRooms = [newRoom, ...existingRooms];

			// Show success toast
			toastStore.success(`Room "${roomName}" has been created successfully!`);

			// Reset form
			resetRoomForm();

		} catch (error) {
			console.error('Error creating room:', error);
			toastStore.error('Failed to create room. Please try again.');
		} finally {
			isCreating = false;
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
				toastStore.success(`Room "${roomName}" has been unassigned successfully!`);
			}
		} catch (error) {
			console.error('Error unassigning room:', error);
			toastStore.error('Failed to unassign room. Please try again.');
		}
	}

	// Reset forms
	function resetRoomForm() {
		roomName = '';
		building = '';
		floor = '';
	}







	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isAssignSectionDropdownOpen = false;
		}
	}

	// Edit room functions
	function toggleEditForm(room) {
		if (editingRoomId === room.id) {
			// Close the form
			editingRoomId = null;
			editRoomName = '';
			editBuilding = '';
			editFloor = '';
		} else {
			// Open the form
			editingRoomId = room.id;
			editRoomName = room.name;
			editBuilding = room.building;
			editFloor = room.floor;
		}
	}

	async function handleEditRoom() {
		if (!editRoomName || !editBuilding || !editFloor) {
			toastStore.warning('Please fill in all required fields.');
			return;
		}

		isUpdating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Update room in the array
			existingRooms = existingRooms.map(room => {
				if (room.id === editingRoomId) {
					return {
						...room,
						name: editRoomName,
						building: editBuilding,
						floor: editFloor
					};
				}
				return room;
			});

			// Show success toast
			toastStore.success(`Room "${editRoomName}" updated successfully!`);

			// Close edit form
			editingRoomId = null;
			editRoomName = '';
			editBuilding = '';
			editFloor = '';

		} catch (error) {
			console.error('Error updating room:', error);
			toastStore.error('Failed to update room. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Inline assign room functions
	function toggleAssignForm(room) {
		if (assigningRoomId === room.id) {
			// Close the form
			assigningRoomId = null;
			assignSelectedSection = '';
			isAssignSectionDropdownOpen = false;
		} else {
			// Open the form
			assigningRoomId = room.id;
			assignSelectedSection = '';
			isAssignSectionDropdownOpen = false;
			// Close edit form if open
			editingRoomId = null;
		}
	}

	function toggleAssignSectionDropdown() {
		isAssignSectionDropdownOpen = !isAssignSectionDropdownOpen;
	}

	function selectAssignSection(section) {
		assignSelectedSection = section.id;
		isAssignSectionDropdownOpen = false;
	}

	async function handleInlineAssignRoom() {
		if (!assignSelectedSection) {
			toastStore.warning('Please select a section.');
			return;
		}

		isAssigningInline = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Find and update the room
			const roomIndex = existingRooms.findIndex(room => room.id === assigningRoomId);
			if (roomIndex !== -1) {
				const assignedTo = sections.find(s => s.id === assignSelectedSection)?.name;

				existingRooms[roomIndex] = {
					...existingRooms[roomIndex],
					status: 'assigned',
					assignedTo: assignedTo
				};

				existingRooms = [...existingRooms];

				// Show success toast
				const roomName = existingRooms[roomIndex].name;
				toastStore.success(`Room "${roomName}" has been assigned to ${assignedTo} successfully!`);

				// Close assign form
				assigningRoomId = null;
				assignSelectedSection = '';
			}

		} catch (error) {
			console.error('Error assigning room:', error);
			toastStore.error('Failed to assign room. Please try again.');
		} finally {
			isAssigningInline = false;
		}
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
	<!-- Room Creation Form -->
	<div class="admin-room-creation-form-section">
		<div class="admin-room-section-header">
			<h2 class="admin-room-section-title">Create New Room</h2>
			<p class="admin-room-section-subtitle">Fill in the details below to create a new room</p>
		</div>

		<div class="admin-room-form-container">
			<form on:submit|preventDefault={handleCreateRoom}>
				<!-- Room Info -->
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

				<!-- Submit Button -->
				<div class="admin-room-form-actions">
					<button 
						type="submit" 
						class="admin-room-create-button"
						class:admin-room-loading={isCreating}
						disabled={isCreating || !roomName || !building || !floor}
					>
						{#if isCreating}
					Creating
				{:else}
					Create Room
				{/if}
					</button>
				</div>
			</form>
		</div>
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
					{:else}
						<button 
							type="button"
							class="admin-room-assign-button"
							on:click={() => toggleAssignForm(room)}
							title="{assigningRoomId === room.id ? 'Cancel Assign' : 'Assign Room'}"
						>
							<span class="material-symbols-outlined">{assigningRoomId === room.id ? 'close' : 'add_circle'}</span>
						</button>
					{/if}
					<button 
				type="button"
				class="admin-room-edit-button"
				on:click={() => toggleEditForm(room)}
				title="{editingRoomId === room.id ? 'Cancel Edit' : 'Edit Room'}"
			>
				<span class="material-symbols-outlined">{editingRoomId === room.id ? 'close' : 'edit'}</span>
			</button>
					<button 
						type="button"
						class="admin-room-remove-button"
						on:click={() => handleRemoveRoom(room)}
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
				
				<!-- Inline Edit Form -->
				{#if editingRoomId === room.id}
					<div class="admin-room-edit-form-section">
						<div class="admin-room-edit-form-container">
							<div class="admin-room-edit-form-header">
								<h2 class="admin-room-edit-form-title">Edit Room</h2>
								<p class="admin-room-edit-form-subtitle">Update room information</p>
							</div>
							
							<form class="admin-room-edit-form-content" on:submit|preventDefault={handleEditRoom}>
								<!-- Room Info -->
								<div class="admin-room-edit-info-row">
									<div class="admin-room-form-group">
										<label class="admin-room-form-label" for="edit-room-name">
											Room Name *
										</label>
										<input 
											type="text" 
											id="edit-room-name"
											class="admin-room-form-input" 
											bind:value={editRoomName}
											placeholder="Enter room name"
											required
										/>
									</div>

									<div class="admin-room-form-group">
										<label class="admin-room-form-label" for="edit-building">
											Building *
										</label>
										<input 
											type="text" 
											id="edit-building"
											class="admin-room-form-input" 
											bind:value={editBuilding}
											placeholder="Enter building name"
											required
										/>
									</div>

									<div class="admin-room-form-group">
										<label class="admin-room-form-label" for="edit-floor">
											Floor *
										</label>
										<input 
											type="text" 
											id="edit-floor"
											class="admin-room-form-input" 
											bind:value={editFloor}
											placeholder="e.g., 1st Floor"
											required
										/>
									</div>
								</div>

								<!-- Form Actions -->
								<div class="admin-room-edit-form-actions">
									<button type="button" class="admin-room-cancel-button" on:click={() => toggleEditForm(room)}>
										Cancel
									</button>
									<button 
										type="submit" 
										class="admin-room-update-button"
										disabled={isUpdating || !editRoomName || !editBuilding || !editFloor}
									>
										{#if isUpdating}
												Updating
											{:else}
												Update
											{/if}
									</button>
								</div>
							</form>
						</div>
					</div>
				{/if}

				<!-- Inline Assign Form -->
				{#if assigningRoomId === room.id}
					<div class="admin-room-assign-form-section">
						<div class="admin-room-assign-form-container">
							<div class="admin-room-assign-form-header">
								<h2 class="admin-room-assign-form-title">Assign Room</h2>
								<p class="admin-room-assign-form-subtitle">Select a section to assign this room to</p>
							</div>
							
							<form class="admin-room-assign-form-content" on:submit|preventDefault={handleInlineAssignRoom}>
								<!-- Section Selection -->
								<div class="admin-room-assign-info-row">
									<div class="admin-room-form-group">
										<label class="admin-room-form-label" for="assign-section-select">Select Section *</label>
										<div class="custom-dropdown" class:open={isAssignSectionDropdownOpen}>
											<button 
												type="button"
												class="dropdown-trigger" 
												class:selected={assignSelectedSection}
												on:click={toggleAssignSectionDropdown}
												id="assign-section-select"
											>
												{#if assignSelectedSection}
													{@const selectedSectionObj = sections.find(section => section.id === assignSelectedSection)}
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
														class:selected={assignSelectedSection === section.id}
														on:click={() => selectAssignSection(section)}
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

								<!-- Form Actions -->
								<div class="admin-room-assign-form-actions">
									<button type="button" class="admin-room-cancel-button" on:click={() => toggleAssignForm(room)}>
										Cancel
									</button>
									<button 
										type="submit" 
										class="admin-room-assign-submit-button"
										disabled={isAssigningInline || !assignSelectedSection}
									>
										{#if isAssigningInline}
												Assigning
											{:else}
												Assign
											{/if}
									</button>
								</div>
							</form>
						</div>
					</div>
				{/if}
			</div>
		{/each}
		</div>
	</div>
</div>