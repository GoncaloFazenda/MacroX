<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  let { date, onprev, onnext, ontoday, formatOptions, class: className = '', style = '' } = $props();

  const defaultFormat = { weekday: 'long', month: 'short', day: 'numeric' };
  const fmt = $derived(formatOptions || defaultFormat);
  const label = $derived(new Date(date + 'T00:00').toLocaleDateString('en-US', fmt));
</script>

<div class="date-bar {className}" {style}>
  <button class="btn btn-ghost btn-sm" onclick={onprev} aria-label="Previous">
    <ChevronLeft size={22} />
  </button>
  <span class="date-text">{label}</span>
  <button class="btn btn-ghost btn-sm" onclick={onnext} aria-label="Next">
    <ChevronRight size={22} />
  </button>
  {#if ontoday}
    <button class="today-btn" onclick={ontoday}>Today</button>
  {/if}
</div>

<style>
  .date-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    justify-content: center;
  }
  .date-text {
    font-size: var(--font-lg);
    font-weight: 600;
    min-width: 220px;
    text-align: center;
  }
  .today-btn {
    position: absolute;
    margin-left: 420px;
    padding: 3px 12px;
    font-size: var(--font-xs);
    font-family: var(--font-sans);
    font-weight: 500;
    color: var(--text-2);
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .today-btn:hover {
    color: var(--text-0);
    border-color: var(--border-strong);
  }
</style>
