<script>
  import { Check } from 'lucide-svelte';

  let {
    ready = true,
    dirty = false,
    saving = false,
    onclick,
    dirtyLabel = 'Save',
    idleLabel = 'Saved',
    savedLabel = 'Saved',
    savingLabel = 'Saving...',
    loadingLabel = 'Loading...',
    title = '',
  } = $props();

  let prevSaving = false;
  let justSaved = $state(false);
  let timeout;

  $effect(() => {
    if (ready && prevSaving && !saving && !dirty) {
      justSaved = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        justSaved = false;
      }, 1600);
    }
    prevSaving = saving;
  });

  $effect(() => () => clearTimeout(timeout));
</script>

<div class="save-wrap" class:save-wrap-dirty={dirty}>
  <div class="save-glow" aria-hidden="true"></div>
  <button
    class="save-btn"
    class:save-btn-dirty={dirty}
    class:save-btn-success={justSaved}
    {onclick}
    disabled={!ready || saving || !dirty}
    {title}
    type="button"
  >
    {#if justSaved}
      <span class="save-icon"><Check size={14} strokeWidth={2.5} /></span>
      <span class="save-text">{savedLabel}</span>
    {:else}
      <span class="save-text">{!ready ? loadingLabel : saving ? savingLabel : dirty ? dirtyLabel : idleLabel}</span>
    {/if}
  </button>
</div>

<style>
  .save-wrap {
    position: relative;
    display: inline-flex;
  }
  .save-glow {
    position: absolute;
    inset: -6px;
    border-radius: calc(var(--radius-md) + 8px);
    background:
      radial-gradient(circle at 18% 50%, color-mix(in srgb, var(--cal) 24%, transparent) 0, transparent 55%),
      radial-gradient(circle at 82% 50%, color-mix(in srgb, var(--pro) 20%, transparent) 0, transparent 58%),
      radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--text-0) 14%, transparent) 0, transparent 62%);
    opacity: 0;
    filter: blur(10px);
    transition: opacity var(--transition-fast), transform var(--transition-fast);
    pointer-events: none;
  }
  .save-wrap-dirty .save-glow {
    opacity: 0.95;
    transform: scale(1.01);
  }
  .save-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 96px;
    justify-content: center;
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
    box-shadow: 0 8px 24px color-mix(in srgb, var(--text-0) 16%, transparent);
  }
  .save-btn-dirty:hover { opacity: 0.9; }
  .save-btn-dirty:active { transform: scale(0.97); }
  .save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .save-btn-dirty:disabled { opacity: 0.6; }
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
  .save-text { display: inline-block; }
</style>
