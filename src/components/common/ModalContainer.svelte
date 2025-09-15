<script>
  import { modalStore } from './js/modalStore.js';
  import Modal from './Modal.svelte';

  // Subscribe to modal store
  let modals = $state([]);
  
  // Subscribe to store updates
  modalStore.subscribe(value => {
    modals = value;
  });

  // Handle modal close
  function handleModalClose(modalId) {
    modalStore.close(modalId);
  }

  // Dynamic component resolver
  function resolveComponent(componentName) {
    // This is a placeholder - in a real implementation, you'd have a registry
    // of components or use dynamic imports
    switch (componentName) {
      case 'ConfirmModal':
        return null; // Would import ConfirmModal component
      case 'AlertModal':
        return null; // Would import AlertModal component
      case 'PromptModal':
        return null; // Would import PromptModal component
      default:
        return componentName; // Assume it's already a component
    }
  }
</script>

<!-- Render all active modals -->
{#each modals as modal (modal.id)}
  <Modal 
    title={modal.props.title || ''}
    size={modal.options.size || 'medium'}
    closable={modal.options.closable !== false}
    backdrop={modal.options.backdrop !== false}
    onClose={() => handleModalClose(modal.id)}
  >
    <!-- Dynamic content based on modal type -->
    {#if typeof modal.component === 'string'}
      <!-- Handle string-based component names -->
      {#if modal.component === 'ConfirmModal'}
        <div class="modal-confirm-content">
          <div class="modal-message">{@html modal.props.message}</div>
          <div class="modal-actions">
            <button 
              class="modal-btn modal-btn-secondary" 
              onclick={() => {
                if (modal.props.onCancel) modal.props.onCancel();
                handleModalClose(modal.id);
              }}
            >
              Cancel
            </button>
            <button 
              class="modal-btn modal-btn-primary" 
              onclick={() => {
                if (modal.props.onConfirm) modal.props.onConfirm();
                handleModalClose(modal.id);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      {:else if modal.component === 'AlertModal'}
        <div class="modal-alert-content">
          <p class="modal-message">{modal.props.message}</p>
          <div class="modal-actions">
            <button 
              class="modal-btn modal-btn-primary" 
              onclick={() => {
                if (modal.props.onClose) modal.props.onClose();
                handleModalClose(modal.id);
              }}
            >
              OK
            </button>
          </div>
        </div>
      {:else if modal.component === 'PromptModal'}
        <div class="modal-prompt-content">
          <p class="modal-message">{modal.props.message}</p>
          <input 
            type="text" 
            class="modal-input" 
            placeholder={modal.props.placeholder || "Enter value..."}
            bind:value={modal.props.inputValue}
          />
          <div class="modal-actions">
            <button 
              class="modal-btn modal-btn-secondary" 
              onclick={() => {
                if (modal.props.onCancel) modal.props.onCancel();
                handleModalClose(modal.id);
              }}
            >
              Cancel
            </button>
            <button 
              class="modal-btn modal-btn-primary" 
              onclick={() => {
                if (modal.props.onSubmit) modal.props.onSubmit(modal.props.inputValue || modal.props.defaultValue || '');
                handleModalClose(modal.id);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      {:else if modal.component === 'CustomModal'}
        <div class="modal-custom-content">
          {@html modal.props.content}
        </div>
      {:else}
        <!-- Fallback for unknown string components -->
        <div class="modal-generic-content">
          <p>Component '{modal.component}' not found</p>
        </div>
      {/if}
    {:else}
      <!-- Handle Svelte component instances -->
      <svelte:component this={modal.component} {...modal.props} />
    {/if}
  </Modal>
{/each}

<style>
  /* Modal content styles */
  .modal-confirm-content,
  .modal-alert-content,
  .modal-prompt-content,
  .modal-custom-content,
  .modal-generic-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
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

  /* Enhanced styling for HTML content in messages */
  .modal-message :global(p) {
    margin: 0 0 12px 0;
  }

  .modal-message :global(p:last-child) {
    margin-bottom: 0;
  }

  .modal-message :global(strong) {
    font-weight: 600;
  }

  .modal-message :global(div) {
    margin: 8px 0;
  }

  .modal-input {
    padding: var(--spacing-md);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--radius-md);
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    transition: border-color var(--transition-fast);
  }

  .modal-input:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
  }

  .modal-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    margin-top: var(--spacing-md);
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

  .modal-btn:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .modal-actions {
      flex-direction: column-reverse;
    }

    .modal-btn {
      width: 100%;
    }
  }
</style>