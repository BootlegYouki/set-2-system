<script>
	import { createEventDispatcher } from 'svelte';

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

	// Mock chat messages
	function chatMessagesForRequest(requestId) {
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
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="docreq-modal-content">
	<div class="docreq-modal-grid">
		<!-- Left column -->
		<div class="docreq-modal-left">
			<header class="docreq-modal-title">
				<h2>Request Details</h2>
				<div class="docreq-modal-sub">ID: <span>{selectedRequest.requestId}</span></div>
			</header>

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
			</div>

			<div class="docreq-purpose">
				<div class="purpose-label">Purpose & Details</div>
				<p class="purpose-text">{selectedRequest.purpose ?? '—'}</p>
			</div>

			<div class="docreq-chat">
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

				<div class="chat-input">
					<button class="attach-btn" title="Attach">📎</button>
					<input placeholder="Type your message" />
					<button class="send-btn" title="Send">➤</button>
				</div>
			</div>
		</div>

		<!-- Right column -->
		<div class="docreq-modal-right">
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
					<div class="field-value">
						{selectedRequest.gradeLevel} - {selectedRequest.section || 'N/A'}
					</div>
				</div>

				<div class="student-field">
					<div class="field-label">Date of birth</div>
					<div class="field-value">{selectedRequest.dateOfBirth ?? '—'}</div>
				</div>
			</div>

			<div class="action-buttons">
				<button class="docreq-approve-button" onclick={handleUpdate}>Update Request</button>
				<button class="docreq-reject-button" onclick={handleReject}>Reject Request</button>
				<button class="docreq-complete-button" onclick={onClose}>Back</button>
			</div>
		</div>
	</div>
</div>

<style>
	.docreq-modal-content {
		width: 100%;
		max-width: 1200px;
	}

	.docreq-modal-grid {
		display: grid;
		grid-template-columns: 1fr 420px;
		gap: var(--spacing-lg);
		align-items: start;
	}

	.docreq-modal-left {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
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

	.docreq-chat {
		margin-top: var(--spacing-sm);
	}

	.docreq-chat h3 {
		margin: 0 0 8px 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.chat-messages {
		background: var(--md-sys-color-surface-container);
		border-radius: var(--radius-md);
		padding: 12px;
		min-height: 120px;
		border: 1px solid var(--md-sys-color-outline-variant);
		overflow: auto;
	}

	.chat-message {
		background: transparent;
		margin-bottom: 10px;
		padding: 8px;
		border-radius: 8px;
		color: var(--md-sys-color-on-surface);
	}

	.chat-author {
		color: var(--md-sys-color-primary);
		font-weight: 600;
		margin-bottom: 6px;
	}

	.chat-text {
		margin-bottom: 6px;
		color: var(--md-sys-color-on-surface);
	}

	.chat-time {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.75rem;
		text-align: right;
	}

	.chat-input {
		display: flex;
		gap: 8px;
		margin-top: 8px;
		align-items: center;
	}

	.chat-input input {
		flex: 1;
		padding: 10px;
		border-radius: 10px;
		background: var(--md-sys-color-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		color: var(--md-sys-color-on-surface);
		min-height: 44px;
	}

	.attach-btn,
	.send-btn {
		background: transparent;
		border: 1px solid var(--md-sys-color-outline-variant);
		padding: 8px 10px;
		border-radius: 8px;
		color: var(--md-sys-color-on-surface);
		cursor: pointer;
	}

	.docreq-modal-right {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.student-info-card {
		background-color: var(--md-sys-color-surface-container);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--md-sys-color-outline-variant);
	}

	.student-info-card h3 {
		display: flex;
		gap: 8px;
		align-items: center;
		margin: 0 0 8px 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.student-field {
		margin-bottom: 10px;
	}

	.field-label {
		color: var(--md-sys-color-on-surface-variant);
		font-size: 0.875rem;
	}

	.field-value {
		font-weight: 600;
		margin-top: 4px;
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: auto;
	}

	.docreq-approve-button {
		padding: 12px;
		border-radius: var(--radius-md);
		background: var(--md-sys-color-primary);
		color: var(--md-sys-color-on-primary);
		border: none;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all var(--transition-normal);
	}

	.docreq-approve-button:hover {
		opacity: 0.9;
		box-shadow: var(--shadow-sm);
	}

	.docreq-reject-button {
		padding: 12px;
		border-radius: var(--radius-md);
		background: var(--md-sys-color-error);
		color: var(--md-sys-color-on-error);
		border: none;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all var(--transition-normal);
	}

	.docreq-reject-button:hover {
		opacity: 0.9;
		box-shadow: var(--shadow-sm);
	}

	.docreq-complete-button {
		padding: 12px;
		border-radius: var(--radius-md);
		background: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);
		border: 1px solid var(--md-sys-color-outline-variant);
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all var(--transition-normal);
	}

	.docreq-complete-button:hover {
		background-color: var(--md-sys-color-surface-container-highest);
		box-shadow: var(--shadow-sm);
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
	@media (max-width: 1024px) {
		.docreq-modal-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.docreq-cards {
			grid-template-columns: 1fr;
		}
	}
</style>

