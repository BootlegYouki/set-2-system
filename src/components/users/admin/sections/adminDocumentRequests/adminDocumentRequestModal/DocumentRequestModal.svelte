<script>
	import { createEventDispatcher } from 'svelte';
	import { authenticatedFetch } from '../../../../../../routes/api/helper/api-helper.js';

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
	let dateInputEl;
	let newMessage = $state('');
	let isSendingMessage = $state(false);
	let chatMessagesEl;
	let pollingInterval;

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
		if (statusId !== 'processing') {
			selectedRequest.tentativeDate = null;
		}
		isModalStatusDropdownOpen = false;
	}

	// Date handling
	function openDatePicker() {
		if (!selectedRequest || selectedRequest.status !== 'processing') return;
		dateInputEl && dateInputEl.click();
	}

	function onTentativeDateChange(event) {
		const val = event.target.value;
		if (!selectedRequest) return;
		selectedRequest.tentativeDate = val ? val : null;
	}

	function formatTentativeDateForDisplay(dateStr, status) {
		if (status !== 'processing') return 'N/A';
		if (!dateStr) return '--/--/----';
		const [y, m, d] = dateStr.split('-');
		if (!y || !m || !d) return '--/--/----';
		return `${m}/${d}/${y}`;
	}

	// Action handlers
	async function handleUpdate() {
		const updateData = {
			status: selectedRequest.status,
			tentativeDate: selectedRequest.tentativeDate
		};
		await onUpdate(selectedRequest.requestId, updateData);
		onClose();
	}

	async function handleReject() {
		await onReject(selectedRequest.requestId);
		onClose();
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

			{#if selectedRequest.status === 'cancelled'}
			<div class="cancelled-notice">
				<span class="material-symbols-outlined">info</span>
				<div class="cancelled-notice-content">
					<strong>Request Cancelled by Student</strong>
					<p>This request was cancelled by the student{selectedRequest.cancelledDate ? ` on ${selectedRequest.cancelledDate}` : ''}. No further actions can be taken.</p>
				</div>
			</div>
			{/if}

			<!-- Request Info Cards -->
			<div class="docreq-cards">
				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">description</span> Document Type
					</div>
					<div class="card-value">{selectedRequest.documentType}</div>
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
				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">event</span> Tentative Date
					</div>
					<div class="card-value">
						<div
							class="date-box"
							class:disabled={selectedRequest.status !== 'processing'}
							onclick={() => {
								if (selectedRequest.status === 'processing') openDatePicker();
							}}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && selectedRequest.status === 'processing') openDatePicker();
							}}
							role="button"
							tabindex={selectedRequest.status === 'processing' ? 0 : -1}
						>
							{selectedRequest.status === 'processing'
								? selectedRequest.tentativeDate
									? formatTentativeDateForDisplay(
											selectedRequest.tentativeDate,
											selectedRequest.status
										)
									: '--/--/----'
								: 'N/A'}
						</div>

						<input
							type="date"
							bind:this={dateInputEl}
							onchange={onTentativeDateChange}
							style="position:absolute; opacity:0; pointer-events:none; width:0; height:0;"
						/>
					</div>
				</div>

				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">payments</span> Payment
					</div>
					<div class="card-value">
						{selectedRequest.payment}
						<span class="badge orange">Pending</span>
					</div>
				</div>

				<div class="docreq-card">
					<div class="card-label">
						<span class="material-symbols-outlined">account_circle</span> Processed By
					</div>
					<div class="card-value">{selectedRequest.processedBy ?? '—'}</div>
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
		overflow-y: auto;
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
		height: 100%;
	}

	.docreq-modal-right-container {
		display: flex;
		flex-direction: column;
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--md-sys-color-outline-variant);
		height: 100%;
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

	.cancelled-notice {
		display: flex;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--status-cancelled-bg-light);
		border: 1px solid var(--status-cancelled-border);
		border-radius: var(--radius-md);
		margin: var(--spacing-md) 0;
		align-items: flex-start;
	}

	.cancelled-notice .material-symbols-outlined {
		color: var(--status-cancelled-text);
		font-size: 24px;
		flex-shrink: 0;
	}

	.cancelled-notice-content {
		flex: 1;
	}

	.cancelled-notice-content strong {
		display: block;
		color: var(--status-cancelled-text);
		font-size: 0.95rem;
		margin-bottom: 4px;
	}

	.cancelled-notice-content p {
		margin: 0;
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.docreq-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}

	.docreq-card {
		background-color: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		border: 1px solid var(--md-sys-color-outline-variant);
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
		border: 1px solid var(--md-sys-color-outline-variant);
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
		min-height: 400px;
		max-height: 310px;
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

	.chat-input input:focus {
		outline: none;
		border-color: var(--md-sys-color-primary);
	}

	.chat-input input::placeholder {
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
	.date-box {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		min-width: 160px;
		text-align: left;
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
		display: inline-block;
		box-sizing: border-box;
	}

	.date-box.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--md-sys-color-surface-container);
	}

	.date-box:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
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
			grid-template-columns: 1fr;
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
</style>

