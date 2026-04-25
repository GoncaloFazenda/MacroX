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
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="cm-head">
        <h2 class="cm-title">{title}</h2>
        <button class="btn btn-ghost btn-sm" onclick={handleCancel} aria-label="Close"><X size={14} /></button>
      </div>
      {#if message}
        <p class="cm-body">{message}</p>
      {/if}
      {#if warning}
        <div class="cm-warn">
          <AlertTriangle size={14} strokeWidth={1.5} />
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
  .cm-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
  }
  .cm-title {
    font-size: var(--font-lg);
    font-weight: 600;
  }
  .cm-body {
    font-size: var(--font-sm);
    color: var(--text-2);
    margin-bottom: var(--space-4);
    line-height: 1.6;
  }
  .cm-warn {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--danger-bg);
    border: var(--border-width) solid rgba(201, 112, 112, 0.15);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    color: var(--text-1);
    line-height: 1.5;
    margin-bottom: var(--space-5);
  }
  .cm-warn :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--danger);
  }
  .cm-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }
</style>
