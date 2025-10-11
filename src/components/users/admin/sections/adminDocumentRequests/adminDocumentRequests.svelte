<script>
	import './adminDocumentRequests.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { onMount } from 'svelte';
	import { api } from '../../../../../routes/api/helper/api-helper.js';

	// Document requests state
	let searchTerm = '';
	let selectedStatusFilter = '';
	let selectedDocumentTypeFilter = '';
	let selectedGradeFilter = '';
	let documentRequests = [];
	let isLoading = true;
	let error = null;

	// Dropdown states
	let isStatusFilterDropdownOpen = false;
	let isDocumentTypeFilterDropdownOpen = false;
	let isGradeFilterDropdownOpen = false;

	// Grade levels for Philippines DepEd (Grades 7-10)
	const gradeLevels = [
		{ value: 7, label: 'Grade 7', description: 'Junior High School - First Year' },
		{ value: 8, label: 'Grade 8', description: 'Junior High School - Second Year' },
		{ value: 9, label: 'Grade 9', description: 'Junior High School - Third Year' },
		{ value: 10, label: 'Grade 10', description: 'Junior High School - Fourth Year' }
	];

	// Document types
	const documentTypes = [
		{ id: 'transcript', name: 'Transcript', description: 'Official academic record' },
		{ id: 'enrollment', name: 'Enrollment Certificate', description: 'Proof of enrollment' },
		{ id: 'grade-report', name: 'Grade Report', description: 'Semester grade report' },
		{ id: 'diploma', name: 'Diploma', description: 'Official graduation certificate' },
		{ id: 'certificate', name: 'Certificate', description: 'Academic achievement certificate' }
	];

	// Request statuses
	const requestStatuses = [
		{ id: 'pending', name: 'Pending', description: 'Awaiting review' },
		{ id: 'processing', name: 'Processing', description: 'Currently being processed' },
		{ id: 'completed', name: 'Completed', description: 'Ready for pickup/download' },
		{ id: 'rejected', name: 'Rejected', description: 'Request denied' },
		{ id: 'cancelled', name: 'Cancelled', description: 'Cancelled by student' }
	];

	// Mock document requests data
	// let documentRequests = [
	// 	{
	// 		id: 1,
	// 		studentName: 'Maria Santos',
	// 		studentId: 'STU-2024-001',
	// 		gradeLevel: 'Grade 10',
	// 		documentType: 'Transcript',
	// 		purpose: 'College application requirements',
	// 		requestDate: '01/15/2024',
	// 		status: 'pending'
	// 	},
	// 	{
	// 		id: 2,
	// 		studentName: 'Juan Dela Cruz',
	// 		studentId: 'STU-2024-002',
	// 		gradeLevel: 'Grade 9',
	// 		documentType: 'Enrollment Certificate',
	// 		purpose: 'Scholarship application',
	// 		requestDate: '01/14/2024',
	// 		completedDate: '01/16/2024',
	// 		status: 'completed'
	// 	},
	// 	{
	// 		id: 3,
	// 		studentName: 'Ana Reyes',
	// 		studentId: 'STU-2024-003',
	// 		gradeLevel: 'Grade 8',
	// 		documentType: 'Grade Report',
	// 		purpose: 'Transfer to another school',
	// 		requestDate: '01/13/2024',
	// 		approvalNote: 'Approved for transfer - all requirements met',
	// 		status: 'processing'
	// 	},
	// 	{
	// 		id: 4,
	// 		studentName: 'Carlos Garcia',
	// 		studentId: 'STU-2024-004',
	// 		gradeLevel: 'Grade 7',
	// 		documentType: 'Certificate',
	// 		purpose: 'Academic achievement recognition',
	// 		requestDate: '01/12/2024',
	// 		rejectionReason: 'Incomplete academic requirements',
	// 		status: 'rejected'
	// 	},
	// 	{
	// 		id: 5,
	// 		studentName: 'Sofia Mendoza',
	// 		studentId: 'STU-2024-005',
	// 		gradeLevel: 'Grade 10',
	// 		documentType: 'Diploma',
	// 		purpose: 'Employment requirements',
	// 		requestDate: '01/11/2024',
	// 		cancelledDate: '01/13/2024',
	// 		status: 'cancelled'
	// 	}
	// ];

	// Load document requests from API
	async function loadDocumentRequests() {
		isLoading = true;
		error = null;

		try {
			const data = await api.get('/api/document-requests?admin_view=true');
			documentRequests = data.data || [];
		} catch (err) {
			console.error('Error loading document requests:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	// Load data on component mount
	onMount(() => {
		loadDocumentRequests();
	});

	// Computed properties for filtering
	$: selectedStatusFilterObj = requestStatuses.find((status) => status.id === selectedStatusFilter);
	$: selectedDocumentTypeFilterObj = documentTypes.find(
		(type) => type.id === selectedDocumentTypeFilter
	);
	$: selectedGradeFilterObj = gradeLevels.find((grade) => grade.value === selectedGradeFilter);

	$: filteredRequests = documentRequests.filter((request) => {
		const matchesSearchTerm =
			request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.documentType.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus = selectedStatusFilter ? request.status === selectedStatusFilter : true;
		const matchesDocumentType = selectedDocumentTypeFilter
			? request.documentType.toLowerCase() ===
				documentTypes.find((t) => t.id === selectedDocumentTypeFilter)?.name.toLowerCase()
			: true;
		const matchesGrade = selectedGradeFilter
			? request.gradeLevel === `Grade ${selectedGradeFilter}`
			: true;

		return matchesSearchTerm && matchesStatus && matchesDocumentType && matchesGrade;
	});

	// Functions for dropdown toggles
	function toggleStatusFilterDropdown() {
		isStatusFilterDropdownOpen = !isStatusFilterDropdownOpen;
	}

	function toggleDocumentTypeFilterDropdown() {
		isDocumentTypeFilterDropdownOpen = !isDocumentTypeFilterDropdownOpen;
	}

	function toggleGradeFilterDropdown() {
		isGradeFilterDropdownOpen = !isGradeFilterDropdownOpen;
	}

	// Functions for filter selections
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

	// Handle request actions
	async function handleApproveRequest(requestId) {
		modalStore.prompt(
			'Approve Document Request',
			'Please provide an approval note (optional):',
			'Enter approval note...',
			async (note) => {
				try {
					const result = await api.patch('/api/document-requests', {
						id: requestId,
						action: 'approve',
						admin_note: note && note.trim() ? note.trim() : null
					});

					if (result.success) {
						// Update local state
						documentRequests = documentRequests.map((request) => {
							if (request.id === requestId && request.status === 'pending') {
								return {
									...request,
									status: 'processing',
									approvalNote:
										note && note.trim() ? note.trim() : 'Approved without additional notes'
								};
							}
							return request;
						});
						toastStore.success('Request approved and moved to processing');
					} else {
						toastStore.error(result.error || 'Failed to approve request');
					}
				} catch (err) {
					toastStore.error('Failed to approve request');
					console.error('Error approving request:', err);
				}
			},
			() => {
				// Do nothing on cancel
			},
			{ size: 'medium', allowEmpty: true }
		);
	}

	async function handleRejectRequest(requestId) {
		modalStore.prompt(
			'Reject Document Request',
			'Please provide a reason for rejecting this document request:',
			'Enter rejection reason...',
			async (reason) => {
				if (!reason || !reason.trim()) {
					toastStore.error('Please provide a rejection reason');
					return;
				}

				try {
					const result = await api.patch('/api/document-requests', {
						id: requestId,
						action: 'reject',
						rejection_reason: reason.trim()
					});

					if (result.success) {
						// Update local state
						documentRequests = documentRequests.map((request) => {
							if (request.id === requestId && request.status === 'pending') {
								return {
									...request,
									status: 'rejected',
									rejectionReason: reason.trim()
								};
							}
							return request;
						});
						toastStore.success('Request rejected successfully');
					} else {
						toastStore.error(result.error || 'Failed to reject request');
					}
				} catch (err) {
					toastStore.error('Failed to reject request');
					console.error('Error rejecting request:', err);
				}
			},
			() => {
				// Do nothing on cancel
			},
			{ size: 'medium' }
		);
	}

	async function handleCompleteRequest(requestId) {
		try {
			const result = await api.patch('/api/document-requests', {
				id: requestId,
				action: 'complete'
			});

			if (result.success) {
				// Update local state
				documentRequests = documentRequests.map((request) => {
					if (request.id === requestId && request.status === 'processing') {
						return {
							...request,
							status: 'completed',
							completedDate: new Date().toLocaleDateString('en-US')
						};
					}
					return request;
				});
				toastStore.success('Request marked as completed');
			} else {
				toastStore.error(result.error || 'Failed to complete request');
			}
		} catch (err) {
			toastStore.error('Failed to complete request');
			console.error('Error completing request:', err);
		}
	}

	// Handle click outside to close dropdowns
	// Handle remove request
	async function handleRemoveRequest(requestId) {
		modalStore.confirm(
			'Remove Document Request',
			'Are you sure you want to permanently remove this document request? This action cannot be undone.',
			async () => {
				try {
					const result = await api.delete('/api/document-requests', { id: requestId });

					if (result.success) {
						// Remove from local state
						documentRequests = documentRequests.filter((request) => request.id !== requestId);
						toastStore.success('Document request removed successfully');
					} else {
						toastStore.error(result.error || 'Failed to remove request');
					}
				} catch (err) {
					toastStore.error('Failed to remove request');
					console.error('Error removing request:', err);
				}
			},
			() => {
				// Do nothing on cancel
			}
		);
	}

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

	function getStatusIcon(status) {
		switch (status) {
			case 'completed':
				return 'check_circle';
			case 'processing':
				return 'sync';
			case 'pending':
				return 'hourglass_empty';
			case 'rejected':
				return 'cancel';
			case 'cancelled':
				return 'block';
			default:
				return 'help';
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'completed':
				return 'success';
			case 'processing':
				return 'info';
			case 'pending':
				return 'warning';
			case 'rejected':
				return 'error';
			case 'cancelled':
				return 'neutral';
			default:
				return 'neutral';
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="admin-document-requests-container">
	<!-- Header -->
	<div class="admin-docreq-header">
		<div class="admin-header-content">
			<h1 class="admin-page-title">Document Requests</h1>
			<p class="admin-page-subtitle">Manage and process student document requests</p>
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
					on:click={toggleStatusFilterDropdown}
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
						on:click={() => selectStatusFilter(null)}
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
							on:click={() => selectStatusFilter(status)}
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
					on:click={toggleDocumentTypeFilterDropdown}
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
						on:click={() => selectDocumentTypeFilter(null)}
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
							on:click={() => selectDocumentTypeFilter(docType)}
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
					on:click={toggleGradeFilterDropdown}
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
						on:click={() => selectGradeFilter(null)}
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
							on:click={() => selectGradeFilter(grade)}
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
		<div class="admin-section-header">
			<h2 class="admin-section-title">Document Requests ({filteredRequests.length})</h2>
			<p class="admin-section-subtitle">Manage student document requests</p>
		</div>

		{#if isLoading}
			<div class="admindocreq-loading">
				<div class="system-loader"></div>
				<p>Loading document requests...</p>
			</div>
		{:else if error}
			<div class="admindocreq-error">
				<span class="material-symbols-outlined admindocreq-error-icon">error</span>
				<p>{error}</p>
				<button class="admindocreq-retry-button" on:click={loadDocumentRequests}>
					<span class="material-symbols-outlined">refresh</span>
					Retry
				</button>
			</div>
		{:else}
			<div class="admindocreq-requests-grid">
				{#each filteredRequests as request (request.id)}
					<div class="admindocreq-request-card status-{request.status}-border">
						<div class="admindocreq-request-header">
							<div class="admindocreq-request-info">
								<div class="admindocreq-student-info">
									<h3 class="admindocreq-student-name">{request.studentName} · {request.type}</h3>
								</div>
							</div>
							<div class="admindocreq-action-buttons">
								<div class="admindocreq-status-badge admindocreq-status-{request.status}">
									<span class="material-symbols-outlined">{getStatusIcon(request.status)}</span>
									{request.status.charAt(0).toUpperCase() + request.status.slice(1)}
								</div>
							</div>
						</div>

						<div class="admindocreq-request-content">
							<div class="admindocreq-document-info">
								<div class="admindocreq-document-type">
									<span class="material-symbols-outlined">person</span>
									<span>{request.studentId} • {request.gradeLevel}</span>
								</div>
								<div class="admindocreq-request-date">
									<span class="material-symbols-outlined">calendar_today</span>
									<span>Requested: {request.requestedDate}</span>
								</div>
								{#if request.purpose}
									<div class="admindocreq-request-priority">
										<span class="material-symbols-outlined">info</span>
										<span>Purpose: {request.purpose}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Status-specific footer -->
						{#if request.status === 'pending'}
							<div class="admindocreq-request-actions">
								<button
									class="admindocreq-approve-button"
									on:click={() => handleApproveRequest(request.id)}
								>
									<span class="material-symbols-outlined">check_circle</span>
									Approve
								</button>
								<button
									class="admindocreq-reject-button"
									on:click={() => handleRejectRequest(request.id)}
								>
									<span class="material-symbols-outlined">cancel</span>
									Reject
								</button>
							</div>
						{:else if request.status === 'processing'}
							<div class="admindocreq-request-actions processing-footer">
								{#if request.adminNote}
									<span class="admindocreq-footer-info">Note: {request.adminNote}</span>
								{/if}
								<button
									class="admindocreq-complete-button"
									on:click={() => handleCompleteRequest(request.id)}
								>
									<span class="material-symbols-outlined">task_alt</span>
									Mark Complete
								</button>
							</div>
						{:else if request.status === 'completed'}
							<div class="admindocreq-request-actions completed-footer">
								<span class="admindocreq-footer-info"
									>Completed on {request.completedDate || 'N/A'}</span
								>
								<button
									class="admindocreq-action-btn remove-btn"
									on:click={() => handleRemoveRequest(request.id)}
									title="Remove request"
								>
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						{:else if request.status === 'rejected'}
							<div class="admindocreq-request-actions rejected-footer">
								<span class="admindocreq-footer-info">Reason: {request.rejectionReason}</span>
							</div>
						{:else if request.status === 'cancelled'}
							<div class="admindocreq-request-actions cancelled-footer">
								<span class="admindocreq-footer-info"
									>Cancelled on {request.cancelledDate || 'N/A'}</span
								>
								<button
									class="admindocreq-action-btn remove-btn"
									on:click={() => handleRemoveRequest(request.id)}
									title="Remove request"
								>
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<div class="admindocreq-no-results">
						<span class="material-symbols-outlined admindocreq-no-results-icon">search_off</span>
						<p>No document requests found matching your search criteria.</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
