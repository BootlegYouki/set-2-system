<script>
	import './adminDocumentRequests.css';

	// Mock data for document requests (matching the image)
	let documentRequests = [
		{
			id: 1,
			studentId: 'STU-2024-001',
			gradeLevel: 'Grade 10',
			studentName: 'Tungpalan, Danel M.',
			documentType: 'Transcript',
			requestId: 'REQ-002',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'on_hold',
			tentativeDate: null,
			isUrgent: false,
			purpose: 'Official transcript for graduate school application',
			dateOfBirth: 'November 1, 1992',
			processedBy: 'Admin Sarah'
		},
		{
			id: 2,
			studentId: 'STU-2024-002',
			gradeLevel: 'Grade 10',
			studentName: 'Tungpalan, Danel M.',
			documentType: 'TOR',
			requestId: 'REQ-003',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'verifying',
			tentativeDate: null,
			isUrgent: false,
			purpose: 'Transfer',
			dateOfBirth: 'November 1, 1992',
			processedBy: 'Admin Sarah'
		},
		{
			id: 3,
			studentId: 'STU-2024-003',
			gradeLevel: 'Grade 10',
			studentName: 'Tungpalan, Danel M.',
			documentType: 'Grade Slip',
			requestId: 'REQ-004',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'processing',
			tentativeDate: null, // processing but not yet set -> show --/--/----
			isUrgent: false,
			purpose: 'School requirement',
			dateOfBirth: 'November 1, 1992',
			processedBy: 'Admin Sarah'
		},
		{
			id: 4,
			studentId: 'STU-2024-004',
			gradeLevel: 'Grade 10',
			studentName: 'Tungpalan, Danel M.',
			documentType: 'Good Moral',
			requestId: 'REQ-001',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'for_pickup',
			tentativeDate: null,
			isUrgent: false,
			purpose: 'Official transcript for graduate school application',
			dateOfBirth: 'November 1, 1992',
			processedBy: 'Admin Sarah'
		}
	];

	// Static filter state (for UI only, no functionality yet)
	let searchTerm = '';
	let selectedStatusFilter = '';
	let selectedDocumentTypeFilter = '';
	let selectedGradeFilter = '';

	// Dropdown states
	let isStatusFilterDropdownOpen = false;
	let isDocumentTypeFilterDropdownOpen = false;
	let isGradeFilterDropdownOpen = false;

	// Modal status dropdown state
	let isModalStatusDropdownOpen = false;

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

	// Handle click outside to close dropdowns (added modal dropdown check)
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
		// modal status dropdown (close when click outside modal status dropdown)
		if (!event.target.closest('.admindocreq-modal .admindocreq-status-dropdown')) {
			isModalStatusDropdownOpen = false;
		}
	}

	// --- Modal state and functions (added) ---
	let showModal = false;
	let selectedRequest = null;
	let dateInputEl; // ref to hidden date input inside modal

	function openModal(request) {
		// set the selected request and open modal
		selectedRequest = { ...request }; // shallow copy to allow local edits before commit
		showModal = true;
		isModalStatusDropdownOpen = false;
		document.body.style.overflow = 'hidden';
	}

	function closeModal() {
		showModal = false;
		selectedRequest = null;
		isModalStatusDropdownOpen = false;
		document.body.style.overflow = '';
	}

	// Close modal on ESC
	function onKeydown(event) {
		if (event.key === 'Escape') {
			if (isModalStatusDropdownOpen) {
				isModalStatusDropdownOpen = false;
				return;
			}
			if (showModal) {
				closeModal();
			}
		}
	}

	// Mock chat messages for the modal (per request we could map real messages)
	function chatMessagesForRequest(requestId) {
		// simple mock: latest message only
		return [
			{
				id: 1,
				author: 'Admin Sarah',
				authorRole: 'admin',
				text: 'Your request is ready for pick up',
				time: '10/8/2025, 10:30:00 AM'
			}
		];
	}

	// Modal status dropdown functions
	function toggleModalStatusDropdown() {
		isModalStatusDropdownOpen = !isModalStatusDropdownOpen;
	}

	function selectModalStatus(statusId) {
		if (!selectedRequest) return;
		selectedRequest.status = statusId;
		// if status is not processing, clear tentativeDate; if processing, leave current tentativeDate (null means placeholder)
		if (statusId !== 'processing') {
			selectedRequest.tentativeDate = null;
		}
		isModalStatusDropdownOpen = false;
	}

	// Date handling for tentativeDate
	function openDatePicker() {
		// only allow when status is processing
		if (!selectedRequest || selectedRequest.status !== 'processing') return;
		// trigger the hidden date input
		dateInputEl && dateInputEl.click();
	}

	function onTentativeDateChange(event) {
		const val = event.target.value; // yyyy-mm-dd
		if (!selectedRequest) return;
		selectedRequest.tentativeDate = val ? val : null;
	}

	function formatTentativeDateForDisplay(dateStr, status) {
		// if not processing -> N/A
		if (status !== 'processing') return 'N/A';
		// if processing and no date -> placeholder
		if (!dateStr) return '--/--/----';
		// dateStr is 'YYYY-MM-DD' -> return MM/DD/YYYY
		const [y, m, d] = dateStr.split('-');
		if (!y || !m || !d) return '--/--/----';
		return `${m}/${d}/${y}`;
	}

	// Action handlers for modal buttons — currently mock (update local state)
	function updateRequest() {
		if (!selectedRequest) return;
		// locate in array and update (commit changes)
		const idx = documentRequests.findIndex((r) => r.requestId === selectedRequest.requestId);
		if (idx !== -1) {
			documentRequests[idx] = { ...documentRequests[idx], ...selectedRequest };
		}
		closeModal();
	}

	function rejectRequest() {
		if (!selectedRequest) return;
		const idx = documentRequests.findIndex((r) => r.requestId === selectedRequest.requestId);
		if (idx !== -1) {
			documentRequests[idx] = { ...documentRequests[idx], status: 'rejected', tentativeDate: null };
		}
		closeModal();
	}

	// helper to get status name for selectedRequest in modal
	$: modalCurrentStatusName = selectedRequest
		? (requestStatuses.find((s) => s.id === selectedRequest.status) || {}).name || 'Select'
		: 'Select';

