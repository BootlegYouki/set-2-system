<script>
	import './studentDocumentRequest.css';

	// Document request state
	let isRequestFormOpen = false;
	let selectedDocumentType = '';
	let requestPurpose = '';
	let isSubmitting = false;
	
	// Custom dropdown state
	let isDropdownOpen = false;
	
	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isDropdownOpen = false;
		}
	}
	
	// Toggle dropdown
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}
	
	// Select document type and close dropdown
	function selectDocumentType(docType) {
		selectedDocumentType = docType.id;
		isDropdownOpen = false;
	}

	// Document types
	const documentTypes = [
		{ id: 'transcript', name: 'Transcript', description: 'Official academic record' },
		{ id: 'enrollment', name: 'Enrollment Certificate', description: 'Proof of enrollment' },
		{ id: 'grade-report', name: 'Grade Report', description: 'Semester grade report' },
		{ id: 'diploma', name: 'Diploma', description: 'Official graduation certificate' },
		{ id: 'certificate', name: 'Certificate', description: 'Academic achievement certificate' }
	];

	// Request history data
	let requestHistory = [
		{
			id: 1,
			type: 'Transcript',
			purpose: 'Official transcript for graduate school application',
			requestedDate: '10/20/2023',
			completedDate: '10/22/2023',
			status: 'completed'
		},
		{
			id: 2,
			type: 'Enrollment Certificate',
			purpose: 'Current enrollment verification for scholarship',
			requestedDate: '10/18/2023',
			estimatedCompletion: '10/25/2023',
			status: 'processing'
		},
		{
			id: 3,
			type: 'Grade Report',
			purpose: 'Semester grade report',
			requestedDate: '10/15/2023',
			rejectionReason: 'Outstanding fees must be cleared first',
			status: 'rejected'
		}
	];

	function handleCancelRequest(requestId) {
		// Find and update the request status
		requestHistory = requestHistory.map(request => {
			if (request.id === requestId && request.status === 'processing') {
				return {
					...request,
					status: 'cancelled',
					cancelledDate: new Date().toLocaleDateString('en-US')
				};
			}
			return request;
		});
	}

	function toggleRequestForm() {
		isRequestFormOpen = !isRequestFormOpen;
		if (!isRequestFormOpen) {
			// Reset form when closing
			selectedDocumentType = '';
			requestPurpose = '';
			isDropdownOpen = false;
		}
	}

	function handleSubmitRequest() {
		if (!selectedDocumentType || !requestPurpose.trim()) return;
		
		isSubmitting = true;
		// Simulate API call
		setTimeout(() => {
			const newRequest = {
				id: requestHistory.length + 1,
				type: documentTypes.find(d => d.id === selectedDocumentType)?.name || selectedDocumentType,
				purpose: requestPurpose,
				requestedDate: new Date().toLocaleDateString('en-US'),
				status: 'processing'
			};
			requestHistory = [newRequest, ...requestHistory];
			isSubmitting = false;
			toggleRequestForm();
		}, 2000);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'completed': return 'var(--success)';
			case 'processing': return 'var(--warning)';
			case 'rejected': return 'var(--error)';
			case 'cancelled': return 'var(--md-sys-color-on-surface-variant)';
			default: return 'var(--md-sys-color-on-surface-variant)';
		}
	}

	function getStatusIcon(status) {
		switch (status) {
			case 'completed': return 'check_circle';
			case 'processing': return 'hourglass_empty';
			case 'rejected': return 'cancel';
			case 'cancelled': return 'block';
			default: return 'help';
		}
	}


</script>



