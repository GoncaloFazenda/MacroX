<script>
  import { X, AlertTriangle, Info } from 'lucide-svelte';

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
      class="modal-content confirm-modal"
      class:confirm-modal-danger={danger}
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="cm-top">
        <div class="cm-head">
          <div class="cm-icon" class:cm-icon-danger={danger}>
            {#if danger}
              <AlertTriangle size={15} strokeWidth={1.8} />
            {:else}
              <Info size={15} strokeWidth={1.8} />
            {/if}
          </div>
          <div class="cm-text">
            <h2 class="cm-title">{title}</h2>
            {#if message}
              <p class="cm-body">{message}</p>
            {/if}
          </div>
        </div>
        <button class="cm-close" onclick={handleCancel} aria-label="Close" type="button">
          <X size={14} strokeWidth={1.6} />
        </button>
      </div>

      {#if warning}
        <div class="cm-note" class:cm-note-danger={danger}>
          <span class="cm-note-dot" aria-hidden="true"></span>
          <span class="cm-note-text">{warning}</span>
        </div>
      {/if}

      <div class="cm-actions">
        <button type="button" class="btn btn-ghost" onclick={handleCancel}>{cancelText}</button>
        <button type="button" class="btn {danger ? 'btn-danger' : 'btn-primary'}" onclick={handleConfirm}>{confirmText}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-modal {
    max-width: 440px;
    padding: var(--space-6);
  }
  .cm-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .cm-head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    flex: 1;
    min-width: 0;
  }
  .cm-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--accent-subtle);
    color: var(--text-1);
    flex-shrink: 0;
  }
  .cm-icon-danger {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .cm-text {
    flex: 1;
    min-width: 0;
    padding-top: 4px;
  }
  .cm-title {
    font-size: var(--font-md);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text-0);
  }
  .cm-body {
    margin-top: var(--space-2);
    font-size: var(--font-sm);
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
    border: none;
    background: transparent;
    color: var(--text-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
    flex-shrink: 0;
  }
  .cm-close:hover { color: var(--text-0); background: var(--bg-hover); }

  /* Neutral note (default) — subtle accent box, no red */
  .cm-note {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    margin-top: var(--space-5);
    padding: var(--space-3) var(--space-4);
    background: var(--accent-subtle);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    color: var(--text-1);
    line-height: 1.5;
  }
  .cm-note-dot {
    width: 4px;
    align-self: stretch;
    background: var(--text-3);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .cm-note-text {
    flex: 1;
    color: var(--text-1);
  }

  /* Danger note — red-tinted */
  .cm-note-danger {
    background: color-mix(in srgb, var(--danger-bg) 80%, transparent);
  }
  .cm-note-danger .cm-note-dot {
    background: var(--danger);
  }

  .cm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-6);
  }

  @media (max-width: 640px) {
    .confirm-modal {
      width: calc(100% - 24px);
      padding: var(--space-5);
    }
    .cm-head { gap: var(--space-3); }
    .cm-actions {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
</style>
