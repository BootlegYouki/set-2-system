<script>
	import { onMount } from 'svelte';
	import './adminDocumentRequests.css';
	import { authenticatedFetch } from '../../../../../routes/api/helper/api-helper.js';
	import { modalStore } from '../../../../common/js/modalStore.js';

	// Dynamic data for document requests (fetched from API)
	let documentRequests = [];
	let isLoading = true;
	let error = null;

	// Static filter state (for UI only, no functionality yet)
	let searchTerm = '';
	let selectedStatusFilter = '';
	let selectedDocumentTypeFilter = '';
	let selectedGradeFilter = '';

	// Dropdown states
	let isStatusFilterDropdownOpen = false;
	let isDocumentTypeFilterDropdownOpen = false;
	let isGradeFilterDropdownOpen = false;

	// Static data for filter dropdowns
	const gradeLevels = [
		{ value: 7, label: 'Grade 7', description: 'Junior High School - First Year' },
		{ value: 8, label: 'Grade 8', description: 'Junior High School - Second Year' },
		{ value: 9, label: 'Grade 9', description: 'Junior High School - Third Year' },
		{ value: 10, label: 'Grade 10', description: 'Junior High School - Fourth Year' }
	];

	const documentTypes = [
		{ id: 'transcript', name: 'Transcript', description: 'Official academic record' },
		{ id: 'enrollment', name: 'Enrollment Certificate', description: 'Proof of enrollment' },
		{ id: 'grade-report', name: 'Grade Report', description: 'Semester grade report' },
		{ id: 'diploma', name: 'Diploma', description: 'Official graduation certificate' },
		{ id: 'certificate', name: 'Certificate', description: 'Academic achievement certificate' }
	];

	const requestStatuses = [
		{ id: 'pending', name: 'Pending', description: 'Awaiting review' },
		{ id: 'on_hold', name: 'On Hold', description: 'Temporarily suspended' },
		{ id: 'verifying', name: 'Verifying', description: 'Under verification' },
		{ id: 'processing', name: 'For Processing', description: 'Currently being processed' },
		{ id: 'for_pickup', name: 'For Pick Up', description: 'Ready for pickup' },
		{ id: 'released', name: 'Released', description: 'Successfully released' },
		{ id: 'completed', name: 'Completed', description: 'Ready for pickup/download' },
		{ id: 'rejected', name: 'Rejected', description: 'Request denied' },
		{ id: 'cancelled', name: 'Cancelled', description: 'Cancelled by student' }
	];

	// Dropdown options specifically for modal (order & labels match image)
	const modalStatuses = [
		{ id: 'on_hold', name: 'On Hold' },
		{ id: 'verifying', name: 'Verifying' },
		{ id: 'processing', name: 'For Processing' },
		{ id: 'for_pickup', name: 'For Pick Up' },
		{ id: 'released', name: 'Released' }
	];

	// Computed properties for filtering (static for now)
	$: selectedStatusFilterObj = requestStatuses.find((status) => status.id === selectedStatusFilter);
	$: selectedDocumentTypeFilterObj = documentTypes.find(
		(type) => type.id === selectedDocumentTypeFilter
	);
	$: selectedGradeFilterObj = gradeLevels.find((grade) => grade.value === selectedGradeFilter);

	// Static dropdown toggle functions
	function toggleStatusFilterDropdown() {
		isStatusFilterDropdownOpen = !isStatusFilterDropdownOpen;
		isDocumentTypeFilterDropdownOpen = false;
		isGradeFilterDropdownOpen = false;
	}

	function toggleDocumentTypeFilterDropdown() {
		isDocumentTypeFilterDropdownOpen = !isDocumentTypeFilterDropdownOpen;
		isStatusFilterDropdownOpen = false;
		isGradeFilterDropdownOpen = false;
	}

	function toggleGradeFilterDropdown() {
		isGradeFilterDropdownOpen = !isGradeFilterDropdownOpen;
		isStatusFilterDropdownOpen = false;
		isDocumentTypeFilterDropdownOpen = false;
	}

	// Static filter selection functions
	function selectStatusFilter(status) {
		if (status) {
			selectedStatusFilter = status.id;
		} else {
			selectedStatusFilter = '';
		}
		isStatusFilterDropdownOpen = false;
	}

	function selectDocumentTypeFilter(docType) {
		if (docType) {
			selectedDocumentTypeFilter = docType.id;
		} else {
			selectedDocumentTypeFilter = '';
		}
		isDocumentTypeFilterDropdownOpen = false;
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
		if (!event.target.closest('.admindocreq-status-filter')) {
			isStatusFilterDropdownOpen = false;
		}
		if (!event.target.closest('.admindocreq-doctype-filter')) {
			isDocumentTypeFilterDropdownOpen = false;
		}
		if (!event.target.closest('.admindocreq-grade-filter')) {
			isGradeFilterDropdownOpen = false;
		}
	}

	// Open modal using modal store
	function openModal(request) {
		modalStore.open('DocumentRequestModal', {
			title: 'Request Details',
			request: { ...request },
			requestStatuses: requestStatuses,
			modalStatuses: modalStatuses,
			onUpdate: updateRequestAPI,
			onReject: rejectRequestAPI
		}, {
			size: 'large',
			closable: true,
			backdrop: true
		});
	}

	// Fetch document requests from API
	async function fetchDocumentRequests() {
		try {
			isLoading = true;
			error = null;

			// Build query params
			const params = new URLSearchParams({ action: 'all' });
			
			if (searchTerm) {
				params.append('search', searchTerm);
			}
			if (selectedStatusFilter) {
				params.append('status', selectedStatusFilter);
			}
			if (selectedDocumentTypeFilter) {
				// Map document type ID to name
				const docType = documentTypes.find(dt => dt.id === selectedDocumentTypeFilter);
				if (docType) {
					params.append('documentType', docType.name);
				}
			}
			if (selectedGradeFilter) {
				params.append('gradeLevel', selectedGradeFilter);
			}

			const response = await authenticatedFetch(`/api/document-requests?${params.toString()}`);
			const result = await response.json();

			if (result.success) {
				documentRequests = result.data;
			} else {
				error = result.error || 'Failed to fetch document requests';
			}
		} catch (err) {
			console.error('Error fetching document requests:', err);
			error = 'Failed to load document requests';
		} finally {
			isLoading = false;
		}
	}

	// Update a document request
	async function updateRequestAPI(requestId, updateData) {
		try {
			const response = await authenticatedFetch('/api/document-requests', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'update',
					requestId,
					...updateData
				})
			});

			const result = await response.json();

			if (result.success) {
				// Refresh the list
				await fetchDocumentRequests();
				return true;
			} else {
				error = result.error || 'Failed to update request';
				return false;
			}
		} catch (err) {
			console.error('Error updating request:', err);
			error = 'Failed to update request';
			return false;
		}
	}

	// Reject a document request
	async function rejectRequestAPI(requestId) {
		try {
			const response = await authenticatedFetch('/api/document-requests', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'reject',
					requestId
				})
			});

			const result = await response.json();

			if (result.success) {
				// Refresh the list
				await fetchDocumentRequests();
				return true;
			} else {
				error = result.error || 'Failed to reject request';
				return false;
			}
		} catch (err) {
			console.error('Error rejecting request:', err);
			error = 'Failed to reject request';
			return false;
		}
	}

	// Track if component has mounted
	let hasMounted = false;

	// Load data on mount
	onMount(() => {
		fetchDocumentRequests();
		hasMounted = true;
	});

	// Debounced search - only re-fetch when search term changes after mount
	let searchTimeout;
	let lastSearchTerm = '';
	$: {
		if (hasMounted && searchTerm !== lastSearchTerm) {
			lastSearchTerm = searchTerm;
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				fetchDocumentRequests();
			}, 300);
		}
	}

	// Watch for filter changes - re-fetch when filters actually change after mount
	let lastStatusFilter = '';
	let lastDocTypeFilter = '';
	let lastGradeFilter = '';
	$: {
		if (hasMounted && 
		    (selectedStatusFilter !== lastStatusFilter || 
		     selectedDocumentTypeFilter !== lastDocTypeFilter || 
		     selectedGradeFilter !== lastGradeFilter)) {
			lastStatusFilter = selectedStatusFilter;
			lastDocTypeFilter = selectedDocumentTypeFilter;
			lastGradeFilter = selectedGradeFilter;
			fetchDocumentRequests();
		}
	}

