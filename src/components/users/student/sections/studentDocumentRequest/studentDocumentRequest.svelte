<script>
	import { onMount } from 'svelte';
	import { authStore } from '../../../../login/js/auth.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { studentDocReqModalStore } from './studentDocumentRequestModal/studentDocReqModalStore.js';
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

	// Document types - aligned with admin system
	const documentTypes = [
		{ id: 'Transcript of Records (TOR)', name: 'Transcript of Records (TOR)', description: 'Official academic record' },
		{ id: 'Enrollment Certificate', name: 'Enrollment Certificate', description: 'Proof of enrollment' },
		{ id: 'Grade Report', name: 'Grade Report', description: 'Semester grade report' },
		{ id: 'Diploma', name: 'Diploma', description: 'Official graduation certificate' },
		{ id: 'Certificate', name: 'Certificate', description: 'Academic achievement certificate' },
		{ id: 'Good Moral', name: 'Good Moral', description: 'Certificate of good moral character' },
		{ id: 'Grade Slip', name: 'Grade Slip', description: 'Grade slip for specific period' }
	];

	// Load data when component mounts
	onMount(() => {
		if ($authStore.userData?.id) {
			fetchDocumentRequests();
		} else {
			error = 'Please log in to view your document requests';
			loading = false;
		}
	});

	// Fetch student's document requests from API
	async function fetchDocumentRequests() {
		try {
			loading = true;
			error = null;

			const response = await api.get('/api/document-requests?action=student');
			
			if (response.success) {
				// Transform data to match UI expectations
				requestHistory = response.data.map(req => ({
					id: req.id,
					requestId: req.requestId,
					type: req.documentType,
					purpose: req.purpose,
					status: mapStatusToUI(req.status),
					requestedDate: req.submittedDate,
					completedDate: req.completedDate,
					cancelledDate: req.cancelledDate,
					tentativeDate: req.tentativeDate,
					payment: req.payment, // Can be "Tentative" or "₱XXX"
					paymentAmount: req.paymentAmount, // Can be null or number
					paymentStatus: req.paymentStatus || 'pending',
					processedBy: req.processedBy,
					adminName: req.processedBy,
					adminNote: req.adminNote,
					rejectionReason: req.rejectionReason,
					messages: req.messages || []
				}));
			} else {
				error = response.error || 'Failed to load document requests';
			}
		} catch (err) {
			console.error('Error fetching document requests:', err);
			toastStore.error('Failed to load document requests');
		} finally {
			loading = false;
		}
	}

	// Keep backend status as-is (matching admin system)
	function mapStatusToUI(backendStatus) {
		return backendStatus;
	}
	
	// Get status display name
	function getStatusDisplayName(status) {
		const statusNames = {
			'on_hold': 'On Hold',
			'verifying': 'Verifying',
			'processing': 'For Processing',
			'for_pickup': 'For Pick Up',
			'released': 'Released',
			'rejected': 'Rejected',
			'cancelled': 'Cancelled'
		};
		return statusNames[status] || status;
	}
	
	// Format date helper
	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	}

	// Submit new document request
	async function handleSubmitRequest() {
		if (!selectedDocumentType || !requestPurpose.trim()) return;

		try {
			isSubmitting = true;
			error = null;

			const docTypeName = documentTypes.find(d => d.id === selectedDocumentType)?.name;

			const response = await api.post('/api/document-requests', {
				action: 'create',
				documentType: docTypeName || selectedDocumentType,
				purpose: requestPurpose.trim(),
				paymentAmount: null, // Tentative until admin sets the fee
				isUrgent: false
			});

			if (response.success) {
				// Close form and reset
				toggleRequestForm();
				
				// Refresh the request history
				await fetchDocumentRequests();
				
				// Show success toast notification
				toastStore.success('Document request submitted successfully');
			} else {
				toastStore.error(response.error || 'Failed to submit request');
			}
		} catch (err) {
			console.error('Error submitting request:', err);
			toastStore.error('Failed to submit document request');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCancelRequest(request) {
		// Show confirmation modal before cancelling
		modalStore.confirm(
			'Cancel Document Request',
			`<p>Are you sure you want to cancel your request for <strong>"${request.type}"</strong>?</p>
			<p style="margin-top: 8px; color: var(--md-sys-color-on-surface-variant); font-size: 0.9rem;">This action cannot be undone. The request will be marked as cancelled.</p>`,
			async () => {
				try {
					const response = await api.post('/api/document-requests', {
						action: 'cancel',
						requestId: request.requestId
					});

					if (response.success) {
						// Refresh the request list
						await fetchDocumentRequests();
						toastStore.success('Document request cancelled successfully');
					} else {
						console.error('Failed to cancel request:', response.error);
						toastStore.error(response.error || 'Failed to cancel request');
					}
				} catch (err) {
					console.error('Error cancelling request:', err);
					toastStore.error('Failed to cancel request');
				}
			}
		);
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
			}, 100);
		}
	}


	function getStatusIcon(status) {
		switch (status) {
			case 'on_hold': return 'pause_circle';
			case 'verifying': return 'fact_check';
			case 'processing': return 'sync';
			case 'for_pickup': return 'hand_package';
			case 'released': return 'check_circle';
			case 'rejected': return 'cancel';
			case 'cancelled': return 'block';
			default: return 'help';
		}
	}

	// Open the details modal for a particular request
	async function openRequestModal(request) {
		try {
			// Fetch the full request details including latest messages
			const response = await api.get(`/api/document-requests?action=single&requestId=${request.requestId}`);
			
			if (response.success) {
				// Pass the request data as-is (paymentAmount can be null)
				const requestData = {
					...response.data,
					type: response.data.documentType,
					requestedDate: response.data.submittedDate,
					paymentAmount: response.data.paymentAmount, // Can be null (tentative)
					paymentStatus: response.data.paymentStatus ?? 'pending'
				};
				
				studentDocReqModalStore.open(
					requestData,
					handleCancelRequestInModal,
					fetchDocumentRequests
				);
			} else {
				console.error('Failed to fetch request details:', response.error);
				toastStore.error('Failed to load request details. Please try again.');
			}
		} catch (error) {
			console.error('Error fetching request details:', error);
			toastStore.error('An error occurred while loading the request details.');
		}
	}

	// Handle cancel request from modal
	async function handleCancelRequestInModal(request) {
		try {
			const response = await api.post('/api/document-requests', {
				action: 'cancel',
				requestId: request.requestId
			});

			if (response.success) {
				await fetchDocumentRequests();
				toastStore.success('Document request cancelled successfully');
			} else {
				console.error('Failed to cancel request:', response.error);
				toastStore.error(response.error || 'Failed to cancel request');
			}
		} catch (err) {
			console.error('Error cancelling request:', err);
			toastStore.error('Failed to cancel request');
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="document-request-container" on:click={handleClickOutside} on:keydown={handleClickOutside}>
	<!-- Header Section -->
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
						maxlength="200"
					></textarea>
					<div class="form-help">
						<span class="material-symbols-outlined help-icon">info</span>
						Be specific about your needs to help us process your request efficiently
						<span class="char-counter">{requestPurpose.length}/200</span>
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
		
		{#if error}
			<div class="error-message" style="padding: 20px; background: #fee; border-radius: 8px; color: #c33; margin: 20px 0;">
				<strong>Error:</strong> {error}
			</div>
		{/if}
		
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
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="request-card {request.status}" style="--card-index: {index + 1};" on:click={() => openRequestModal(request)}>
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
										{getStatusDisplayName(request.status)}
									</div>
								</div>
							</div>
						</div>
						
						<!-- Status Footer with colored background -->
						{#if request.status === 'released' || request.status === 'for_pickup'}
							<div class="request-footer completed-footer">
								<span class="footer-info">
									{request.status === 'released' ? 'Released' : 'Ready for pick up'}{request.processedBy ? ` by ${request.processedBy}` : ''}
								</span>
							</div>
						{:else if request.status === 'processing' || request.status === 'verifying'}
							<div class="request-footer processing-footer">
								<span class="footer-info">
									{#if request.adminNote}
										Note{request.processedBy ? ` by ${request.processedBy}` : ''}: {request.adminNote}
									{:else}
										{request.processedBy ? `Being ${request.status === 'verifying' ? 'verified' : 'processed'} by ${request.processedBy}` : `${request.status === 'verifying' ? 'Verifying' : 'Processing'} your request`}
									{/if}
									{#if request.tentativeDate && request.status === 'processing'}
										<span> • Tentative: {request.tentativeDate}</span>
									{/if}
								</span>
							</div>
					{:else if request.status === 'on_hold'}
						<div class="request-footer pending-footer">
							<span class="footer-info">Awaiting review</span>
						</div>
						{:else if request.status === 'cancelled'}
							<div class="request-footer cancelled-footer">
								<span class="footer-info">Cancelled on {request.cancelledDate || formatDate(request.submittedDate)}</span>
							</div>
						{:else if request.status === 'rejected'}
							<div class="request-footer rejected-footer">
								<span class="footer-info">
									Rejected{request.processedBy ? ` by ${request.processedBy}` : ''}{request.rejectionReason ? `: ${request.rejectionReason}` : ''}
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>