<script>
	import './adminRoomForm.css';
	import { toastStore } from '../../../../../common/js/toastStore.js';
	import { modalStore } from '../../../../../common/js/modalStore.js';
	import { api } from '../../../../../../routes/api/helper/api-helper.js';
	import { roomManagementStore } from '../../../../../../lib/stores/admin/roomManagementStore.js';
	import { onMount } from 'svelte';

	// Subscribe to room management store
	$: ({
		rooms: existingRooms,
		availableSections,
		isLoading,
		error: storeError
	} = $roomManagementStore);

	// Room management state
	let isCreating = false;
	let roomsSearchTerm = '';

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

    // School Year Store
    import { selectedSchoolYear } from '../../../../../../stores/schoolYearStore.js';
    let currentSchoolYearString = '';
    
    $: if ($selectedSchoolYear && $selectedSchoolYear !== currentSchoolYearString) {
        currentSchoolYearString = $selectedSchoolYear;
        loadRooms(false);
    } else if (!$selectedSchoolYear && currentSchoolYearString) {
        currentSchoolYearString = '';
        loadRooms(false);
    }



	// Load rooms data from API
	async function loadRooms(silent = false) {
		try {
			if (!silent) {
				roomManagementStore.setLoading(true);
			}

			const data = await api.get(`/api/rooms${currentSchoolYearString ? `?schoolYear=${currentSchoolYearString}` : ''}`);

			if (data.success) {
				roomManagementStore.updateRooms(data.data || []);
			} else {
				throw new Error(data.message || 'Failed to load rooms');
			}
		} catch (error) {
			console.error('Error loading rooms:', error);
			roomManagementStore.setError('Failed to load rooms. Please try again.');
			toastStore.error('Failed to load rooms. Please try again.');
		}
	}



	// Handle room removal with confirmation
	const handleRemoveRoom = (room) => {
		modalStore.confirm(
			'Remove Room',
			`Are you sure you want to remove room ${room.name}? This action cannot be undone.`,
			async () => {
				try {
					const data = await api.delete('/api/rooms', { id: room.id });

					if (data.success) {
						// Remove room from the store
						roomManagementStore.removeRoom(room.id);
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
			const data = await api.post('/api/rooms', {
				name: roomName,
				building: building,
				floor: floor
			});

			if (data.success) {
				// Add new room to the store
				roomManagementStore.addRoom(data.data);
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



	// Reset forms
	function resetRoomForm() {
		roomName = '';
		building = '';
		floor = '';
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
			const room = existingRooms.find((r) => r.id === editingRoomId);

			const data = await api.put('/api/rooms', {
				id: editingRoomId,
				name: editRoomName,
				building: editBuilding,
				floor: editFloor,
				status: room.status,
				assignedTo: room.assignedTo
			});

			if (data.success) {
				// Update room in the store
				roomManagementStore.updateRoom(editingRoomId, data.data);

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



	// Computed properties
	$: filteredRooms = existingRooms.filter((room) => {
		const matchesSearchTerm =
			room.name.toLowerCase().includes(roomsSearchTerm.toLowerCase()) ||
			room.building.toLowerCase().includes(roomsSearchTerm.toLowerCase()) ||
			room.floor.toLowerCase().includes(roomsSearchTerm.toLowerCase());

		return matchesSearchTerm;
	});

	// Load rooms when component mounts
	onMount(() => {
		// Initialize room management store with cached data (instant load)
		const cachedData = roomManagementStore.getCachedData();
		if (cachedData) {
			roomManagementStore.init(cachedData);
		}

		// Fetch fresh data (silent if we have cache, visible loading if not)
		loadRooms(!!cachedData);

		// Set up periodic silent refresh every 30 seconds
		const refreshInterval = setInterval(() => {
			loadRooms(true); // Always silent for periodic refresh
		}, 30000);

		// Cleanup interval on component destroy
		return () => {
			clearInterval(refreshInterval);
		};
	});
</script>



<div class="admin-room-creation-form-container">
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
						disabled={isCreating || !roomName || !building || !floor}
					>
						{#if isCreating}
							Creating...
						{:else}
							<span class="material-symbols-outlined">add_ad</span>
							Create Room
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
	<!-- All Rooms List -->
	<div class="admin-room-rooms-list-section">
		<div class="admin-room-section-header">
			<div class="section-header-content">
				<div class="section-title-group">
					<h2 class="admin-room-section-title">All Rooms</h2>
					<p class="admin-room-section-subtitle">All rooms in the system</p>
				</div>

				<!-- Search and Filter Container -->
				<div class="adminroom-filters-container">
					<!-- Search Input -->
					<div class="adminroom-search-container">
						<div class="adminroom-search-input-wrapper">
							<span class="material-symbols-outlined adminroom-search-icon">search</span>
							<input
								type="text"
								placeholder="Search by room name, building, or floor..."
								class="adminroom-search-input"
								bind:value={roomsSearchTerm}
							/>
							{#if roomsSearchTerm}
								<button
									type="button"
									class="adminroom-clear-search-button"
									on:click={() => (roomsSearchTerm = '')}
								>
									<span class="material-symbols-outlined">close</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		{#if isLoading}
			<div class="admin-room-loading">
				<span class="system-loader"></span>
				<p>Loading rooms...</p>
			</div>
		{:else if filteredRooms.length === 0}
			<div class="admin-room-empty-state">
				<span class="material-symbols-outlined">meeting_room</span>
				{#if existingRooms.length === 0}
					<p>No rooms found. Create your first room using the form above.</p>
				{:else}
					<p>No rooms found matching your search.</p>
				{/if}
			</div>
		{:else}
			<div class="admin-room-rooms-grid">
				{#each filteredRooms as room (room.id)}
					<div
						class="admin-room-room-card"
						class:editing={editingRoomId === room.id}
						id="admin-room-room-card-{room.id}"
					>
						<div class="admin-room-room-header">
							<div class="admin-room-room-title">
								<h3 class="admin-room-room-name">{room.name}</h3>
							</div>
							<div class="admin-room-action-buttons">
								<a href="#admin-room-room-card-{room.id}">
									<button
										type="button"
										class="admin-room-edit-button"
										on:click={() => toggleEditForm(room)}
										title={editingRoomId === room.id ? 'Cancel Edit' : 'Edit Room'}
									>
										<span class="material-symbols-outlined"
											>{editingRoomId === room.id ? 'close' : 'edit'}</span
										>
									</button>
								</a>
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
							{#if room.assignedSections && room.assignedSections.length > 0}
								<div class="admin-room-room-assignment">
									<span class="material-symbols-outlined">group</span>
									<span>Assigned to: {room.assignedSections.map((s) => s.name).join(', ')}</span>
								</div>
							{:else}
								<div class="admin-room-room-assignment">
									<span class="material-symbols-outlined">check_circle</span>
									<span>Available</span>
								</div>
							{/if}
							<div class="admin-room-room-created">
								<span class="material-symbols-outlined">schedule</span>
								<span>Created: {room.createdDate}</span>
							</div>
							{#if room.updatedDate && room.updatedDate !== room.createdDate}
								<div class="admin-room-room-updated">
									<span class="material-symbols-outlined">update</span>
									<span>Updated: {room.updatedDate}</span>
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

									<form
										class="admin-room-edit-form-content"
										on:submit|preventDefault={handleEditRoom}
									>
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
												<label class="admin-room-form-label" for="edit-floor"> Floor * </label>
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
											<button
												type="button"
												class="admin-room-cancel-button"
												on:click={() => toggleEditForm(room)}
											>
												Cancel
											</button>
											<button
												type="submit"
												class="admin-room-update-button"
												disabled={isUpdating || !editRoomName || !editBuilding || !editFloor}
											>
												{#if isUpdating}
													Updating...
												{:else}
													Update
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
