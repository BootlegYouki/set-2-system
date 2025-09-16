<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let assessmentType = '';
  export let columnIndex = 0;
  export let columnName = '';
  export let currentTotal = '';
  export let onSave = () => {};
  export let onClose = () => {};
  export let onRename = () => {};
  export let onRemove = () => {};
  export let visible = false;
  export let canRemove = true; // Whether the column can be removed
  export let existingColumnNames = []; // Array of existing column names for validation

  const dispatch = createEventDispatcher();

  let newTotal = '';
  let newColumnName = '';
  let error = '';
  let nameError = '';
  let modalElement;
  let userHasModified = false;
  let userHasModifiedName = false;
  let activeTab = 'settings'; // 'settings' or 'total'
  let showRemoveConfirm = false;

  // Update newTotal when currentTotal changes, but only if user hasn't modified it
  $: if (currentTotal !== undefined && currentTotal !== null && !userHasModified) {
    newTotal = currentTotal;
  }

  // Update newColumnName when columnName changes, but only if user hasn't modified it
  $: if (columnName !== undefined && columnName !== null && !userHasModifiedName) {
    newColumnName = columnName;
  }

  // Reset when modal becomes visible
  $: if (visible) {
    newTotal = currentTotal || '';
    newColumnName = columnName || '';
    userHasModified = false;
    userHasModifiedName = false;
    error = '';
    nameError = '';
    activeTab = 'settings';
    showRemoveConfirm = false;
  }

  onMount(() => {
    if (visible && modalElement) {
      modalElement.focus();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  });

  $: if (visible && modalElement) {
    modalElement.focus();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  function validateInput() {
    error = '';
    if (newTotal === '' || newTotal === null || newTotal === undefined) {
      error = 'Total score is required';
      return false;
    }
    const numValue = parseFloat(newTotal);
    if (isNaN(numValue) || numValue < 0) {
      error = 'Total score must be a positive number';
      return false;
    }
    if (numValue > 100) {
      error = 'Total score cannot exceed 100';
      return false;
    }
    return true;
  }

  function validateColumnName() {
    nameError = '';
    if (!newColumnName || newColumnName.trim() === '') {
      nameError = 'Column name is required';
      return false;
    }
    
    const trimmedName = newColumnName.trim();
    
    // Check if name is different from current name and already exists
    if (trimmedName !== columnName && existingColumnNames.includes(trimmedName)) {
      nameError = 'Column name already exists';
      return false;
    }
    
    // Check for valid format (letters, numbers, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      nameError = 'Column name can only contain letters, numbers, spaces, hyphens, and underscores';
      return false;
    }
    
    if (trimmedName.length > 20) {
      nameError = 'Column name cannot exceed 20 characters';
      return false;
    }
    
    return true;
  }

  function handleSave() {
    if (validateInput()) {
      onSave(assessmentType, columnIndex, newTotal); // Pass assessment type, column index, and text value
      closeModal();
    }
  }

  function handleRename() {
    if (validateColumnName()) {
      onRename(assessmentType, columnIndex, newColumnName.trim());
      closeModal();
    }
  }

  function handleRemove() {
    showRemoveConfirm = true;
  }

  function confirmRemove() {
    onRemove(assessmentType, columnIndex);
    closeModal();
  }

  function cancelRemove() {
    showRemoveConfirm = false;
  }

  function closeModal() {
    visible = false;
    document.body.style.overflow = '';
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (showRemoveConfirm) {
        cancelRemove();
      } else {
        closeModal();
      }
    } else if (event.key === 'Enter' && !showRemoveConfirm) {
      if (activeTab === 'settings') {
        handleRename();
      } else {
        handleSave();
      }
    }
  }

  // Format assessment type for display
  function formatAssessmentType(type) {
    if (type.startsWith('WW')) return 'Written Work';
    if (type.startsWith('PT')) return 'Performance Task';
    if (type.startsWith('QA')) return 'Quarterly Assessment';
    return type;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
  <div 
    class="custom-modal-overlay" 
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div 
      class="custom-modal-content"
      bind:this={modalElement}
      tabindex="-1"
    >
      <div class="custom-modal-header">
        <h2 id="modal-title" class="custom-modal-title">
          Column Settings - {columnName}
        </h2>
        <button 
          class="custom-modal-close-btn" 
          onclick={closeModal}
          aria-label="Close modal"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-button"
          class:active={activeTab === 'settings'}
          onclick={() => activeTab = 'settings'}
        >
          <span class="material-symbols-outlined">settings</span>
          Column Settings
        </button>
        <button 
          class="tab-button"
          class:active={activeTab === 'total'}
          onclick={() => activeTab = 'total'}
        >
          <span class="material-symbols-outlined">calculate</span>
          Total Score
        </button>
      </div>
      
      <div class="custom-modal-body">
        {#if showRemoveConfirm}
          <!-- Remove Confirmation Dialog -->
          <div class="confirmation-dialog">
            <div class="confirmation-icon">
              <span class="material-symbols-outlined">warning</span>
            </div>
            <h3 class="confirmation-title">Remove Column</h3>
            <p class="confirmation-message">
              Are you sure you want to remove the column "<strong>{columnName}</strong>"? 
              This action cannot be undone and all data in this column will be lost.
            </p>
            <div class="confirmation-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                onclick={cancelRemove}
              >
                Cancel
              </button>
              <button 
                type="button" 
                class="btn btn-danger" 
                onclick={confirmRemove}
              >
                Remove Column
              </button>
            </div>
          </div>
        {:else if activeTab === 'settings'}
          <!-- Column Settings Tab -->
          <div class="assessment-info">
            <p><strong>Column:</strong> {columnName}</p>
            <p><strong>Assessment Type:</strong> {formatAssessmentType(assessmentType)}</p>
          </div>

          <div class="form-group">
            <label for="column-name" class="form-label">Column Name</label>
            <input
              id="column-name"
              type="text"
              bind:value={newColumnName}
              class="form-input"
              class:error={nameError}
              placeholder="Enter column name"
              maxlength="20"
              oninput={() => { userHasModifiedName = true; nameError = ''; }}
            />
            {#if nameError}
              <span class="error-message">{nameError}</span>
            {/if}
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick={closeModal}
            >
              Cancel
            </button>
            {#if canRemove}
              <button 
                type="button" 
                class="btn btn-danger" 
                onclick={handleRemove}
              >
                <span class="material-symbols-outlined">delete</span>
                Remove Column
              </button>
            {/if}
            <button 
              type="button" 
              class="btn btn-primary" 
              onclick={handleRename}
              disabled={newColumnName.trim() === columnName || !newColumnName.trim()}
            >
              <span class="material-symbols-outlined">edit</span>
              Rename Column
            </button>
          </div>
        {:else}
          <!-- Total Score Tab -->
          <div class="assessment-info">
            <p><strong>Column:</strong> {columnName}</p>
            <p><strong>Assessment Type:</strong> {formatAssessmentType(assessmentType)}</p>
            <p><strong>Current Total:</strong> {currentTotal || 'Not set'}</p>
          </div>

          <div class="form-group">
            <label for="total-score" class="form-label">Total Score</label>
            <input
              id="total-score"
              type="text"
              bind:value={newTotal}
              class="form-input"
              class:error={error}
              placeholder="Enter total score"
              oninput={() => { userHasModified = true; error = ''; }}
            />
            {#if error}
              <span class="error-message">{error}</span>
            {/if}
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick={closeModal}
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              onclick={handleSave}
            >
              <span class="material-symbols-outlined">save</span>
              Save Total
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  }

  .custom-modal-content {
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 450px;
    margin: var(--spacing-lg);
    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .custom-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container);
  }

  .custom-modal-title {
    margin: 0;
    font-family: var(--md-sys-typescale-headline-small-font);
    font-size: var(--md-sys-typescale-headline-small-size);
    font-weight: var(--md-sys-typescale-headline-small-weight);
    color: var(--md-sys-color-on-surface);
  }

  .custom-modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-fast);
  }

  .custom-modal-close-btn:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .custom-modal-close-btn:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  .custom-modal-close-btn .material-symbols-outlined {
    font-size: 20px;
  }

  .custom-modal-body {
    padding: var(--spacing-lg);
    overflow-y: auto;
    flex: 1;
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .assessment-info {
    text-align: center;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }

  .assessment-title {
    margin: 0 0 var(--spacing-xs) 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    color: var(--md-sys-color-on-surface);
  }

  .assessment-subtitle {
    margin: 0;
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    color: var(--md-sys-color-on-surface-variant);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-label {
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }

  .form-input {
    padding: var(--spacing-md);
    border: 1px solid var(--md-sys-color-outline);
    border-radius: var(--radius-sm);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-large-font);
    font-size: var(--md-sys-typescale-body-large-size);
    transition: border-color var(--transition-fast);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
  }

  .form-input.error {
    border-color: var(--md-sys-color-error);
  }

  .error-message {
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    color: var(--md-sys-color-error);
  }

  .modal-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  .btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--md-sys-typescale-label-large-font);
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: var(--md-sys-typescale-label-large-weight);
    cursor: pointer;
    transition: all var(--transition-fast);
    min-width: 80px;
  }

  .btn-secondary {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline);
  }

  .btn-secondary:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .btn-primary {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  .btn-primary:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  .btn-danger {
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
  }

  .btn-danger:hover {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn:disabled:hover {
    background-color: inherit;
    color: inherit;
  }

  .btn .material-symbols-outlined {
    font-size: 18px;
    margin-right: var(--spacing-xs);
  }

  /* Tab Navigation Styles */
  .tab-navigation {
    display: flex;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container);
  }

  .tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    background: none;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-label-large-font);
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: var(--md-sys-typescale-label-large-weight);
    cursor: pointer;
    transition: all var(--transition-fast);
    border-bottom: 2px solid transparent;
  }

  .tab-button:hover {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
  }

  .tab-button.active {
    color: var(--md-sys-color-primary);
    border-bottom-color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-primary-container);
  }

  .tab-button .material-symbols-outlined {
    font-size: 20px;
  }

  /* Confirmation Dialog Styles */
  .confirmation-dialog {
    text-align: center;
    padding: var(--spacing-lg);
  }

  .confirmation-icon {
    margin-bottom: var(--spacing-md);
  }

  .confirmation-icon .material-symbols-outlined {
    font-size: 48px;
    color: var(--md-sys-color-error);
  }

  .confirmation-title {
    margin: 0 0 var(--spacing-md) 0;
    font-family: var(--md-sys-typescale-headline-small-font);
    font-size: var(--md-sys-typescale-headline-small-size);
    font-weight: var(--md-sys-typescale-headline-small-weight);
    color: var(--md-sys-color-on-surface);
  }

  .confirmation-message {
    margin: 0 0 var(--spacing-lg) 0;
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.5;
  }

  .confirmation-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .btn:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: scale(0.8) translateY(30px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .custom-modal-content {
      margin: var(--spacing-md);
      max-width: none;
    }

    .custom-modal-header {
      padding: var(--spacing-md);
    }

    .custom-modal-body {
      padding: var(--spacing-md);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .custom-modal-overlay,
    .custom-modal-content {
      animation: none;
    }
  }
</style>