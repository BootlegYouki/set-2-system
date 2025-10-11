<script>
	import './adminDocumentRequests.css';

	// Mock data for document requests (matching the image)
	let documentRequests = [
		{
			id: 1,
			studentId: 'STU-2024-001',
			gradeLevel: 'Grade 10',
			studentName: 'Johny Bravo',
			documentType: 'Transcript',
			requestId: 'REQ-002',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'on_hold',
			isUrgent: false
		},
		{
			id: 2,
			studentId: 'STU-2024-001',
			gradeLevel: 'Grade 10',
			studentName: 'Johny Bravo',
			documentType: 'TOR',
			requestId: 'REQ-002',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'verifying',
			isUrgent: false
		},
		{
			id: 3,
			studentId: 'STU-2024-001',
			gradeLevel: 'Grade 10',
			studentName: 'Johny Bravo',
			documentType: 'Grade Slip',
			requestId: 'REQ-002',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'processing',
			isUrgent: false
		},
		{
			id: 4,
			studentId: 'STU-2024-001',
			gradeLevel: 'Grade 10',
			studentName: 'Johny Bravo',
			documentType: 'Good Moral',
			requestId: 'REQ-002',
			submittedDate: '01/15/2024',
			payment: '₱120',
			status: 'for_pickup',
			isUrgent: false
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
		{ id: 'processing', name: 'Processing', description: 'Currently being processed' },
		{ id: 'for_pickup', name: 'For Pickup', description: 'Ready for pickup' },
		{ id: 'released', name: 'Released', description: 'Successfully released' },
		{ id: 'completed', name: 'Completed', description: 'Ready for pickup/download' },
		{ id: 'rejected', name: 'Rejected', description: 'Request denied' },
		{ id: 'cancelled', name: 'Cancelled', description: 'Cancelled by student' }
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
				<div class="docreq-request-card status-{request.status}-border">
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
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
