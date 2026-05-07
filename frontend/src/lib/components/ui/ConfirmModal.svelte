<script>
  import { X, AlertTriangle } from 'lucide-svelte';

  let {
    open = false,
    title = 'Confirm',
    message = '',
    warning = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onconfirm,
    oncancel,
  } = $props();

  function handleCancel() {
    oncancel?.();
  }

  function handleConfirm() {
    onconfirm?.();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={handleCancel}>
    <div
      class="modal-content cm-modal"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <header class="cm-head">
        <div class="cm-head-text">
          <h2 class="cm-title">{title}</h2>
          {#if message}
            <p class="cm-sub">{message}</p>
          {/if}
        </div>
        <button class="cm-close" onclick={handleCancel} aria-label="Close" type="button">
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      {#if warning}
        <div class="cm-warn" class:cm-warn-danger={danger}>
          <AlertTriangle size={14} strokeWidth={1.75} />
          <span>{warning}</span>
        </div>
      {/if}

      <footer class="cm-foot">
        <button type="button" class="btn btn-ghost" onclick={handleCancel}>{cancelText}</button>
        <button type="button" class="btn {danger ? 'btn-danger' : 'btn-primary'}" onclick={handleConfirm}>{confirmText}</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .cm-modal {
    max-width: 440px;
    padding: var(--space-5) var(--space-5) var(--space-4);
  }

  .cm-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .cm-head-text {
    flex: 1;
    min-width: 0;
  }
  .cm-title {
    margin: 0;
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text-0);
    line-height: 1.3;
  }
  .cm-sub {
    margin: 4px 0 0;
    font-size: var(--font-xs);
    color: var(--text-2);
    line-height: 1.55;
  }
  .cm-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--text-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
    flex-shrink: 0;
  }
  .cm-close:hover {
    color: var(--text-0);
    background: var(--bg-hover);
  }

  .cm-warn {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px var(--space-3);
    margin-bottom: var(--space-5);
    background: var(--bg-hover);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-xs);
    color: var(--text-2);
    line-height: 1.5;
  }
  .cm-warn :global(svg) {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--text-3);
  }
  .cm-warn-danger {
    background: var(--danger-bg);
    border-color: rgba(201, 112, 112, 0.2);
    color: var(--text-1);
  }
  .cm-warn-danger :global(svg) {
    color: var(--danger);
  }

  .cm-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  @media (max-width: 640px) {
    .cm-modal {
      width: calc(100% - 24px);
    }
    .cm-foot {
      flex-direction: column-reverse;
    }
    .cm-foot :global(.btn) {
      width: 100%;
    }
  }
</style>
