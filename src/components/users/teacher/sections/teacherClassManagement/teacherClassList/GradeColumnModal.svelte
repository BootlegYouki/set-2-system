<script>
  import { createEventDispatcher } from 'svelte';

  export let assessmentType = '';
  export let columnIndex = 0;
  export let columnName = '';
  export let currentTotal = '';
  export let onSave = () => {};
  export let onRename = () => {};
  export let onRemove = () => {};
  export let canRemove = true;
  export let existingColumnNames = [];

  const dispatch = createEventDispatcher();

  let newTotal = currentTotal || '';
  let newColumnName = columnName || '';
  let error = '';
  let nameError = '';
  let activeTab = 'settings'; // 'settings' or 'total'
  let showRemoveConfirm = false;

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
      onSave(assessmentType, columnIndex, newTotal);
      dispatch('close');
    }
  }

  function handleRename() {
    if (validateColumnName()) {
      onRename(assessmentType, columnIndex, newColumnName.trim());
      dispatch('close');
    }
  }

  function handleRemove() {
    showRemoveConfirm = true;
  }

  function confirmRemove() {
    onRemove(assessmentType, columnIndex);
    dispatch('close');
  }

  function cancelRemove() {
    showRemoveConfirm = false;
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="modal-content">
  <div class="modal-header">
    <h3>Column Settings</h3>
    <button class="close-btn" on:click={handleClose} aria-label="Close modal">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <div class="modal-body">
    {#if !showRemoveConfirm}
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn {activeTab === 'settings' ? 'active' : ''}"
          on:click={() => activeTab = 'settings'}
        >
          Column Settings
        </button>
        <button 
          class="tab-btn {activeTab === 'total' ? 'active' : ''}"
          on:click={() => activeTab = 'total'}
        >
          Total Score
        </button>
      </div>

      <!-- Tab Content -->
      {#if activeTab === 'settings'}
        <div class="tab-content">
          <div class="form-group">
            <label for="columnName">Column Name</label>
            <input
              id="columnName"
              type="text"
              bind:value={newColumnName}
              placeholder="Enter column name"
              class="form-input {nameError ? 'error' : ''}"
              maxlength="20"
            />
            {#if nameError}
              <div class="error-message">{nameError}</div>
            {/if}
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" on:click={handleRename}>
              Rename Column
            </button>
            {#if canRemove}
              <button class="btn btn-danger" on:click={handleRemove}>
                Remove Column
              </button>
            {/if}
          </div>
        </div>
      {:else if activeTab === 'total'}
        <div class="tab-content">
          <div class="form-group">
            <label for="totalScore">Total Score</label>
            <input
              id="totalScore"
              type="number"
              bind:value={newTotal}
              placeholder="Enter total score"
              class="form-input {error ? 'error' : ''}"
              min="0"
              max="100"
              step="0.01"
            />
            {#if error}
              <div class="error-message">{error}</div>
            {/if}
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" on:click={handleSave}>
              Update Total
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <!-- Remove Confirmation -->
      <div class="confirm-content">
        <div class="confirm-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h4>Remove Column</h4>
        <p>Are you sure you want to remove this column? This action cannot be undone and will delete all grades in this column.</p>
        
        <div class="confirm-actions">
          <button class="btn btn-secondary" on:click={cancelRemove}>
            Cancel
          </button>
          <button class="btn btn-danger" on:click={confirmRemove}>
            Remove Column
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-content {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #6b7280;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-body {
    padding: 24px;
  }

  .tab-navigation {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 24px;
  }

  .tab-btn {
    background: none;
    border: none;
    padding: 12px 16px;
    cursor: pointer;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #374151;
  }

  .tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .tab-content {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
  }

  .form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .error-message {
    margin-top: 6px;
    font-size: 12px;
    color: #ef4444;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .confirm-content {
    text-align: center;
  }

  .confirm-icon {
    margin: 0 auto 16px;
    color: #ef4444;
  }

  .confirm-content h4 {
    margin: 0 0 12px;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  }

  .confirm-content p {
    margin: 0 0 24px;
    color: #6b7280;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
</style>