</script>

<svelte:window onclick={handleClickOutside} />

<div class="admin-document-requests-container">
	<!-- Header -->
	<div class="admin-docreq-header">
		<div class="admin-header-content">
			<h1 class="admin-page-title">Document Requests</h1>
			<p class="admin-page-subtitle">Manage and process student document requests</p>
		</div>
	</div>

	<!-- Status Cards Section -->
	<div class="docreq-status-cards-section">
		<div class="docreq-status-cards-grid">
			<div class="docreq-status-card docreq-status-onhold">
				<div class="docreq-status-icon">
					<span class="material-symbols-outlined">pause_circle</span>
				</div>
				<div class="docreq-status-content">
					<h3 class="docreq-status-value">
						{documentRequests.filter(req => req.status === 'on_hold').length}
					</h3>
					<p class="docreq-status-label">On Hold</p>
				</div>
			</div>
			
			<div class="docreq-status-card docreq-status-verifying">
				<div class="docreq-status-icon">
					<span class="material-symbols-outlined">fact_check</span>
				</div>
				<div class="docreq-status-content">
					<h3 class="docreq-status-value">
						{documentRequests.filter(req => req.status === 'verifying').length}
					</h3>
					<p class="docreq-status-label">Verifying</p>
				</div>
			</div>
			
			<div class="docreq-status-card docreq-status-processing">
				<div class="docreq-status-icon">
					<span class="material-symbols-outlined">sync</span>
				</div>
				<div class="docreq-status-content">
					<h3 class="docreq-status-value">
						{documentRequests.filter(req => req.status === 'processing').length}
					</h3>
					<p class="docreq-status-label">Processing</p>
				</div>
			</div>
			
			<div class="docreq-status-card docreq-status-pickup">
				<div class="docreq-status-icon">
					<span class="material-symbols-outlined">hand_package</span>
				</div>
				<div class="docreq-status-content">
					<h3 class="docreq-status-value">
						{documentRequests.filter(req => req.status === 'for_pickup').length}
					</h3>
					<p class="docreq-status-label">For Pickup</p>
				</div>
			</div>
			
			<div class="docreq-status-card docreq-status-released">
				<div class="docreq-status-icon">
					<span class="material-symbols-outlined">check_circle</span>
				</div>
				<div class="docreq-status-content">
					<h3 class="docreq-status-value">
						{documentRequests.filter(req => req.status === 'released').length}
					</h3>
					<p class="docreq-status-label">Released</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters and Search Section -->
	<div class="admin-docreq-filters-section">
		<div class="admin-section-header">
			<h2 class="admin-section-title">Filter Requests</h2>
			<p class="admin-section-subtitle">Search and filter document requests</p>
		</div>

		<div class="admindocreq-filters-container">
			<!-- Search Input -->
			<div class="admindocreq-search-container">
				<input
					type="text"
					placeholder="Search by student name, ID, or document type..."
					class="admindocreq-search-input"
					bind:value={searchTerm}
				/>
				<span class="material-symbols-outlined admindocreq-search-icon">search</span>
			</div>

			<!-- Status Filter -->
			<div
				class="admindocreq-status-filter admindocreq-custom-dropdown"
				class:open={isStatusFilterDropdownOpen}
			>
				<button
					type="button"
					class="admindocreq-dropdown-trigger"
					class:selected={selectedStatusFilter}
					onclick={toggleStatusFilterDropdown}
				>
					{#if selectedStatusFilterObj}
						<div class="admindocreq-selected-option">
							<span class="material-symbols-outlined admindocreq-option-icon">filter_list</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{selectedStatusFilterObj.name}</span>
							</div>
						</div>
					{:else}
						<span class="admindocreq-placeholder">All Statuses</span>
					{/if}
					<span class="material-symbols-outlined admindocreq-dropdown-arrow">expand_more</span>
				</button>
				<div class="admindocreq-dropdown-menu">
					<button
						type="button"
						class="admindocreq-dropdown-option"
						class:selected={selectedStatusFilter === ''}
						onclick={() => selectStatusFilter(null)}
					>
						<span class="material-symbols-outlined admindocreq-option-icon">clear_all</span>
						<div class="admindocreq-option-content">
							<span class="admindocreq-option-name">All Statuses</span>
						</div>
					</button>
					{#each requestStatuses as status (status.id)}
						<button
							type="button"
							class="admindocreq-dropdown-option"
							class:selected={selectedStatusFilter === status.id}
							onclick={() => selectStatusFilter(status)}
						>
							<span class="material-symbols-outlined admindocreq-option-icon">filter_list</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{status.name}</span>
								<span class="admindocreq-option-description">{status.description}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Document Type Filter -->
			<div
				class="admindocreq-doctype-filter admindocreq-custom-dropdown"
				class:open={isDocumentTypeFilterDropdownOpen}
			>
				<button
					type="button"
					class="admindocreq-dropdown-trigger"
					class:selected={selectedDocumentTypeFilter}
					onclick={toggleDocumentTypeFilterDropdown}
				>
					{#if selectedDocumentTypeFilterObj}
						<div class="admindocreq-selected-option">
							<span class="material-symbols-outlined admindocreq-option-icon">description</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{selectedDocumentTypeFilterObj.name}</span>
							</div>
						</div>
					{:else}
						<span class="admindocreq-placeholder">All Document Types</span>
					{/if}
					<span class="material-symbols-outlined admindocreq-dropdown-arrow">expand_more</span>
				</button>
				<div class="admindocreq-dropdown-menu">
					<button
						type="button"
						class="admindocreq-dropdown-option"
						class:selected={selectedDocumentTypeFilter === ''}
						onclick={() => selectDocumentTypeFilter(null)}
					>
						<span class="material-symbols-outlined admindocreq-option-icon">clear_all</span>
						<div class="admindocreq-option-content">
							<span class="admindocreq-option-name">All Document Types</span>
						</div>
					</button>
					{#each documentTypes as docType (docType.id)}
						<button
							type="button"
							class="admindocreq-dropdown-option"
							class:selected={selectedDocumentTypeFilter === docType.id}
							onclick={() => selectDocumentTypeFilter(docType)}
						>
							<span class="material-symbols-outlined admindocreq-option-icon">description</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{docType.name}</span>
								<span class="admindocreq-option-description">{docType.description}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Grade Level Filter -->
			<div
				class="admindocreq-grade-filter admindocreq-custom-dropdown"
				class:open={isGradeFilterDropdownOpen}
			>
				<button
					type="button"
					class="admindocreq-dropdown-trigger"
					class:selected={selectedGradeFilter}
					onclick={toggleGradeFilterDropdown}
				>
					{#if selectedGradeFilterObj}
						<div class="admindocreq-selected-option">
							<span class="material-symbols-outlined admindocreq-option-icon">school</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{selectedGradeFilterObj.label}</span>
							</div>
						</div>
					{:else}
						<span class="admindocreq-placeholder">All Grades</span>
					{/if}
					<span class="material-symbols-outlined admindocreq-dropdown-arrow">expand_more</span>
				</button>
				<div class="admindocreq-dropdown-menu">
					<button
						type="button"
						class="admindocreq-dropdown-option"
						class:selected={selectedGradeFilter === ''}
						onclick={() => selectGradeFilter(null)}
					>
						<span class="material-symbols-outlined admindocreq-option-icon">clear_all</span>
						<div class="admindocreq-option-content">
							<span class="admindocreq-option-name">All Grades</span>
						</div>
					</button>
					{#each gradeLevels as grade (grade.value)}
						<button
							type="button"
							class="admindocreq-dropdown-option"
							class:selected={selectedGradeFilter === grade.value}
							onclick={() => selectGradeFilter(grade)}
						>
							<span class="material-symbols-outlined admindocreq-option-icon">school</span>
							<div class="admindocreq-option-content">
								<span class="admindocreq-option-name">{grade.label}</span>
								<span class="admindocreq-option-description">{grade.description}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Document Requests Section -->
	<div class="admin-docreq-requests-section">
		<div class="docreq-section-header">
			<div class="docreq-section-header-content">
				<div class="docreq-section-title-group">
					<h2 class="docreq-section-title">Document Requests</h2>
					<p class="docreq-section-subtitle">Manage and review all student document requests</p>
				</div>
			</div>
		</div>

		{#if error}
			<div style="padding: 20px; background: #fee; border-radius: 8px; color: #c33; margin: 20px 0;">
				<strong>Error:</strong> {error}
			</div>
		{/if}

		{#if isLoading}
			<div style="padding: 40px; text-align: center; color: #666;">
				<span class="material-symbols-outlined" style="font-size: 48px; animation: spin 1s linear infinite;">sync</span>
				<p>Loading document requests...</p>
			</div>
		{:else if documentRequests.length === 0}
			<div style="padding: 40px; text-align: center; color: #999;">
				<span class="material-symbols-outlined" style="font-size: 48px;">description</span>
				<p>No document requests found</p>
			</div>
		{:else}
			<div class="docreq-requests-grid">
				{#each documentRequests as request (request.id)}
					<div 
						class="docreq-request-card status-{request.status}-border" 
						onclick={() => openModal(request)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(request); }}
						role="button"
						tabindex="0"
					>
						<!-- Request Header -->
						<div class="docreq-request-header">
							<div class="docreq-request-info">
								<div class="docreq-student-info">
									<h3 class="docreq-student-name">{request.studentName}</h3>
								</div>
							</div>
							<div class="docreq-action-buttons">
								<div class="docreq-status-badge docreq-status-{request.status}">
									{#if request.status === 'on_hold'}
										<span class="material-symbols-outlined">pause_circle</span>
										<span>On Hold</span>
									{:else if request.status === 'verifying'}
										<span class="material-symbols-outlined">fact_check</span>
										<span>Verifying</span>
									{:else if request.status === 'processing'}
										<span class="material-symbols-outlined">sync</span>
										<span>For Processing</span>
									{:else if request.status === 'for_pickup'}
										<span class="material-symbols-outlined">hand_package</span>
										<span>For Pick up</span>
									{:else if request.status === 'released'}
										<span class="material-symbols-outlined">check_circle</span>
										<span>Released</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Request Details -->
						<div class="docreq-request-details">
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">badge</span>
								<span>{request.studentId}</span>
							</div>
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">school</span>
								<span>{request.gradeLevel}</span>
							</div>
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">description</span>
								<span>{request.documentType}</span>
							</div>
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">tag</span>
								<span>ID: {request.requestId}</span>
							</div>
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">calendar_today</span>
								<span>Requested: {request.submittedDate}</span>
							</div>
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">payments</span>
								<span>{request.payment}</span>
							</div>

							<!-- Tentative date shown on request card -->
							<div class="docreq-detail-item">
								<span class="material-symbols-outlined">event</span>
								<span>
									Tentative Date:
									{#if request.status === 'processing'}
										{request.tentativeDate || '--/--/----'}
									{:else}
										N/A
									{/if}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>