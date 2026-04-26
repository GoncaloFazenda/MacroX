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

  const eyebrow = $derived(danger ? 'Before you continue' : 'Please confirm');

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
    <div class="modal-content confirm-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="cm-top">
        <div class="cm-intro">
          <span class="cm-eyebrow">{eyebrow}</span>
          <div class="cm-head">
            <div class="cm-icon" class:cm-icon-danger={danger}>
              <AlertTriangle size={15} strokeWidth={1.7} />
            </div>
            <div>
              <h2 class="cm-title">{title}</h2>
              {#if message}
                <p class="cm-body">{message}</p>
              {/if}
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick={handleCancel} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      {#if warning}
        <div class="cm-warn">
          <span class="cm-warn-label">{danger ? 'Impact' : 'Note'}</span>
          <span>{warning}</span>
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
    max-width: 480px;
    padding: var(--space-6);
  }
  .cm-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }
  .cm-intro {
    flex: 1;
    min-width: 0;
  }
  .cm-eyebrow {
    display: inline-block;
    font-size: var(--font-xs);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    margin-bottom: var(--space-3);
  }
  .cm-head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
  }
  .cm-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--accent-subtle);
    color: var(--text-1);
    flex-shrink: 0;
  }
  .cm-icon-danger {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .cm-title {
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .cm-body {
    margin-top: var(--space-2);
    font-size: var(--font-sm);
    color: var(--text-2);
    line-height: 1.6;
  }
  .cm-warn {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: var(--space-5);
    padding: var(--space-4);
    background: color-mix(in srgb, var(--danger-bg) 80%, transparent);
    border: var(--border-width) solid color-mix(in srgb, var(--danger) 18%, transparent);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    color: var(--text-1);
    line-height: 1.5;
  }
  .cm-warn-label {
    font-size: var(--font-xs);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
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
    .cm-head {
      gap: var(--space-3);
    }
    .cm-actions {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
</style>
