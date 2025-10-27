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

	// Modal state
	let isModalOpen = false;
	let selectedRequest = null;
	let payProcessing = false;

	// Process Flow modal state
	let isProcessFlowOpen = false;

	// Chat input
	let newMessage = '';

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

			const result = await api.get('/api/document-requests?action=student');

			if (result.success) {
				// Map backend response to frontend format
				requestHistory = result.data.map(r => ({
					id: r.id,
					requestId: r.requestId,
					type: documentTypes.find(d => d.id === r.documentType)?.name ?? r.documentType,
					document_type: r.documentType,
					requestedDate: r.submittedDate,
					submittedDate: r.submittedDate,
					tentativeDate: r.tentativeDate,
					payment: r.payment,
					paymentAmount: parseFloat(r.payment?.replace('₱', '') || '120'),
					paymentStatus: r.paymentStatus,
					status: r.status,
					processedBy: r.processedBy,
					purpose: r.purpose,
					messages: r.messages || [],
					isUrgent: r.isUrgent || false
				}));
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
			const response = await api.post('/api/document-requests', {
				action: 'cancel',
				requestId: requestId
			});

			if (response.success) {
				// Refresh the list to get updated data
				await fetchDocumentRequests();
			} else {
				error = response.error || 'Failed to cancel request';
				console.error('Failed to cancel request:', response.error);
			}
		} catch (err) {
			error = 'Failed to cancel request. Please try again.';
			console.error('Error cancelling request:', err);
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
			}, 100);
		}
	}

	async function handleSubmitRequest() {
		if (!selectedDocumentType || !requestPurpose.trim()) return;
		
		isSubmitting = true;
		
		try {
			const result = await api.post('/api/document-requests', {
				action: 'create',
				documentType: selectedDocumentType,
				purpose: requestPurpose,
				paymentAmount: 120,
				isUrgent: false
			});

			if (result.success) {
				// Refresh the list to get the newly created request
				await fetchDocumentRequests();
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
			case 'released': return 'check_circle';
			case 'for_pickup': return 'inventory_2';
			case 'processing': return 'sync';
			case 'verifying': return 'fact_check';
			case 'on_hold': return 'hourglass_empty';
			case 'rejected': return 'cancel';
			case 'cancelled': return 'block';
			default: return 'help';
		}
	}

	// Open the details modal for a particular request
	function openRequestModal(request) {
		// ensure payment amount default is P120 if missing
		selectedRequest = {
			...request,
			paymentAmount: request.paymentAmount ?? 120,
			paymentStatus: request.paymentStatus ?? 'pending'
		};
		isModalOpen = true;
		newMessage = '';
	}

	function closeRequestModal() {
		isModalOpen = false;
		selectedRequest = null;
	}

	// Open process status flow modal
	function openProcessFlowModal() {
		isProcessFlowOpen = true;
	}

	function closeProcessFlowModal() {
		isProcessFlowOpen = false;
	}

	// Mock payment handler - replace with actual integration
	async function handlePay(event) {
		event?.stopPropagation();
		if (!selectedRequest) return;
		payProcessing = true;
		try {
			// Simulate network delay
			await new Promise(r => setTimeout(r, 900));
			// update local state
			requestHistory = requestHistory.map(r => r.id === selectedRequest.id ? { ...r, paymentStatus: 'paid' } : r);
			selectedRequest = { ...selectedRequest, paymentStatus: 'paid' };
		} catch (err) {
			console.error('Payment error', err);
		} finally {
			payProcessing = false;
		}
	}

	// Simple chat message send (locally updates; integrate with API)
	async function sendMessage() {
		if (!newMessage.trim() || !selectedRequest) return;
		const message = {
			id: Date.now(),
			author: $authStore.userData?.name ?? 'You',
			text: newMessage.trim(),
			created_at: new Date().toISOString()
		};
		// Append locally
		selectedRequest = {
			...selectedRequest,
			messages: [...(selectedRequest.messages || []), message]
		};
		requestHistory = requestHistory.map(r => r.id === selectedRequest.id ? selectedRequest : r);
		newMessage = '';

		// Optionally POST to server: await api.post('/api/document-requests/messages', { requestId: selectedRequest.id, message });
	}
</script>

<div class="document-request-container" on:click={handleClickOutside} on:keydown={handleClickOutside} role="button" tabindex="0">
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
										{request.status === 'released' ? 'Released' : 
										 request.status === 'for_pickup' ? 'For Pick Up' : 
										 request.status === 'processing' ? 'Processing' : 
										 request.status === 'verifying' ? 'Verifying' : 
										 request.status === 'on_hold' ? 'On Hold' : 
										 request.status === 'rejected' ? 'Rejected' : 
										 request.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
									</div>
								</div>
								<p class="request-description">{request.purpose}</p>
							</div>
						</div>
						
						<!-- Status Footer with colored background -->
						{#if request.status === 'released'}
							<div class="request-footer completed-footer">
								<span class="footer-info">
									Released{request.processedBy ? ` by ${request.processedBy}` : ''}
								</span>
							</div>
						{:else if request.status === 'for_pickup'}
							<div class="request-footer processing-footer">
								<span class="footer-info">
									Ready for pickup{request.processedBy ? ` - Processed by ${request.processedBy}` : ''}
								</span>
							</div>
						{:else if request.status === 'processing'}
							<div class="request-footer processing-footer">
								<span class="footer-info">
									{request.processedBy ? `Being processed by ${request.processedBy}` : 'Processing your request'}
									{#if request.tentativeDate}
										- Tentative: {request.tentativeDate}
									{/if}
								</span>
							</div>
						{:else if request.status === 'verifying'}
							<div class="request-footer processing-footer">
								<span class="footer-info">
									{request.processedBy ? `Being verified by ${request.processedBy}` : 'Verifying your request'}
								</span>
							</div>
						{:else if request.status === 'on_hold'}
							<div class="request-footer pending-footer">
								<span class="footer-info">Awaiting review</span>
								<button class="cancel-request-button" on:click|stopPropagation={() => handleCancelRequest(request.requestId)}>
									<span class="material-symbols-outlined">close</span>
									Cancel
								</button>
							</div>
						{:else if request.status === 'cancelled'}
							<div class="request-footer cancelled-footer">
								<span class="footer-info">Request cancelled</span>
							</div>
						{:else if request.status === 'rejected'}
							<div class="request-footer rejected-footer">
								<span class="footer-info">
									Request rejected{request.processedBy ? ` by ${request.processedBy}` : ''}
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Details Modal -->
{#if isModalOpen && selectedRequest}
	<div class="modal-overlay" on:click={closeRequestModal}>
		<div class="details-modal" on:click|stopPropagation>
			<header class="modal-header">
				<h2>Request Details</h2>
				<button class="modal-close" aria-label="Close" on:click={closeRequestModal}>✕</button>
			</header>

			<div class="modal-body">
				<div class="request-id">ID: {selectedRequest.id ?? '—'}</div>

				<div class="details-grid">
					<!-- Document Type -->
					<div class="info-box">
						<div class="info-title"><span class="material-symbols-outlined">description</span> Document Type</div>
						<div class="info-value">{selectedRequest.type}</div>
					</div>

					<!-- Status (clickable) -->
					<div class="info-box status-clickable" on:click={openProcessFlowModal} role="button" tabindex="0">
						<div class="info-title">
							<span class="material-symbols-outlined">info</span>
							Status
						</div>
						<div class="info-value status-row">
							<span class="status-badge status-{selectedRequest.status}">
								{selectedRequest.status === 'released' ? 'Released' : 
								 selectedRequest.status === 'for_pickup' ? 'For Pick Up' :
								 selectedRequest.status === 'processing' ? 'Processing' : 
								 selectedRequest.status === 'verifying' ? 'Verifying' : 
								 selectedRequest.status === 'on_hold' ? 'On Hold' : 
								 selectedRequest.status === 'rejected' ? 'Rejected' : 
								 selectedRequest.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
							</span>
						</div>
					</div>

					<!-- Tentative Date -->
					<div class="info-box">
						<div class="info-title"><span class="material-symbols-outlined">calendar_today</span> Tentative Date</div>
						<div class="info-value small-input">{selectedRequest.tentativeDate ?? 'N/A'}</div>
					</div>

					<!-- Payment -->
					<div class="info-box">
						<div class="info-title"><span class="material-symbols-outlined">payments</span> Payment</div>
						<div class="payment-row">
							<div class="payment-amount">₱{selectedRequest.paymentAmount ?? 120}</div>
							<div class="payment-status">
								<span class="pill payment-pill {selectedRequest.paymentStatus === 'paid' ? 'paid' : 'pending'}">
									{selectedRequest.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
								</span>
								<button class="pay-button" on:click={handlePay} disabled={selectedRequest.paymentStatus === 'paid' || payProcessing}>
									{#if payProcessing}Processing...{:else}Pay{/if}
								</button>
							</div>
						</div>
					</div>

					<!-- Processed By -->
					<div class="info-box wide">
						<div class="info-title"><span class="material-symbols-outlined">person</span> Processed By</div>
						<div class="info-value">{selectedRequest.processedBy ? selectedRequest.processedBy : '—'}</div>
					</div>
				</div>

				<!-- Purpose & details (font aligned to system fonts) -->
				<div class="purpose-section">
					<label class="purpose-label">Purpose & Details</label>
					<textarea readonly class="purpose-text purpose-text-aligned">{selectedRequest.purpose}</textarea>
				</div>

				<!-- Chat -->
				<div class="chat-section">
					<h3>Chat</h3>
					<div class="messages">
						{#if selectedRequest.messages && selectedRequest.messages.length}
							{#each selectedRequest.messages as msg}
								<div class="chat-message {msg.author === $authStore.userData?.name ? 'mine' : 'other'}">
									<div class="msg-author">{msg.author}</div>
									<div class="msg-text">{msg.text}</div>
									<div class="msg-time">{new Date(msg.created_at).toLocaleString()}</div>
								</div>
							{/each}
						{:else}
							<div class="no-chat">No messages yet</div>
						{/if}
					</div>

					<div class="chat-input-row">
						<button class="attach" title="Attach">📎</button>
						<input class="chat-input" placeholder="Type your message" bind:value={newMessage} on:keydown={(e) => e.key === 'Enter' && sendMessage()} />
						<button class="send" on:click={sendMessage} aria-label="Send">➤</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Process Status Flow Modal -->
{#if isProcessFlowOpen}
	<div class="modal-overlay" on:click={closeProcessFlowModal}>
		<div class="process-flow-modal" on:click|stopPropagation>
			<header class="modal-header">
				<h2>Process Status Flow</h2>
				<button class="modal-close" aria-label="Close" on:click={closeProcessFlowModal}>✕</button>
			</header>
			<div class="modal-body">
				<ul class="process-flow-list">
					<li><span class="swatch yellow"></span><strong>On Hold</strong> - The document is on hold. Wait for the admin to take further action.</li>
					<li><span class="swatch blue"></span><strong>Verifying</strong> - The document request is currently being verified.</li>
					<li><span class="swatch orange"></span><strong>For Processing</strong> - The document is in the processing stage.</li>
					<li><span class="swatch cyan"></span><strong>For Pick Up</strong> - The document is ready and available for pick up.</li>
					<li><span class="swatch green"></span><strong>Released</strong> - The document has been released to the requester.</li>
					<li><span class="swatch red"></span><strong>Rejected</strong> - The document request has been rejected. Please check for any issues or contact the admin for more information.</li>
				</ul>
			</div>
		</div>
	</div>
{/if}