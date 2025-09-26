<script>
	import './adminRoomManagement.css';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { onMount } from 'svelte';

	// Room management state
	let isCreating = false;
	let isLoading = false;

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

	// Data arrays
	let existingRooms = [];

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

	// Load rooms data from API
	async function loadRooms() {
		isLoading = true;
		try {
			const response = await fetch('/api/rooms');
			if (!response.ok) {
				throw new Error('Failed to load rooms');
			}
			const data = await response.json();
			
			if (data.success) {
				existingRooms = data.data;
			} else {
				throw new Error(data.message || 'Failed to load rooms');
			}
		} catch (error) {
			console.error('Error loading rooms:', error);
			toastStore.error('Failed to load rooms. Please try again.');
			existingRooms = [];
		} finally {
			isLoading = false;
		}
	}

	// Handle room removal with confirmation
	const handleRemoveRoom = (room) => {
		modalStore.confirm(
			'Remove Room',
			`Are you sure you want to remove room ${room.name}? This action cannot be undone.`,
			async () => {
				try {
					const response = await fetch('/api/rooms', {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ id: room.id })
					});

					const data = await response.json();
					
					if (data.success) {
						// Remove room from the list
						existingRooms = existingRooms.filter(r => r.id !== room.id);
						toastStore.success(data.message);
					} else {
						throw new Error(data.message || 'Failed to remove room');
					}
				} catch (error) {
					console.error('Error removing room:', error);
					toastStore.error('Failed to remove room. Please try again.');
				}
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
			const response = await fetch('/api/rooms', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: roomName,
					building: building,
					floor: floor
				})
			});

			const data = await response.json();
			
			if (data.success) {
				// Add new room to the list
				existingRooms = [data.data, ...existingRooms];
				toastStore.success(data.message);
				resetRoomForm();
			} else {
				throw new Error(data.message || 'Failed to create room');
			}
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
			const room = existingRooms.find(r => r.id === roomId);
			if (!room) return;

			const response = await fetch('/api/rooms', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: roomId,
					name: room.name,
					building: room.building,
					floor: room.floor,
					status: 'available',
					assignedTo: null
				})
			});

			const data = await response.json();
			
			if (data.success) {
				// Update room in the list
				const roomIndex = existingRooms.findIndex(r => r.id === roomId);
				if (roomIndex !== -1) {
					existingRooms[roomIndex] = data.data;
					existingRooms = [...existingRooms];
				}
				toastStore.success(`Room "${room.name}" has been unassigned successfully!`);
			} else {
				throw new Error(data.message || 'Failed to unassign room');
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
			const room = existingRooms.find(r => r.id === editingRoomId);
			
			const response = await fetch('/api/rooms', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: editingRoomId,
					name: editRoomName,
					building: editBuilding,
					floor: editFloor,
					status: room.status,
					assignedTo: room.assignedTo
				})
			});

			const data = await response.json();
			
			if (data.success) {
				// Update room in the array
				const roomIndex = existingRooms.findIndex(r => r.id === editingRoomId);
				if (roomIndex !== -1) {
					existingRooms[roomIndex] = data.data;
					existingRooms = [...existingRooms];
				}
				
				toastStore.success(data.message);
				
				// Close edit form
				editingRoomId = null;
				editRoomName = '';
				editBuilding = '';
				editFloor = '';
			} else {
				throw new Error(data.message || 'Failed to update room');
			}
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
			const room = existingRooms.find(r => r.id === assigningRoomId);
			const assignedTo = sections.find(s => s.id === assignSelectedSection)?.name;

			const response = await fetch('/api/rooms', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: assigningRoomId,
					name: room.name,
					building: room.building,
					floor: room.floor,
					status: 'assigned',
					assignedTo: assignedTo
				})
			});

			const data = await response.json();
			
			if (data.success) {
				// Update room in the array
				const roomIndex = existingRooms.findIndex(r => r.id === assigningRoomId);
				if (roomIndex !== -1) {
					existingRooms[roomIndex] = data.data;
					existingRooms = [...existingRooms];
				}

				toastStore.success(`Room "${room.name}" has been assigned to ${assignedTo} successfully!`);
				
				// Close assign form
				assigningRoomId = null;
				assignSelectedSection = '';
			} else {
				throw new Error(data.message || 'Failed to assign room');
			}
		} catch (error) {
			console.error('Error assigning room:', error);
			toastStore.error('Failed to assign room. Please try again.');
		} finally {
			isAssigningInline = false;
		}
	}

	// Load rooms when component mounts
	onMount(() => {
		loadRooms();
	});
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
				<span class="material-symbols-outlined">add_ad</span>
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

		{#if isLoading}
			<div class="admin-room-loading">
				<span class="room-loader"></span>
				<p>Loading rooms...</p>
			</div>
		{:else if existingRooms.length === 0}
			<div class="admin-room-empty-state">
				<span class="material-symbols-outlined">meeting_room</span>
				<p>No rooms found. Create your first room using the form above.</p>
			</div>
		{:else}
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
		{/if}
	</div>
</div>