<div class="document-request-container" on:click={handleClickOutside} on:keydown={handleClickOutside} role="button" tabindex="0">
	<!-- Header Section - Same style as grades page -->
	<div class="document-header">
		<div class="header-content">
			<h1 class="page-title">Document Requests</h1>
			<p class="page-subtitle">Request new documents or check existing requests</p>
		</div>
	</div>

	<!-- Quick Actions Section -->
	<div class="quick-actions-section">
		<div class="quick-actions-header">
			<h2 class="section-title">Quick Actions</h2>
			<p class="section-subtitle">Request new documents or check existing requests</p>
		</div>
		
		<button class="request-new-button" on:click={toggleRequestForm}>
			<span class="material-symbols-outlined">{isRequestFormOpen ? 'remove' : 'add'}</span>
			{isRequestFormOpen ? 'Cancel Request' : 'Request New Document'}
		</button>
	</div>

	<!-- Inline Document Request Form -->
	{#if isRequestFormOpen}
		<div class="request-form-section">
			<div class="form-container">
				<div class="form-header">
					<h2 class="form-title">New Document Request</h2>
					<p class="form-subtitle">Fill out the form below to request a document</p>
				</div>
				
				<div class="form-content">
					<div class="form-group">
						<label class="form-label">
							<span class="material-symbols-outlined form-icon">description</span>
							Document Type
						</label>
						
						<!-- Custom Dropdown -->
						<div class="custom-dropdown">
							<button class="dropdown-toggle" on:click={toggleDropdown}>
								<span>
									{#if selectedDocumentType}
										{documentTypes.find(d => d.id === selectedDocumentType)?.name || 'Select Document Type'}
									{:else}
										Choose the document you need
									{/if}
								</span>
								<span class="material-symbols-outlined dropdown-icon {isDropdownOpen ? 'open' : ''}">
									expand_more
								</span>
							</button>
							
							{#if isDropdownOpen}
								<div class="dropdown-menu-document">
									{#each documentTypes as docType}
										<button 
											class="dropdown-item {docType.id === selectedDocumentType ? 'selected' : ''}"
											on:click={() => selectDocumentType(docType)}
										>
											<div class="dropdown-item-content">
												<span class="dropdown-item-name">{docType.name}</span>
												<span class="dropdown-item-desc">{docType.description}</span>
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					
					<div class="form-group">
						<label class="form-label" for="description">
							<span class="material-symbols-outlined form-icon">edit_note</span>
							Purpose & Details
						</label>
						<textarea 
							id="description" 
							class="form-textarea enhanced" 
							bind:value={requestPurpose} 
							placeholder="Please describe the purpose of your request and any specific requirements..."
							rows="5"
						></textarea>
						<div class="form-help">
							<span class="material-symbols-outlined help-icon">info</span>
							Be specific about your needs to help us process your request efficiently
						</div>
					</div>
					
					<div class="form-actions">
						<button class="cancel-button" on:click={toggleRequestForm} disabled={isSubmitting}>
							Cancel
						</button>
						<button 
							class="submit-button" 
							on:click={handleSubmitRequest} 
							disabled={!selectedDocumentType || !requestPurpose.trim() || isSubmitting}
						>
							{#if isSubmitting}
								<span class="material-symbols-outlined spinning">hourglass_empty</span>
								Submitting...
							{:else}
								Submit Request
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Request History Section -->
	<div class="request-history-section">
		<h2 class="section-title">Request History</h2>
		
		<div class="request-history-grid">
			{#each requestHistory as request (request.id)}
				<div class="request-card {request.status}">
					<div class="request-main-content">
						<div class="request-status-icon" style="color: {getStatusColor(request.status)}">
							<span class="material-symbols-outlined">{getStatusIcon(request.status)}</span>
						</div>
						
						<div class="request-content">
							<div class="request-header">
								<div class="request-info">
									<h3 class="request-title">{request.type}</h3>
									<p class="request-date">Requested on {request.requestedDate}</p>
								</div>
								<div class="status-badge" style="background-color: {getStatusColor(request.status)}20; color: {getStatusColor(request.status)}">
									{request.status === 'completed' ? 'Completed' : 
									 request.status === 'processing' ? 'Processing' : 
									 request.status === 'rejected' ? 'Rejected' : 
									 request.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
								</div>
							</div>
							<p class="request-description">{request.purpose}</p>
						</div>
					</div>
					
					<!-- Status Footer with colored background -->
					{#if request.status === 'completed'}
						<div class="request-footer completed-footer">
							<span class="footer-info">Completed on {request.completedDate}</span>
							<button class="download-button">
								<span class="material-symbols-outlined">download</span>
								Download
							</button>
						</div>
					{:else if request.status === 'processing'}
						<div class="request-footer processing-footer">
							<span class="footer-info">Estimated completion: {request.estimatedCompletion}</span>
							<button class="cancel-request-button" on:click={() => handleCancelRequest(request.id)}>
								<span class="material-symbols-outlined">close</span>
								Cancel
							</button>
						</div>
					{:else if request.status === 'cancelled'}
						<div class="request-footer cancelled-footer">
							<span class="footer-info">Cancelled on {request.cancelledDate}</span>
						</div>
					{:else if request.status === 'rejected'}
						<div class="request-footer rejected-footer">
							<span class="footer-info">Reason: {request.rejectionReason}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>