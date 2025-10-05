<script>
	import { onMount } from 'svelte';
	import { authStore } from '../../../../login/js/auth.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import './studentDocumentRequest.css';

	// Document request state
	let isRequestFormOpen = false;
	let selectedDocumentType = '';
	let requestPurpose = '';
	let isSubmitting = false;
	
	// Custom dropdown state
	let isDropdownOpen = false;
	
	// Data state
	let requestHistory = [];
	let loading = true;
	let error = null;
	
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

	// Fetch document requests from API
	async function fetchDocumentRequests() {
		try {
			loading = true;
			error = null;

			if (!$authStore.userData?.id) {
				error = 'User not authenticated';
				return;
			}

			const result = await api.get(`/api/document-requests?student_id=${$authStore.userData.id}`);

			if (result.success) {
				requestHistory = result.data;
			} else {
				error = result.error || 'Failed to fetch document requests';
			}
		} catch (err) {
			console.error('Error fetching document requests:', err);
			error = 'Failed to load document requests. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Load data when component mounts
	onMount(() => {
		if ($authStore.userData?.id) {
			fetchDocumentRequests();
		} else {
			error = 'Please log in to view your document requests';
			loading = false;
		}
	});

	async function handleCancelRequest(requestId) {
		try {
			// Call API to cancel the request
			const response = await api.patch('/api/document-requests', {
				id: requestId,
				action: 'cancel'
			});

			if (response.success) {
				// Update the local state with the cancelled request
				requestHistory = requestHistory.map(request => {
					if (request.id === requestId) {
						return {
							...request,
							status: 'cancelled',
							cancelledDate: response.data.cancelledDate
						};
					}
					return request;
				});
			} else {
				console.error('Failed to cancel request:', response.error);
				// You could add a toast notification here for user feedback
			}
		} catch (error) {
			console.error('Error cancelling request:', error);
			// You could add a toast notification here for user feedback
		}
	}

	function toggleRequestForm() {
		isRequestFormOpen = !isRequestFormOpen;
		if (!isRequestFormOpen) {
			// Reset form when closing
			selectedDocumentType = '';
			requestPurpose = '';
			isDropdownOpen = false;
		} else {
			// Scroll to form when opening
			setTimeout(() => {
				const formElement = document.querySelector('.request-form-section');
				if (formElement) {
					formElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
				}
			}, 100); // Small delay to ensure the form is rendered
		}
	}

	async function handleSubmitRequest() {
		if (!selectedDocumentType || !requestPurpose.trim()) return;
		
		isSubmitting = true;
		
		try {
			const result = await api.post('/api/document-requests', {
				student_id: $authStore.userData.id,
				document_type: selectedDocumentType,
				purpose: requestPurpose
			});

			if (result.success) {
				// Add the new request to the beginning of the list
				requestHistory = [result.data, ...requestHistory];
				toggleRequestForm();
			} else {
				error = result.error || 'Failed to submit document request';
			}
		} catch (err) {
			console.error('Error submitting document request:', err);
			error = 'Failed to submit document request. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function getStatusIcon(status) {
		switch (status) {
			case 'completed': return 'check_circle';
			case 'processing': return 'sync';
			case 'pending': return 'hourglass_empty';
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

	<!-- Error Message -->
	{#if error}
		<div class="error-message">
			<span class="material-symbols-outlined">error</span>
			{error}
		</div>
	{/if}

	<!-- Quick Actions Section -->
	<div class="quick-actions-section">
		<div class="quick-actions-header">
			<h2 class="section-title">Quick Actions</h2>
			<p class="section-subtitle">Request new documents or check existing requests</p>
		</div>
		
		<button class="request-new-button" on:click={toggleRequestForm} disabled={loading}>
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
						<label class="form-label" for="document-type-dropdown">
							<span class="material-symbols-outlined form-icon">description</span>
							Document Type
						</label>
						
						<!-- Custom Dropdown -->
						<div class="custom-dropdown">
							<button id="document-type-dropdown" class="dropdown-toggle" on:click={toggleDropdown}>
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
											class="doc-dropdown-item {docType.id === selectedDocumentType ? 'selected' : ''}"
											on:click={() => selectDocumentType(docType)}
										>
											<div class="doc-dropdown-item-content">
												<span class="doc-dropdown-item-name">{docType.name}</span>
												<span class="doc-dropdown-item-desc">{docType.description}</span>
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
					
					<div class="document-form-actions">
						<button class="document-cancel-button" on:click={toggleRequestForm} disabled={isSubmitting}>
							Cancel
						</button>
						<button 
							class="submit-button" 
							on:click={handleSubmitRequest} 
							disabled={!selectedDocumentType || !requestPurpose.trim() || isSubmitting}
						>
							{#if isSubmitting}
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
		
		{#if loading}
			<div class="loading-message">
				<div class="system-loader"></div>
				Loading your document requests...
			</div>
		{:else if requestHistory.length === 0}
			<div class="no-requests-message">
				<span class="material-symbols-outlined">description</span>
				<p>No document requests found</p>
				<p class="subtitle">Start by requesting your first document above</p>
			</div>
		{:else}
			<div class="request-history-grid">
				{#each requestHistory as request, index (request.id)}
					<div class="request-card {request.status}" style="--card-index: {index + 1};">
						<div class="request-main-content">
							<div class="request-status-icon">
								<span class="material-symbols-outlined">{getStatusIcon(request.status)}</span>
							</div>
							
							<div class="request-content">
								<div class="request-header">
									<div class="request-info">
										<h3 class="request-title">{request.type}</h3>
										<p class="request-date">Requested on {request.requestedDate}</p>
									</div>
									<div class="student-status-badge status-{request.status}">
										{request.status === 'completed' ? 'Completed' : 
										 request.status === 'processing' ? 'Processing' : 
										 request.status === 'pending' ? 'Pending' : 
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
							</div>
						{:else if request.status === 'processing'}
							<div class="request-footer processing-footer">
								<span class="footer-info">Note: {request.adminNote || 'Processing your request'}</span>
							</div>
						{:else if request.status === 'pending'}
							<div class="request-footer pending-footer">
								<span class="footer-info">Awaiting review</span>
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
		{/if}
	</div>
</div>