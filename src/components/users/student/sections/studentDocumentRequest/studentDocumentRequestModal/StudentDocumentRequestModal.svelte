<script>
	import { authStore } from '../../../../../login/js/auth.js';
	import { api } from '../../../../../../routes/api/helper/api-helper.js';

	// Props passed from modal store
	let {
		request = {},
		onCancel = () => {},
		onRefresh = () => {},
		onClose = () => {}
	} = $props();

	// Local state for the modal
	let selectedRequest = $state({ ...request });
	let newMessage = $state('');
	let isProcessFlowOpen = $state(false);
	let isSendingMessage = $state(false);
	let chatMessagesEl = $state();
	let chatInputEl = $state();
	let pollingInterval;
	// Mobile pagination state
	let currentPage = $state(1); // 1 = left container, 2 = right container
	
	// Swipe handling
	let touchStartX = $state(0);
	let touchEndX = $state(0);

	// Get messages from the request
	let messages = $derived(selectedRequest.messages || []);

	// Check if chat should be disabled based on status
	let isChatDisabled = $derived(
		selectedRequest.status === 'released' || selectedRequest.status === 'cancelled'
	);

	// Scroll to bottom of chat
	function scrollToBottom() {
		if (chatMessagesEl) {
			setTimeout(() => {
				chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
			}, 100);
		}
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

	// Open process status flow modal
	function openProcessFlowModal() {
		isProcessFlowOpen = true;
	}

	function closeProcessFlowModal() {
		isProcessFlowOpen = false;
	}

	// Send a new message
	async function sendMessage() {
		if (!newMessage.trim() || isSendingMessage || !selectedRequest || isChatDisabled) return;

		isSendingMessage = true;
		try {
			const result = await api.post('/api/document-requests', {
				action: 'sendMessage',
				requestId: selectedRequest.requestId,
				message: newMessage.trim()
			});

			if (result.success) {
				// Add the new message to the local state
				selectedRequest.messages = [...(selectedRequest.messages || []), result.data];
				newMessage = '';
				scrollToBottom();
				// Refocus the input after sending
				if (chatInputEl) {
					setTimeout(() => chatInputEl.focus(), 100);
				}
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

	// Handle cancel request
	async function handleCancelRequest() {
		if (onCancel) {
			await onCancel(selectedRequest);
		}
		onClose();
	}

	// Mobile pagination functions
	function goToPage(page) {
		currentPage = page;
	}

	function nextPage() {
		if (currentPage < 2) currentPage++;
	}

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

	// Swipe gesture handlers
	function handleTouchStart(e) {
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchMove(e) {
		touchEndX = e.touches[0].clientX;
	}

	function handleTouchEnd() {
		if (!touchStartX || !touchEndX) return;
		
		const swipeDistance = touchStartX - touchEndX;
		const minSwipeDistance = 50; // Minimum distance for a swipe
		
		if (Math.abs(swipeDistance) > minSwipeDistance) {
			if (swipeDistance > 0) {
				// Swiped left - go to next page
				nextPage();
			} else {
				// Swiped right - go to previous page
				prevPage();
			}
		}
		
		// Reset
		touchStartX = 0;
		touchEndX = 0;
	}

	// Fetch latest messages from server
	async function fetchLatestMessages() {
		if (!selectedRequest || isSendingMessage) return;

		try {
			const result = await api.get(`/api/document-requests?action=single&requestId=${selectedRequest.requestId}`);
			
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

<div class="student-docreq-modal-content">
	<div 
		class="student-docreq-modal-grid"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	>
		<!-- LEFT CONTAINER: Request Information -->
		<div class="student-docreq-modal-left-container" class:mobile-hidden={currentPage !== 1}>
			<header class="student-docreq-modal-title">
				<h2>Request Details</h2>
				<div class="student-docreq-modal-sub">ID: <span>{selectedRequest.requestId}</span></div>
			</header>
			<!-- Request Info Cards -->
			<div class="student-docreq-cards">
				<!-- First Row: Status card (read-only, clickable for info) -->
				<div class="student-docreq-card full-width status-card-horizontal">
					<div class="status-group">
						<div class="card-label">
							<span class="material-symbols-outlined">info</span> Status:
						</div>
						<span class="status-badge status-{selectedRequest.status}">
							{getStatusDisplayName(selectedRequest.status)}
						</span>
					</div>
					<button
						class="status-info-button"
						onclick={openProcessFlowModal}
						title="Click to view status flow information"
						aria-label="View status flow information"
					>
						<span class="material-symbols-outlined">help</span>
					</button>
				</div>

		<!-- Second Row: Document Type and Processed By -->
		<div class="student-docreq-card half-width">
			<div class="card-label">
				<span class="material-symbols-outlined">description</span> Document Type
			</div>
			<div class="card-value">{selectedRequest.type}</div>
		</div>

		<div class="student-docreq-card half-width">
			<div class="card-label">
				<span class="material-symbols-outlined">account_circle</span> Processed By
			</div>
			<div class="card-value">{selectedRequest.processedBy ?? '—'}</div>
		</div>

	<!-- Third Row: Payment, Requested Date, and Cancelled/Tentative Date -->
	<div class="student-docreq-card third-row">
		<div class="card-label">
			<span class="material-symbols-outlined">payments</span> Payment
		</div>
		<div class="card-value payment-value">
			{#if selectedRequest.paymentAmount !== null && selectedRequest.paymentAmount !== undefined}
				{#if selectedRequest.paymentAmount === 0}
					<span class="payment-amount free">Free</span>
				{:else}
					<span class="payment-amount">₱{selectedRequest.paymentAmount}</span>
					<span class="badge {selectedRequest.paymentStatus === 'paid' ? 'green' : 'orange'}">
						{selectedRequest.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
					</span>
				{/if}
			{:else}
				<span class="payment-amount tentative">Tentative</span>
			{/if}
		</div>
	</div>

	<div class="student-docreq-card third-row">
		<div class="card-label">
			<span class="material-symbols-outlined">calendar_today</span> Requested Date
		</div>
		<div class="card-value">{selectedRequest.requestedDate ?? '—'}</div>
	</div>

	{#if selectedRequest.status === 'cancelled' && selectedRequest.cancelledDate}
	<div class="student-docreq-card third-row">
		<div class="card-label">
			<span class="material-symbols-outlined">event_busy</span> Cancelled Date
		</div>
		<div class="card-value">{selectedRequest.cancelledDate}</div>
	</div>
	{:else if selectedRequest.tentativeDate}
	<div class="student-docreq-card third-row">
		<div class="card-label">
			<span class="material-symbols-outlined">event</span> Tentative Date
		</div>
		<div class="card-value">
			<div class="date-display">
				{formatDate(selectedRequest.tentativeDate)}
			</div>
		</div>
	</div>
	{/if}

	{#if selectedRequest.status === 'released' && selectedRequest.completedDate}
	<div class="student-docreq-card">
		<div class="card-label">
			<span class="material-symbols-outlined">check_circle</span> Released Date
		</div>
		<div class="card-value">{selectedRequest.completedDate}</div>
	</div>
	{/if}
			</div>

		<!-- Purpose Section -->
		<div class="student-docreq-purpose">
			<div class="purpose-label">
				<span class="material-symbols-outlined">description</span> Purpose & Details
			</div>
			<div class="purpose-content">
				{selectedRequest.purpose || 'No purpose provided'}
			</div>
		</div>

		{#if selectedRequest.adminNote}
		<!-- Admin Note Section -->
		<div class="admin-note-section">
			<div class="note-label">
				<span class="material-symbols-outlined">note</span> Admin Note
			</div>
			<p class="note-text">{selectedRequest.adminNote}</p>
		</div>
		{/if}

		<!-- Action Buttons -->
		<div class="student-modal-action-buttons">
			<button 
				class="student-cancel-button" 
				onclick={handleCancelRequest}
				disabled={selectedRequest.status !== 'on_hold'}
				title={selectedRequest.status !== 'on_hold' ? 'Can only cancel requests that are on hold' : 'Cancel this request'}
			>
				<span class="material-symbols-outlined">cancel</span>
				Cancel Request
			</button>

			<button class="student-back-button" onclick={onClose}>
				<span class="material-symbols-outlined">arrow_back</span>
				Back
			</button>
		</div>
	</div>

	<!-- RIGHT CONTAINER: Chat -->
	<div class="student-docreq-modal-right-container" class:mobile-hidden={currentPage !== 2}>
			<div class="chat-container">
				<div class="chat-header">
					<h3><span class="material-symbols-outlined">forum</span> Communication</h3>
					<span class="chat-count-badge">{messages.length}</span>
				</div>

				<div class="student-chat-messages" bind:this={chatMessagesEl}>
					{#if messages.length > 0}
						{#each messages as msg (msg.id)}
							<div class="message-wrapper {msg.authorRole === 'admin' ? 'received' : 'sent'}">
								{#if msg.authorRole === 'admin'}
									<div class="message-avatar">
										<span class="material-symbols-outlined">admin_panel_settings</span>
									</div>
								{/if}
								<div class="message-bubble">
									<div class="message-header">
										<span class="message-author">{msg.author}</span>
										<span class="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
									</div>
									<div class="message-text">{msg.text}</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="no-chat">
							<span class="material-symbols-outlined">chat_bubble_outline</span>
							<p>No messages yet</p>
							<p class="subtitle">Start a conversation with the admin</p>
						</div>
					{/if}
				</div>

				<div class="student-chat-input" class:disabled={isChatDisabled}>
					{#if isChatDisabled}
						<div class="chat-disabled-notice">
							<span class="material-symbols-outlined">block</span>
							<span>Chat is disabled for {selectedRequest.status === 'released' ? 'released' : 'cancelled'} requests</span>
						</div>
					{:else}
						<button class="attach-btn" title="Attach file" aria-label="Attach file">
							<span class="material-symbols-outlined">attach_file</span>
						</button>
						<input 
							bind:this={chatInputEl}
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
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile Pagination Controls -->
	<div class="mobile-pagination-controls">
		<div class="pagination-dots">
			<button 
				class="pagination-dot" 
				class:active={currentPage === 1}
				onclick={() => goToPage(1)}
				aria-label="Go to request details"
			>
				<span class="material-symbols-outlined">description</span>
			</button>
			<button 
				class="pagination-dot" 
				class:active={currentPage === 2}
				onclick={() => goToPage(2)}
				aria-label="Go to chat"
			>
				<span class="material-symbols-outlined">forum</span>
			</button>
		</div>
	</div>
</div>

<!-- Process Status Flow Modal -->
{#if isProcessFlowOpen}
	<div 
		class="flow-backdrop" 
		onclick={closeProcessFlowModal}
		onkeydown={(e) => e.key === 'Enter' && closeProcessFlowModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="flow-container" 
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="flow-header">
				<h2>Process Status Flow</h2>
				<button class="flow-close-btn" aria-label="Close" onclick={closeProcessFlowModal}>
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="flow-body">
				<div class="flow-list">
					<!-- On Hold -->
					<div class="flow-item">
						<div class="flow-icon-wrapper on_hold">
							<span class="material-symbols-outlined">pause_circle</span>
						</div>
						<div class="flow-content">
							<h3>On Hold</h3>
							<p>Your request is awaiting review by the admin.</p>
						</div>
					</div>

					<!-- Verifying -->
					<div class="flow-item">
						<div class="flow-icon-wrapper verifying">
							<span class="material-symbols-outlined">fact_check</span>
						</div>
						<div class="flow-content">
							<h3>Verifying</h3>
							<p>The document request is currently being verified.</p>
						</div>
					</div>

					<!-- Processing -->
					<div class="flow-item">
						<div class="flow-icon-wrapper processing">
							<span class="material-symbols-outlined">sync</span>
						</div>
						<div class="flow-content">
							<h3>For Processing</h3>
							<p>The document is in the processing stage.</p>
						</div>
					</div>

					<!-- For Pick Up -->
					<div class="flow-item">
						<div class="flow-icon-wrapper for_pickup">
							<span class="material-symbols-outlined">inventory</span>
						</div>
						<div class="flow-content">
							<h3>For Pick Up</h3>
							<p>The document is ready and available for pick up.</p>
						</div>
					</div>

					<!-- Released -->
					<div class="flow-item">
						<div class="flow-icon-wrapper released">
							<span class="material-symbols-outlined">check_circle</span>
						</div>
						<div class="flow-content">
							<h3>Released</h3>
							<p>The document has been released to you.</p>
						</div>
					</div>

					<!-- Rejected -->
					<div class="flow-item">
						<div class="flow-icon-wrapper rejected">
							<span class="material-symbols-outlined">cancel</span>
						</div>
						<div class="flow-content">
							<h3>Rejected</h3>
							<p>The request was rejected. Check the rejection reason or contact admin.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.student-docreq-modal-content {
		width: 100%;
		max-width: 1400px;
		background-color: var(--md-sys-color-surface-container-high);
		border-radius: var(--radius-xl);
		border: none;
		box-shadow: var(--shadow-lg);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		max-height: 90vh;
	}

	.student-docreq-modal-grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: var(--spacing-xl);
		align-items: stretch;
		padding: var(--spacing-md);
	}

	.student-docreq-modal-left-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--md-sys-color-outline-variant);
		height: 100%;
	}

	.student-docreq-modal-right-container {
		display: flex;
		flex-direction: column;
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--md-sys-color-outline-variant);
		height: 100%;
	}

	.student-docreq-modal-title h2 {
		margin: 0 0 6px 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.student-docreq-modal-sub {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
		margin-top: 6px;
	}

	.student-docreq-cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}

	.student-docreq-card {
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		flex: 1 1 calc(33.333% - var(--spacing-md));
		min-width: 200px;
	}

	.student-docreq-card.full-width {
		flex: 1 1 100%;
	}

	.student-docreq-card.half-width {
		flex: 1 1 calc(50% - var(--spacing-md) / 2);
	}

	.student-docreq-card.third-row {
		flex: 1 1 calc(33.333% - var(--spacing-md) * 2 / 3);
		min-width: 180px;
	}

	.student-docreq-card.status-card-horizontal {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
	}

	.status-group {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		flex: 1;
	}

	.student-docreq-card.status-card-horizontal .card-label {
		margin: 0;
	}
	.status-info-button {
		background: var(--md-sys-color-surface-container);
		border: none;
		padding: 8px;
		border-radius: 50%;
		cursor: pointer;
		color: var(--md-sys-color-on-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		min-width: 36px;
		min-height: 36px;
		flex-shrink: 0;
	}

	.status-info-button .material-symbols-outlined {
		font-size: 20px;
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
	}

	.payment-value {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.payment-amount {
		font-size: 1.1rem;
	}

	.payment-amount.tentative {
		color: var(--md-sys-color-on-surface-variant);
		font-style: italic;
		opacity: 0.85;
	}

	.payment-amount.free {
		color: var(--md-sys-color-tertiary);
		font-weight: 700;
	}

	.status-badge {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.status-badge.on_hold {
		background: var(--status-on-hold-bg);
		color: var(--status-on-hold-text);
	}

	.status-badge.verifying {
		background: var(--status-verifying-bg);
		color: var(--status-verifying-text);
	}

	.status-badge.processing {
		background: var(--status-processing-bg);
		color: var(--status-processing-text);
	}

	.status-badge.for_pickup {
		background: var(--status-for-pickup-bg);
		color: var(--status-for-pickup-text);
	}

	.status-badge.released {
		background: var(--status-released-bg);
		color: var(--status-released-text);
	}

	.status-badge.rejected {
		background: var(--status-rejected-bg);
		color: var(--status-rejected-text);
	}

	.status-badge.cancelled {
		background: var(--status-cancelled-bg);
		color: var(--status-cancelled-text);
	}

	.date-display {
		display: inline-block;
		color: var(--md-sys-color-on-surface);
	}

	.student-docreq-purpose {
		margin-top: var(--spacing-sm);
    height: 100%;
		width: 100%;
	}

	.purpose-label {
		display: flex;
		gap: 8px;
		align-items: center;
		color: var(--md-sys-color-on-surface-variant);
		margin-bottom: 8px;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.purpose-content {
		background: var(--md-sys-color-surface);
		padding: 12px;
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		line-height: 1.6;
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
		min-height: 60px;
		word-wrap: break-word;
		word-break: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	.admin-note-section {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: var(--md-sys-color-tertiary-container);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.note-label {
		display: flex;
		gap: 8px;
		align-items: center;
		color: var(--md-sys-color-on-tertiary-container);
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 0.875rem;
	}

	.note-text {
		background: var(--md-sys-color-surface);
		padding: 12px;
		border-radius: var(--radius-md);
		margin: 0;
		line-height: 1.6;
		color: var(--md-sys-color-on-surface);
	}

	/* Chat Container */
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

	.student-chat-messages {
		flex: 1;
		background: var(--md-sys-color-surface);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		overflow-y: auto;
		margin-bottom: var(--spacing-sm);
		max-height: 510px;
		min-height: 330px;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
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

	/* Message Bubbles */
	.message-wrapper {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		margin-bottom: var(--spacing-xs);
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message-wrapper.sent {
		justify-content: flex-end;
	}

	.message-wrapper.received {
		justify-content: flex-start;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--md-sys-color-surface-container-highest);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-bottom: 2px;
	}

	.message-avatar .material-symbols-outlined {
		font-size: 20px;
		color: var(--md-sys-color-on-surface-variant);
	}

	.message-wrapper.sent .message-avatar .material-symbols-outlined {
		color: var(--md-sys-color-primary);
	}

	.message-wrapper.received .message-avatar .material-symbols-outlined {
		color: var(--md-sys-color-secondary);
	}

	.message-bubble {
		max-width: 70%;
		padding: 10px 14px;
		border-radius: 16px;
		position: relative;
		word-wrap: break-word;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.message-wrapper.sent .message-bubble {
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border-bottom-right-radius: 4px;
	}

	.message-wrapper.received .message-bubble {
		background: var(--md-sys-color-surface-container-highest);
		color: var(--md-sys-color-on-surface);
		border-bottom-left-radius: 4px;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
		gap: 12px;
	}

	.message-author {
		font-size: 0.75rem;
		font-weight: 600;
		opacity: 0.9;
	}

	.message-time {
		font-size: 0.7rem;
		opacity: 0.7;
		white-space: nowrap;
	}

	.message-text {
		font-size: 0.95rem;
		line-height: 1.4;
		word-break: break-word;
		white-space: pre-wrap;
	}

	.student-chat-input {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--md-sys-color-surface);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		margin-top: auto;
		min-width: 0;
	}

	.student-chat-input input {
		flex: 1;
		padding: 12px var(--spacing-md);
		border-radius: var(--radius-md);
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		font-size: 0.95rem;
		transition: all var(--transition-fast);
		min-width: 0;
	}

	.student-chat-input input:focus {
		outline: none;
		border-color: var(--md-sys-color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
		background: var(--md-sys-color-surface);
	}

	.student-chat-input input::placeholder {
		color: var(--md-sys-color-on-surface-variant);
		opacity: 0.7;
	}

	.student-chat-input.disabled {
		background: var(--md-sys-color-surface-variant);
		opacity: 0.7;
		justify-content: center;
	}

	.chat-disabled-notice {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.9rem;
		font-weight: 500;
		padding: var(--spacing-sm);
	}

	.chat-disabled-notice .material-symbols-outlined {
		font-size: 20px;
		opacity: 0.8;
	}

	.attach-btn,
	.send-btn {
		background: var(--md-sys-color-surface-container);
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 10px;
		border-radius: var(--radius-md);
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
	}

	.attach-btn .material-symbols-outlined,
	.send-btn .material-symbols-outlined {
		font-size: 22px;
	}

	.attach-btn:hover {
		background: var(--md-sys-color-secondary-container);
		border-color: var(--md-sys-color-secondary);
		color: var(--md-sys-color-on-secondary-container);
		transform: scale(1.05);
	}

	.send-btn {
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border-color: var(--md-sys-color-primary);
	}

	.send-btn:hover:not(:disabled) {
		background: var(--md-sys-color-primary);
		opacity: 0.9;
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.attach-btn:active,
	.send-btn:active {
		transform: scale(0.95);
	}

	.attach-btn:focus-visible,
	.send-btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary);
		outline-offset: 2px;
	}

	.student-modal-action-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: auto;
		padding-top: var(--spacing-md);
		border-top: 2px solid var(--md-sys-color-outline-variant);
	}

	.student-cancel-button {
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

	.student-cancel-button .material-symbols-outlined {
		font-size: 22px;
	}

	.student-cancel-button:hover {
		background: var(--md-sys-color-error);
		opacity: 0.9;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.student-cancel-button:active {
		transform: translateY(0);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.student-cancel-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--md-sys-color-surface-variant);
		color: var(--md-sys-color-on-surface-variant);
	}

	.student-cancel-button:disabled:hover {
		transform: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		opacity: 0.5;
	}

	.student-back-button {
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

	.student-back-button .material-symbols-outlined {
		font-size: 22px;
	}

	.student-back-button:hover {
		background-color: var(--md-sys-color-surface-container-highest);
		border-color: var(--md-sys-color-outline);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.student-back-button:active {
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
	}

	.badge.orange {
		background: var(--status-pending-bg);
		color: var(--status-pending-text);
		border-color: var(--status-pending-border);
	}

	.badge.green {
		background: var(--status-released-bg);
		color: var(--status-released-text);
		border-color: var(--status-released-border);
	}

	/* Process Flow Modal */
	.flow-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10002;
		padding: var(--spacing-lg);
	}

	.flow-container {
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		background: var(--md-sys-color-surface-container-high);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.flow-header {
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--md-sys-color-surface-container);
	}

	.flow-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.flow-close-btn {
		background: var(--md-sys-color-surface-container-highest);
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 8px;
		border-radius: 50%;
		cursor: pointer;
		color: var(--md-sys-color-on-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		width: 36px;
		height: 36px;
	}

	.flow-close-btn:hover {
		background: var(--md-sys-color-surface-container-highest);
		transform: scale(1.1);
	}

	.flow-close-btn:active {
		transform: scale(0.95);
	}

	.flow-close-btn .material-symbols-outlined {
		font-size: 20px;
	}

	.flow-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
    background-color: var(--md-sys-color-surface-container);
	}

	.flow-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.flow-item {
		display: flex;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
		align-items: flex-start;
	}

	.flow-icon-wrapper {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.flow-icon-wrapper .material-symbols-outlined {
		font-size: 24px;
	}

	.flow-content {
		flex: 1;
	}

	.flow-content h3 {
		margin: 0 0 4px 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--md-sys-color-on-surface);
	}

	.flow-content p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--md-sys-color-on-surface-variant);
		line-height: 1.4;
	}

	/* Mobile Pagination Controls */
	.mobile-pagination-controls {
		display: none;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background-color: none;
		margin-top: var(--spacing-xs);
		position: relative;
		z-index: 10;
		flex-shrink: 0;
	}

	.pagination-dots {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.pagination-dot {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: var(--md-sys-color-surface-container-highest);
		border: 1.5px solid var(--md-sys-color-outline-variant);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--md-sys-color-on-surface-variant);
		pointer-events: auto;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.pagination-dot .material-symbols-outlined {
		font-size: 18px;
	}

	.pagination-dot.active {
		background-color: var(--md-sys-color-primary);
		border-color: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		transform: scale(1.05);
		box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
		pointer-events: none;
	}

	.pagination-dot:hover:not(.active) {
		background-color: var(--md-sys-color-surface-container-highest);
		border-color: var(--md-sys-color-outline);
		transform: scale(1.02);
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.student-docreq-modal-grid{
			padding: 0;
		}
		
		.student-docreq-card.third-row {
			flex: 1 1 calc(33.333% - var(--spacing-md) * 2 / 3);
			min-width: 120px;
		}
	}

	@media (max-width: 768px) {
		.student-docreq-modal-content {
			overflow: visible;
			max-height: none;
			height: auto;
		}

		.student-chat-messages {
			max-height: 58vh;
		}

		/* Show pagination controls on mobile */
		.mobile-pagination-controls {
			display: flex;
			position: relative;
			z-index: 100;
			touch-action: manipulation;
		}

		.student-docreq-modal-grid{
			grid-template-columns: 1fr;
			overflow: visible;
			position: relative;
			padding: 0;
		}

		/* Hide containers based on pagination */
		.mobile-hidden {
			display: none !important;
		}

		.student-docreq-modal-left-container,
		.student-docreq-modal-right-container {
			padding: var(--spacing-md);
			overflow-y: auto;
			max-height: 80vh;
		}
		
		.student-docreq-card {
			flex: 1 1 100%;
		}
		
		.student-docreq-card.half-width {
			flex: 1 1 calc(50% - var(--spacing-md) / 2);
			min-width: 140px;
		}

		.student-docreq-modal-right-container {
			min-height: 400px;
		}

		.chat-messages {
			min-height: 200px;
		}

		.flow-backdrop {
			padding: var(--spacing-md);
		}

		.flow-container {
			max-width: 100%;
		}

		.flow-body {
			padding: var(--spacing-md);
		}

		.flow-item {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.flow-icon-wrapper {
			width: 36px;
			height: 36px;
		}

		.flow-icon-wrapper .material-symbols-outlined {
			font-size: 20px;
		}
	}
</style>

