<script>
  let {
    dirty = false,
    saving = false,
    onclick,
    dirtyLabel = 'Save',
    savedLabel = 'Saved',
    savingLabel = 'Saving…',
    title = '',
  } = $props();
</script>

<div class="save-wrap" class:save-wrap-dirty={dirty}>
  <div class="save-rainbow" aria-hidden="true"></div>
  <button
    class="save-btn"
    class:save-btn-dirty={dirty}
    {onclick}
    disabled={saving || !dirty}
    {title}
    type="button"
  >
    {saving ? savingLabel : dirty ? dirtyLabel : savedLabel}
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
    padding: var(--space-2) var(--space-5);
    font-size: var(--font-sm);
    font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-3);
    background: var(--bg-0);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    cursor: default;
    transition: all var(--transition-fast);
    letter-spacing: -0.01em;
  }
  .save-btn-dirty {
    color: var(--bg-0);
    background: var(--text-0);
    border-color: transparent;
    cursor: pointer;
  }
  .save-btn-dirty:hover { opacity: 0.9; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-btn-dirty:disabled { opacity: 0.6; }

  @keyframes rainbow-spin {
    to { --rainbow-angle: 360deg; }
  }
  @property --rainbow-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
</style>
