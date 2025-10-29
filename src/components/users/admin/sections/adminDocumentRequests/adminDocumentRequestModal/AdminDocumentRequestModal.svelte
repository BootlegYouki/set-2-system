<script>
	import { createEventDispatcher } from 'svelte';
	import { authenticatedFetch } from '../../../../../../routes/api/helper/api-helper.js';
	import Modal from '../../../../../common/Modal.svelte';

	// Props passed from modal store
	let {
		request = {},
		requestStatuses = [],
		modalStatuses = [],
		onUpdate = () => {},
		onReject = () => {},
		onClose = () => {}
	} = $props();

	const dispatch = createEventDispatcher();

	// Local state for the modal
	let selectedRequest = $state({ ...request });
	let isModalStatusDropdownOpen = $state(false);
	let dateInputEl = $state();
	let newMessage = $state('');
	let isSendingMessage = $state(false);
	let chatMessagesEl = $state();
	let pollingInterval;
	let showConfirmModal = $state(false);
	let showRejectModal = $state(false);
	let isPaymentEditable = $state(false);

	// Get messages from the request
	let messages = $derived(selectedRequest.messages || []);

	// Scroll to bottom of chat
	function scrollToBottom() {
		if (chatMessagesEl) {
			setTimeout(() => {
				chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
			}, 100);
		}
	}

	// Send a new message
	async function sendMessage() {
		if (!newMessage.trim() || isSendingMessage) return;

		isSendingMessage = true;
		try {
			const response = await authenticatedFetch('/api/document-requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'sendMessage',
					requestId: selectedRequest.requestId,
					message: newMessage.trim()
				})
			});

			const result = await response.json();

			if (result.success) {
				// Add the new message to the local state
				selectedRequest.messages = [...(selectedRequest.messages || []), result.data];
				newMessage = '';
				scrollToBottom();
			} else {
				console.error('Failed to send message:', result.error);
				alert('Failed to send message. Please try again.');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			alert('An error occurred while sending the message.');
		} finally {
			isSendingMessage = false;
		}
	}

	// Status dropdown functions
	function toggleModalStatusDropdown() {
		isModalStatusDropdownOpen = !isModalStatusDropdownOpen;
	}

	function selectModalStatus(statusId) {
		if (!selectedRequest) return;
		selectedRequest.status = statusId;
		// Keep tentative date when status changes - don't clear it
		isModalStatusDropdownOpen = false;
	}

	// Date handling
	function onTentativeDateChange(event) {
		const val = event.target.value;
		if (!selectedRequest) return;
		selectedRequest.tentativeDate = val ? val : null;
	}

	function formatTentativeDateForDisplay(dateStr) {
		if (!dateStr) return '--/--/----';
		const [y, m, d] = dateStr.split('-');
		if (!y || !m || !d) return '--/--/----';
		return `${m}/${d}/${y}`;
	}

	// Action handlers
	function handleUpdate() {
		// Show confirmation modal before updating
		showConfirmModal = true;
	}

	async function confirmUpdate() {
		const updateData = {
			status: selectedRequest.status,
			tentativeDate: selectedRequest.tentativeDate,
			paymentAmount: selectedRequest.paymentAmount
		};
		await onUpdate(selectedRequest.requestId, updateData);
		showConfirmModal = false;
		onClose();
	}

	function cancelUpdate() {
		showConfirmModal = false;
	}

	function handleReject() {
		// Show confirmation modal before rejecting
		showRejectModal = true;
	}

	async function confirmReject() {
		await onReject(selectedRequest.requestId);
		showRejectModal = false;
		onClose();
	}

	function cancelReject() {
		showRejectModal = false;
	}

	// Get current status name
	let modalCurrentStatusName = $derived(
		selectedRequest
			? (requestStatuses.find((s) => s.id === selectedRequest.status) || {}).name || 'Select'
			: 'Select'
	);

	// Handle click outside dropdown
	function handleClickOutside(event) {
		if (!event.target.closest('.docreq-status-dropdown')) {
			isModalStatusDropdownOpen = false;
		}
	}

	// Handle ESC key for dropdown
	function handleKeydown(event) {
		if (event.key === 'Escape' && isModalStatusDropdownOpen) {
			isModalStatusDropdownOpen = false;
		}
	}

	// Toggle payment edit mode
	function togglePaymentEdit() {
		isPaymentEditable = !isPaymentEditable;
	}

	// Fetch latest messages from server
	async function fetchLatestMessages() {
		if (!selectedRequest || isSendingMessage) return;

		try {
			const response = await authenticatedFetch(`/api/document-requests?action=single&requestId=${selectedRequest.requestId}`, {
				method: 'GET'
			});

			const result = await response.json();
			
			if (result.success && result.data.messages) {
				const currentMessageIds = new Set(messages.map(m => m.id));
				const newMessages = result.data.messages.filter(m => !currentMessageIds.has(m.id));
				
				// Only update if there are new messages
				if (newMessages.length > 0) {
					selectedRequest.messages = result.data.messages;
					scrollToBottom();
				}
			}
		} catch (error) {
			console.error('Error fetching latest messages:', error);
		}
	}

	// Handle visibility change - pause polling when tab is not visible
	function handleVisibilityChange() {
		if (document.hidden) {
			// Tab is hidden, clear the interval
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
		} else {
			// Tab is visible again, restart polling if not already running
			if (!pollingInterval) {
				// Fetch immediately when tab becomes visible
				fetchLatestMessages();
				pollingInterval = setInterval(fetchLatestMessages, 8000);
			}
		}
	}

	// Start polling when component mounts
	$effect(() => {
		// Poll every 8 seconds for new messages (reduced from 3s to reduce server load)
		pollingInterval = setInterval(fetchLatestMessages, 8000);
		
		// Listen for visibility changes to pause polling when tab is hidden
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		// Scroll to bottom when messages change
		scrollToBottom();

		// Cleanup on unmount
		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="docreq-modal-content">
	<div class="docreq-modal-grid">
		<!-- LEFT CONTAINER: Request Information -->
		<div class="docreq-modal-left-container">
			<header class="docreq-modal-title">
				<h2>Request Details</h2>
				<div class="docreq-modal-sub">ID: <span>{selectedRequest.requestId}</span></div>
			</header>



		<!-- Request Info Cards -->
		<div class="docreq-cards">
			<div class="docreq-card">
				<div class="card-label">
					<span class="material-symbols-outlined">description</span> Document Type
				</div>
				<div class="card-value">{selectedRequest.documentType}</div>
			</div>

			<div class="docreq-card">
				<div class="card-label">
					<span class="material-symbols-outlined">account_circle</span> Processed By
				</div>
				<div class="card-value">{selectedRequest.processedBy ?? '—'}</div>
			</div>

			<!-- Status card with dropdown -->
				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">info</span> Status
					</div>
					<div class="card-value">
						<div
							class="docreq-status-dropdown"
							class:open={isModalStatusDropdownOpen}
							aria-haspopup="listbox"
							aria-expanded={isModalStatusDropdownOpen}
						>
							<button
								class="docreq-status-dropdown-trigger"
								onclick={toggleModalStatusDropdown}
								aria-label="Change status"
								disabled={selectedRequest.status === 'cancelled' || selectedRequest.status === 'rejected'}
							>
								<span class="docreq-status-dropdown-label">{modalCurrentStatusName}</span>
								<span class="material-symbols-outlined docreq-status-dropdown-caret">
									{isModalStatusDropdownOpen ? 'expand_less' : 'expand_more'}
								</span>
							</button>

							<div class="docreq-status-dropdown-menu" role="listbox" aria-label="Select status">
								{#each modalStatuses as st (st.id)}
									<button
										type="button"
										class="docreq-status-item"
										onclick={() => selectModalStatus(st.id)}
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

			<!-- Tentative Date card -->
			{#if ['verifying', 'processing', 'for_pickup'].includes(selectedRequest.status) || selectedRequest.tentativeDate}
			<div class="docreq-card">
				<div class="card-label">
					<span class="material-symbols-outlined">event</span> Tentative Date
				</div>
				<div class="card-value">
					{#if ['verifying', 'processing', 'for_pickup'].includes(selectedRequest.status)}
						<input
							type="date"
							class="date-input editable"
							bind:this={dateInputEl}
							value={selectedRequest.tentativeDate || ''}
							onchange={onTentativeDateChange}
						/>
					{:else}
						<div class="date-box readonly">
							{formatTentativeDateForDisplay(selectedRequest.tentativeDate)}
						</div>
					{/if}
				</div>
			</div>
			{/if}

			<div class="docreq-card">
				<div class="card-label">
					<span class="material-symbols-outlined">payments</span> Payment Amount
				</div>
				<div class="card-value">
					<div class="payment-display-container">
						{#if isPaymentEditable}
							<div class="payment-input-wrapper">
								<span class="currency-symbol">₱</span>
								<input
									type="number"
									class="payment-input"
									bind:value={selectedRequest.paymentAmount}
									min="0"
									step="0.01"
									placeholder="Set fee amount..."
								/>
							</div>
						{:else}
							<div class="payment-readonly">
								{#if selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== undefined}
									₱{selectedRequest.paymentAmount}
								{:else}
									<span class="not-set">Not set</span>
								{/if}
							</div>
						{/if}
						<button 
							class="payment-edit-btn" 
							onclick={togglePaymentEdit}
							title={isPaymentEditable ? 'Save' : 'Edit payment amount'}
							aria-label={isPaymentEditable ? 'Save' : 'Edit payment amount'}
						>
							<span class="material-symbols-outlined">
								{isPaymentEditable ? 'check' : 'edit'}
							</span>
						</button>
					</div>
			</div>
		</div>

			{#if selectedRequest.status === 'cancelled' && selectedRequest.cancelledDate}
				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">event_busy</span> Cancelled Date
					</div>
					<div class="card-value">{selectedRequest.cancelledDate}</div>
				</div>
				{/if}
			</div>

			<!-- Purpose Section -->
			<div class="docreq-purpose">
				<div class="purpose-label">Purpose & Details</div>
				<p class="purpose-text">{selectedRequest.purpose ?? '—'}</p>
			</div>

			<!-- Action Buttons -->
			<div class="action-buttons">
				<button 
					class="docreq-approve-button" 
					onclick={handleUpdate}
					disabled={selectedRequest.status === 'cancelled' || selectedRequest.status === 'rejected'}
				>
					<span class="material-symbols-outlined">check_circle</span>
					Update Request
				</button>
				<button 
					class="docreq-reject-button" 
					onclick={handleReject}
					disabled={selectedRequest.status === 'cancelled' || selectedRequest.status === 'rejected'}
				>
					<span class="material-symbols-outlined">cancel</span>
					Reject Request
				</button>
				<button class="docreq-complete-button" onclick={onClose}>
					<span class="material-symbols-outlined">arrow_back</span>
					Back
				</button>
			</div>
		</div>

		<!-- RIGHT CONTAINER: Student Info & Chat -->
		<div class="docreq-modal-right-container">
			<!-- Student Information Section -->
			<div class="student-info-section">
				<h3><span class="material-symbols-outlined">school</span> Student Information</h3>
				
				<div class="student-info-grid">
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
						<div class="field-value">
							{selectedRequest.gradeLevel} - {selectedRequest.section || 'N/A'}
						</div>
					</div>

					<div class="student-field">
						<div class="field-label">Date of birth</div>
						<div class="field-value">{selectedRequest.dateOfBirth ?? '—'}</div>
					</div>
				</div>
			</div>

			<div class="chat-container">
				<div class="chat-header">
					<h3><span class="material-symbols-outlined">forum</span> Communication</h3>
					<span class="chat-count-badge">{messages.length}</span>
				</div>

				<div class="admin-chat-messages" bind:this={chatMessagesEl}>
					{#if messages.length > 0}
						{#each messages as msg (msg.id)}
							<div class="chat-message {msg.authorRole || 'student'}">
								<div class="chat-message-header">
									<div class="chat-author-info">
										<span class="material-symbols-outlined chat-avatar-icon">
											{msg.authorRole === 'admin' ? 'admin_panel_settings' : 'account_circle'}
										</span>
										<div class="chat-author-details">
											<span class="chat-author">{msg.author}</span>
											<span class="chat-role-badge">{msg.authorRole || 'student'}</span>
										</div>
									</div>
									<div class="chat-time">
										<span class="material-symbols-outlined time-icon">schedule</span>
										{new Date(msg.created_at).toLocaleString()}
									</div>
								</div>
								<div class="chat-text">{msg.text}</div>
							</div>
						{/each}
					{:else}
						<div class="no-chat">
							<span class="material-symbols-outlined">chat_bubble_outline</span>
							<p>No messages yet</p>
							<p class="subtitle">Start a conversation with the student</p>
						</div>
					{/if}
				</div>

				<div class="admin-chat-input">
					<button class="attach-btn" title="Attach file" aria-label="Attach file">
						<span class="material-symbols-outlined">attach_file</span>
					</button>
					<input 
						placeholder="Type your message..." 
						aria-label="Message input"
						bind:value={newMessage}
						onkeydown={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage()}
						disabled={isSendingMessage}
					/>
					<button 
						class="send-btn" 
						title="Send message" 
						aria-label="Send message"
						onclick={sendMessage}
						disabled={isSendingMessage || !newMessage.trim()}
					>
						<span class="material-symbols-outlined">send</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Confirmation Modal for Update -->
{#if showConfirmModal}
	<Modal 
		title="Confirm Update" 
		size="small" 
		closable={true}
		onClose={cancelUpdate}
	>
		<div class="modal-confirm-content">
			<div class="modal-message">
				<p>Are you sure you want to update this document request?</p>
				<div class="confirm-details">
					<div class="confirm-detail-row">
						<span class="detail-label">Request ID:</span>
						<span class="detail-value">{selectedRequest.requestId}</span>
					</div>
					<div class="confirm-detail-row">
						<span class="detail-label">New Status:</span>
						<span class="detail-value">{modalCurrentStatusName}</span>
					</div>
					{#if selectedRequest.tentativeDate}
					<div class="confirm-detail-row">
						<span class="detail-label">Tentative Date:</span>
						<span class="detail-value">{formatTentativeDateForDisplay(selectedRequest.tentativeDate)}</span>
					</div>
					{/if}
					<div class="confirm-detail-row">
						<span class="detail-label">Payment Amount:</span>
						<span class="detail-value">
							{#if selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== undefined}
								₱{selectedRequest.paymentAmount}
							{:else}
								Tentative (not set)
							{/if}
						</span>
					</div>
				</div>
			</div>
			<div class="modal-actions">
				<button class="modal-btn modal-btn-secondary" onclick={cancelUpdate}>
					Cancel
				</button>
				<button class="modal-btn modal-btn-primary" onclick={confirmUpdate}>
					Confirm
				</button>
			</div>
		</div>
	</Modal>
{/if}

<!-- Confirmation Modal for Reject -->
{#if showRejectModal}
	<Modal 
		title="Reject Request" 
		size="small" 
		closable={true}
		onClose={cancelReject}
	>
		<div class="modal-confirm-content">
			<div class="modal-message">
				<p>Are you sure you want to reject this document request?</p>
				<div class="confirm-details reject-warning">
					<div class="confirm-detail-row">
						<span class="detail-label">Request ID:</span>
						<span class="detail-value">{selectedRequest.requestId}</span>
					</div>
					<div class="confirm-detail-row">
						<span class="detail-label">Student:</span>
						<span class="detail-value">{selectedRequest.studentName}</span>
					</div>
					<div class="confirm-detail-row">
						<span class="detail-label">Document Type:</span>
						<span class="detail-value">{selectedRequest.documentType}</span>
					</div>
					<div class="reject-notice">
						<span class="material-symbols-outlined">warning</span>
						<span>This action will mark the request as rejected and notify the student.</span>
					</div>
				</div>
			</div>
			<div class="modal-actions">
				<button class="modal-btn modal-btn-secondary" onclick={cancelReject}>
					Cancel
				</button>
				<button class="modal-btn modal-btn-danger" onclick={confirmReject}>
					Reject Request
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.docreq-modal-content {
		width: 100%;
		max-width: 1400px;
		background-color: var(--md-sys-color-surface-container-high);
		border-radius: var(--radius-xl);
		border: none;
		box-shadow: var(--shadow-lg);
		position: relative;
		max-height: 96vh;
		overflow-y: hidden;
		display: flex;
		flex-direction: column;
	}

	.docreq-modal-close-button:hover {
		background-color: var(--md-sys-color-surface-container-highest);
		transform: scale(1.1);
	}

	.docreq-modal-close-button:active {
		transform: scale(0.95);
	}

	.docreq-modal-close-button .material-symbols-outlined {
		font-size: 24px;
	}

	.docreq-modal-grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: var(--spacing-xl);
		align-items: start;
		padding: var(--spacing-xl);
		flex: 1;
	}

	.docreq-modal-left-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.docreq-modal-right-container {
		display: flex;
		flex-direction: column;
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.docreq-modal-title h2 {
		margin: 0 0 6px 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.docreq-modal-sub {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
		margin-top: 6px;
	}

	.docreq-cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}

	.docreq-card {
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		flex: 1 1 calc(50% - var(--spacing-md) / 2);
		min-width: 250px;
	}

	/* First row: 2 cards (Document Type, Processed By) */
	.docreq-card:nth-child(1),
	.docreq-card:nth-child(2) {
		flex: 1 1 calc(50% - var(--spacing-md) / 2);
	}

	/* Second row: 3 cards (Status, Tentative Date if shown, Payment Amount) */
	.docreq-card:nth-child(3),
	.docreq-card:nth-child(4),
	.docreq-card:nth-child(5) {
		flex: 1 1 calc(33.333% - var(--spacing-md) * 2 / 3);
		min-width: 200px;
	}

	.card-label {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.card-value {
		margin-top: 8px;
		font-weight: 600;
		font-size: 1rem;
		width: 100%;
	}

	.docreq-purpose {
		margin-top: var(--spacing-sm);
	}

	.purpose-label {
		display: block;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: 6px;
		font-weight: 500;
	}

	.purpose-text {
		background: var(--md-sys-color-surface);
		padding: 12px;
		border-radius: var(--radius-md);
		border: 1px dashed var(--md-sys-color-outline-variant);
		margin: 0;
	}	

	/* Student Information Section */
	.student-info-section {
		padding: var(--spacing-md);
		background-color: var(--md-sys-color-surface);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		margin-bottom: var(--spacing-md);
	}

	.student-info-section h3 {
		display: flex;
		gap: 8px;
		align-items: center;
		margin: 0 0 var(--spacing-md) 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.student-info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md);
	}

	/* Chat Container - Full height */
	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.chat-header {
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		margin-bottom: var(--spacing-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--md-sys-color-on-surface);
	}

	.chat-header .material-symbols-outlined {
		font-size: 24px;
	}

	.chat-count-badge {
		background: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.admin-chat-messages {
		flex: 1;
		background: var(--md-sys-color-surface);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		overflow-y: auto;
		margin-bottom: var(--spacing-sm);
		min-height: 300px;
		max-height: 300px;
	}

	.no-chat {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xl);
		color: var(--md-sys-color-on-surface-variant);
		text-align: center;
		min-height: 200px;
	}

	.no-chat .material-symbols-outlined {
		font-size: 48px;
		opacity: 0.5;
		margin-bottom: var(--spacing-sm);
	}

	.no-chat p {
		margin: 4px 0;
	}

	.no-chat .subtitle {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.chat-message {
		background: var(--md-sys-color-surface-container);
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--md-sys-color-primary);
		color: var(--md-sys-color-on-surface);
		transition: all var(--transition-fast);
	}

	.chat-message:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-left-color: var(--md-sys-color-primary);
	}

	.chat-message.admin {
		border-left-color: var(--md-sys-color-tertiary);
	}

	.chat-message.admin:hover {
		border-left-color: var(--md-sys-color-tertiary);
	}

	.chat-message:last-child {
		margin-bottom: 0;
	}

	.chat-message-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-sm);
		gap: var(--spacing-sm);
	}

	.chat-author-info {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
		flex: 1;
	}

	.chat-avatar-icon {
		color: var(--md-sys-color-primary);
		font-size: 32px;
		background: var(--md-sys-color-primary-container);
		padding: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.chat-message.admin .chat-avatar-icon {
		color: var(--md-sys-color-tertiary);
		background: var(--md-sys-color-tertiary-container);
	}

	.chat-author-details {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.chat-author {
		color: var(--md-sys-color-on-surface);
		font-weight: 600;
		font-size: 0.95rem;
	}

	.chat-role-badge {
		display: inline-block;
		background: var(--md-sys-color-secondary-container);
		color: var(--md-sys-color-on-secondary-container);
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		width: fit-content;
	}

	.chat-text {
		color: var(--md-sys-color-on-surface);
		line-height: 1.6;
		font-size: 0.95rem;
		padding-left: 48px;
	}

	.chat-time {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.75rem;
		white-space: nowrap;
		opacity: 0.8;
	}

	.time-icon {
		font-size: 16px;
	}

	.admin-chat-input {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--md-sys-color-surface);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		align-items: center;
	}

	.admin-chat-input input {
		flex: 1;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
		transition: border-color var(--transition-fast);
	}

	.admin-chat-input input:focus {
		outline: none;
		border-color: var(--md-sys-color-primary);
	}

	.admin-chat-input input::placeholder {
		color: var(--md-sys-color-on-surface-variant);
		opacity: 0.7;
	}

	.attach-btn,
	.send-btn {
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		min-height: 40px;
	}

	.attach-btn:hover,
	.send-btn:hover:not(:disabled) {
		background: var(--md-sys-color-primary-container);
		border-color: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary-container);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.student-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 500;
	}

	.field-value {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--md-sys-color-on-surface);
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-lg);
		border-top: 2px solid var(--md-sys-color-outline-variant);
	}

	.docreq-approve-button {
		width: 100%;
		padding: 14px var(--spacing-md);
		border-radius: var(--radius-md);
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: none;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		transition: all var(--transition-normal);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-approve-button .material-symbols-outlined {
		font-size: 22px;
	}

	.docreq-approve-button:hover {
		background: var(--md-sys-color-primary);
		opacity: 0.9;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.docreq-approve-button:active {
		transform: translateY(0);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-approve-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--md-sys-color-surface-variant);
		color: var(--md-sys-color-on-surface-variant);
	}

	.docreq-approve-button:disabled:hover {
		transform: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-reject-button {
		width: 100%;
		padding: 14px var(--spacing-md);
		border-radius: var(--radius-md);
		background: var(--md-sys-color-error);
		color: var(--md-sys-color-on-error);
		border: none;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		transition: all var(--transition-normal);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-reject-button .material-symbols-outlined {
		font-size: 22px;
	}

	.docreq-reject-button:hover {
		background: var(--md-sys-color-error);
		opacity: 0.9;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.docreq-reject-button:active {
		transform: translateY(0);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-reject-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--md-sys-color-surface-variant);
		color: var(--md-sys-color-on-surface-variant);
	}

	.docreq-reject-button:disabled:hover {
		transform: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.docreq-complete-button {
		width: 100%;
		padding: 14px var(--spacing-md);
		border-radius: var(--radius-md);
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		transition: all var(--transition-normal);
	}

	.docreq-complete-button .material-symbols-outlined {
		font-size: 22px;
	}

	.docreq-complete-button:hover {
		background-color: var(--md-sys-color-surface-container-highest);
		border-color: var(--md-sys-color-outline);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.docreq-complete-button:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.badge {
		background: var(--md-sys-color-surface-container);
		padding: 6px 8px;
		border-radius: 8px;
		font-size: 0.875rem;
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		display: inline-block;
		margin-left: 8px;
	}

	.badge.orange {
		background: var(--status-pending-bg);
		color: var(--status-pending-text);
	}

	/* Status dropdown */
	.docreq-status-dropdown {
		position: relative;
		display: inline-block;
		width: 100%;
	}

	.docreq-status-dropdown-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		min-width: 120px;
		justify-content: space-between;
		box-sizing: border-box;
		min-width: 100%;
	}

	.docreq-status-dropdown-trigger:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
	}

	.docreq-status-dropdown-trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--md-sys-color-surface-variant);
	}

	.docreq-status-dropdown-label {
		display: inline-block;
		padding: 6px 8px;
		border-radius: 6px;
		background: transparent;
		color: var(--md-sys-color-on-surface);
	}

	.docreq-status-dropdown-caret {
		font-size: 18px;
		opacity: 0.95;
	}

	.docreq-status-dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		min-width: 220px;
		background: var(--md-sys-color-surface);
		border-radius: 12px;
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 8px;
		box-shadow: var(--shadow-lg);
		display: none;
		z-index: 30;
	}

	.docreq-status-dropdown.open .docreq-status-dropdown-menu {
		display: block;
	}

	.docreq-status-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px;
		width: 100%;
		background: transparent;
		border: none;
		color: var(--md-sys-color-on-surface);
		text-align: left;
		font-size: 1.05rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.docreq-status-item:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.status-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0);
	}

	.status-dot.on_hold {
		background: #f5b400;
	}
	.status-dot.verifying {
		background: #3b82f6;
	}
	.status-dot.processing {
		background: #fb923c;
	}
	.status-dot.for_pickup {
		background: #06b6d4;
	}
	.status-dot.released {
		background: #22c55e;
	}

	.docreq-status-item[aria-selected='true'] {
		background: rgba(255, 255, 255, 0.02);
	}

	.status-text {
		font-size: 1.05rem;
		font-weight: 600;
	}

	/* Tentative date */
	.date-input {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		min-width: 160px;
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
		font-family: inherit;
		cursor: pointer;
		transition: all var(--transition-fast);
		width: 100%;
	}

	.date-input.editable {
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-primary);
		width: 100%;
	}

	.date-input.editable:hover {
		background: var(--md-sys-color-surface-container);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.date-input:focus {
		outline: none;
		border-color: var(--md-sys-color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
	}

	.date-box {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		min-width: 160px;
		text-align: left;
		color: var(--md-sys-color-on-surface);
		display: inline-block;
		box-sizing: border-box;
	}

	.date-box.readonly {
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		opacity: 0.8;
	}

	/* Payment Display Container */
	.payment-display-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
	}

	/* Payment Read-only Display */	
	.payment-readonly {
		flex: 1;
		padding: 8px 12px;
		border-radius: var(--radius-md);
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		font-weight: 600;
		min-height: 40px;
		display: flex;
		align-items: center;
		font-size: 0.95rem;
	}

	.payment-readonly .not-set {
		color: var(--md-sys-color-on-surface-variant);
		font-style: italic;
		opacity: 0.7;
	}

	/* Payment Edit Button */
	.payment-edit-btn {
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 8px;
		border-radius: var(--radius-md);
		color: var(--md-sys-color-on-primary-container);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		min-height: 40px;
		flex-shrink: 0;
	}

	.payment-edit-btn:hover {
		background: var(--md-sys-color-surface-container);
		color: var(--md-sys-color-on-surface);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.payment-edit-btn:active {
		transform: scale(0.95);
	}

	.payment-edit-btn .material-symbols-outlined {
		font-size: 20px;
	}

	/* Payment Input */
	.payment-input-wrapper {
		display: flex;
		align-items: center;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-primary);
		border-radius: var(--radius-md);
		padding: 8px 12px;
		flex: 1;
		transition: all var(--transition-fast);
	}

	.payment-input-wrapper:hover {
		background: var(--md-sys-color-surface-container);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.payment-input-wrapper:focus-within {
		border-color: var(--md-sys-color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
		background: var(--md-sys-color-surface);
	}

	.currency-symbol {
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
	}

	.payment-input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--md-sys-color-on-surface);
		font-weight: 600;
		font-family: inherit;
		padding: 2px 0;
		outline: none;
		width: 100%;
		min-width: 0;
		height: auto;
		font-size: 0.95rem;
	}

	.payment-input::placeholder {
		color: var(--md-sys-color-on-surface-variant);
		opacity: 0.5;
	}

	/* Remove number input arrows */
	.payment-input::-webkit-outer-spin-button,
	.payment-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.payment-input[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.docreq-modal-grid {
			grid-template-columns: 1fr;
		}

		.docreq-modal-right-container {
			min-height: 500px;
		}
	}

	@media (max-width: 768px) {
		.docreq-modal-left-container,
		.docreq-modal-right-container {
			padding: var(--spacing-md);
		}

		.docreq-cards {
			flex-direction: column;
		}

		.student-info-grid {
			grid-template-columns: 1fr;
		}

		.docreq-modal-right-container {
			min-height: 400px;
		}

		.admin-chat-messages {
			min-height: 200px;
		}
	}

	/* Confirmation Modal Styles - Matching ModalContainer */
	.modal-confirm-content {
		display: flex;
		flex-direction: column;
	}

	.modal-message {
		margin: 0;
		font-family: var(--md-sys-typescale-body-large-font);
		font-size: var(--md-sys-typescale-body-large-size);
		color: var(--md-sys-color-on-surface);
		line-height: 1.6;
		max-width: none;
		word-wrap: break-word;
	}

	.modal-message p {
		margin: 0 0 12px 0;
	}

	.confirm-details {
		background: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.confirm-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xs) 0;
	}

	.detail-label {
		font-weight: 500;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.9rem;
	}

	.detail-value {
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
	}

	.modal-actions {
		display: flex;
		gap: var(--spacing-md);
		justify-content: flex-end;
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
	}

	.modal-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--md-sys-typescale-label-large-font);
		font-size: var(--md-sys-typescale-label-large-size);
		font-weight: var(--md-sys-typescale-label-large-weight);
		cursor: pointer;
		transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
		min-width: 80px;
	}

	.modal-btn-primary {
		background-color: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: 1px solid var(--md-sys-color-primary);
	}

	.modal-btn-primary:hover {
		background-color: var(--md-sys-color-primary-container);
		color: var(--md-sys-color-on-primary-container);
		box-shadow: var(--shadow-sm);
	}

	.modal-btn-secondary {
		background-color: var(--md-sys-color-surface-container-high);
		color: var(--md-sys-color-on-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.modal-btn-secondary:hover {
		background-color: var(--md-sys-color-surface-container-highest);
		box-shadow: var(--shadow-sm);
	}

	.modal-btn-danger {
		background-color: var(--md-sys-color-error);
		color: var(--md-sys-color-on-error);
		border: 1px solid var(--md-sys-color-error);
	}

	.modal-btn-danger:hover {
		background-color: var(--md-sys-color-error-container);
		color: var(--md-sys-color-on-error-container);
		box-shadow: var(--shadow-sm);
	}

	.modal-btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary);
		outline-offset: 2px;
	}

	/* Reject Modal Specific Styles */
	.reject-warning {
		background: var(--md-sys-color-error-container);
		border-color: var(--md-sys-color-error);
	}

	.reject-notice {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--md-sys-color-surface);
		border-radius: var(--radius-sm);
		margin-top: var(--spacing-sm);
		color: var(--md-sys-color-on-surface);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.reject-notice .material-symbols-outlined {
		color: var(--md-sys-color-error);
		font-size: 20px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.modal-actions {
			flex-direction: column-reverse;
		}

		.modal-btn {
			width: 100%;
		}
	}
</style>