</script>

<svelte:window on:click={handleClickOutside} on:keydown={onKeydown} />

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
		<div class="docreq-section-header">
			<div class="docreq-section-header-content">
				<div class="docreq-section-title-group">
					<h2 class="docreq-section-title">Document Requests</h2>
					<p class="docreq-section-subtitle">Manage and review all student document requests</p>
				</div>
			</div>
		</div>

		<div class="docreq-requests-grid">
			{#each documentRequests as request (request.id)}
				<div class="docreq-request-card status-{request.status}-border" on:click={() => openModal(request)}>
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

						<!-- Tentative date shown on request card (reflects modal changes) -->
						<div class="docreq-detail-item">
							<span class="material-symbols-outlined">event</span>
							<span>
								Tentative Date:
								{#if request.status === 'processing'}
									{request.tentativeDate ? formatTentativeDateForDisplay(request.tentativeDate, request.status) : '--/--/----'}
								{:else}
									N/A
								{/if}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Modal (opens when clicking a request card) -->
{#if showModal && selectedRequest}
	<div class="admindocreq-modal" role="dialog" aria-modal="true" on:click|self={closeModal}>
		<div class="admindocreq-modal-panel" on:click|stopPropagation>
			<button class="admindocreq-modal-close" aria-label="Close" on:click={closeModal}>✕</button>

			<div class="admindocreq-modal-grid">
				<!-- Left column -->
				<div class="admindocreq-modal-left">
					<header class="admindocreq-modal-title">
						<h2>Request Details</h2>
						<div class="admindoc-modal-sub">ID: <span>{selectedRequest.requestId}</span></div>
					</header>

					<div class="admindocreq-cards">
						<div class="admindocreq-card">
							<div class="card-label"><span class="material-symbols-outlined">description</span> Document Type</div>
							<div class="card-value">{selectedRequest.documentType}</div>
						</div>

						<!-- Status card with dropdown (new) -->
						<div class="admindocreq-card">
							<div class="card-label"><span class="material-symbols-outlined">info</span> Status</div>
							<div class="card-value">
								<div class="admindocreq-status-dropdown" class:open={isModalStatusDropdownOpen} aria-haspopup="listbox" aria-expanded={isModalStatusDropdownOpen}>
									<button class="admindocreq-status-dropdown-trigger" on:click={toggleModalStatusDropdown} aria-label="Change status">
										<span class="admindocreq-status-dropdown-label">{modalCurrentStatusName}</span>
										<span class="material-symbols-outlined admindocreq-status-dropdown-caret">{isModalStatusDropdownOpen ? 'expand_less' : 'expand_more'}</span>
									</button>

									<div class="admindocreq-status-dropdown-menu" role="listbox" aria-label="Select status">
										{#each modalStatuses as st (st.id)}
											<button
												type="button"
												class="admindocreq-status-item"
												on:click={() => selectModalStatus(st.id)}
												role="option"
												aria-selected={selectedRequest.status === st.id}
											>
												<span class="status-dot {st.id}"></span>
												<span class="status-text">{st.name}</span>
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- Tentative Date card (clickable only if status === 'processing') -->
						<div class="admindocreq-card">
							<div class="card-label"><span class="material-symbols-outlined">event</span> Tentative Date</div>
							<div class="card-value">
								<!-- visible box; clicking triggers hidden date input only when processing -->
								<div
									class="date-box"
									class:disabled={selectedRequest.status !== 'processing'}
									on:click={() => { if (selectedRequest.status === 'processing') openDatePicker(); }}
									role="button"
									tabindex={selectedRequest.status === 'processing' ? 0 : -1}
								>
									{selectedRequest.status === 'processing'
										? (selectedRequest.tentativeDate ? formatTentativeDateForDisplay(selectedRequest.tentativeDate, selectedRequest.status) : '--/--/----')
										: 'N/A'}
								</div>

								<!-- native date input (hidden) -->
								<input
									type="date"
									bind:this={dateInputEl}
									on:change={onTentativeDateChange}
									style="position:absolute; opacity:0; pointer-events:none; width:0; height:0;"
								/>
							</div>
						</div>

						<div class="admindocreq-card">
							<div class="card-label"><span class="material-symbols-outlined">payments</span> Payment</div>
							<div class="card-value">{selectedRequest.payment} <span class="badge orange">Pending</span></div>
						</div>

						<div class="admindocreq-card">
							<div class="card-label"><span class="material-symbols-outlined">account_circle</span> Processed By</div>
							<div class="card-value">{selectedRequest.processedBy ?? '—'}</div>
						</div>
					</div>

					<div class="admindocreq-purpose" style="margin-top: 12px;">
						<label>Purpose & Details</label>
						<p class="purpose-text">{selectedRequest.purpose ?? '—'}</p>
					</div>

					<div class="admindocreq-chat" style="margin-top: 12px;">
						<h3>Chat</h3>
						<div class="chat-messages">
							{#each chatMessagesForRequest(selectedRequest.requestId) as msg (msg.id)}
								<div class="chat-message">
									<div class="chat-author">{msg.author}</div>
									<div class="chat-text">{msg.text}</div>
									<div class="chat-time">{msg.time}</div>
								</div>
							{/each}
						</div>

						<div class="chat-input" style="margin-top:8px;">
							<button class="attach-btn" title="Attach">📎</button>
							<input placeholder="Type your message" />
							<button class="send-btn" title="Send">➤</button>
						</div>
					</div>
				</div>

				<!-- Right column -->
				<div class="admindocreq-modal-right">
					<div class="student-info-card">
						<h3><span class="material-symbols-outlined">school</span> Student Information</h3>

						<div class="student-field">
							<div class="field-label">Student ID</div>
							<div class="field-value">{selectedRequest.studentId}</div>
						</div>

						<div class="student-field">
							<div class="field-label">Full Name</div>
							<div class="field-value">{selectedRequest.studentName}</div>
						</div>

						<div class="student-field">
							<div class="field-label">Grade & Section</div>
							<div class="field-value">{selectedRequest.gradeLevel}</div>
						</div>
s
						<div class="student-field">
							<div class="field-label">Date of birth</div>
							<div class="field-value">{selectedRequest.dateOfBirth ?? '—'}</div>
						</div>
					</div>

					<div class="action-buttons">
						<button class="admindocreq-approve-button" on:click={updateRequest}>Update Request</button>
						<button class="admindocreq-reject-button" on:click={rejectRequest}>Reject Request</button>
						<button class="admindocreq-complete-button" on:click={closeModal}>Back</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}