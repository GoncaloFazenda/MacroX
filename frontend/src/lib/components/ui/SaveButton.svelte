<script>
  import { Check } from 'lucide-svelte';

  let {
    dirty = false,
    saving = false,
    onclick,
    dirtyLabel = 'Save',
    savedLabel = 'Saved',
    savingLabel = 'Saving…',
    title = '',
  } = $props();

  let prevSaving = false;
  let justSaved = $state(false);
  let timeout;

  $effect(() => {
    const isSaving = saving;
    const isDirty = dirty;
    if (prevSaving && !isSaving && !isDirty) {
      justSaved = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => { justSaved = false; }, 1600);
    }
    prevSaving = isSaving;
  });

  $effect(() => () => clearTimeout(timeout));
</script>

<div class="save-wrap" class:save-wrap-dirty={dirty}>
  <div class="save-rainbow" aria-hidden="true"></div>
  <button
    class="save-btn"
    class:save-btn-dirty={dirty}
    class:save-btn-success={justSaved}
    {onclick}
    disabled={saving || !dirty}
    {title}
    type="button"
  >
    {#if justSaved}
      <span class="save-icon"><Check size={14} strokeWidth={2.5} /></span>
      <span class="save-text">{savedLabel}</span>
    {:else}
      <span class="save-text">{saving ? savingLabel : dirty ? dirtyLabel : savedLabel}</span>
    {/if}
  </button>
</div>

<style>
  .save-wrap {
    position: relative;
    display: inline-flex;
  }
  .save-rainbow {
    position: absolute;
    inset: -2px;
    border-radius: calc(var(--radius-md) + 2px);
    background: conic-gradient(
      from var(--rainbow-angle, 0deg),
      #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #f97316
    );
    opacity: 0;
    transition: opacity var(--transition-fast);
    animation: rainbow-spin 3s linear infinite;
    pointer-events: none;
  }
  .save-wrap-dirty .save-rainbow {
    opacity: 1;
  }
  .save-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-2) var(--space-5);
    font-size: var(--font-sm);
    font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-3);
    background: var(--bg-0);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    cursor: default;
    transition: background var(--transition-base), color var(--transition-base),
                border-color var(--transition-base), transform var(--transition-fast);
    letter-spacing: -0.01em;
  }
  .save-btn-dirty {
    color: var(--bg-0);
    background: var(--text-0);
    border-color: transparent;
    cursor: pointer;
  }
  .save-btn-dirty:hover { opacity: 0.9; }
  .save-btn-dirty:active { transform: scale(0.97); }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-btn-dirty:disabled { opacity: 0.6; }

  /* Just-saved success morph */
  .save-btn-success {
    color: var(--success);
    background: var(--success-bg);
    border-color: var(--success);
    cursor: default;
    opacity: 1 !important;
  }
  .save-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    animation: successPop 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .save-text {
    display: inline-block;
  }

  @keyframes rainbow-spin {
    to { --rainbow-angle: 360deg; }
  }
  @property --rainbow-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
</style>
