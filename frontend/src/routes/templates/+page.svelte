<script>
  import { api } from '$lib/api/client.js';
  import { onMount } from 'svelte';
  import { Trash2 } from 'lucide-svelte';

  let templates = $state([]);
  let loading = $state(true);

  onMount(async () => {
    loading = true;
    try { const data = await api.get('/templates'); templates = data.templates; } catch {}
    loading = false;
  });

  async function deleteTemplate(id) {
    if (confirm('Delete?')) {
      await api.del(`/templates/${id}`);
      templates = templates.filter(t => t._id !== id);
    }
  }
</script>

<svelte:head><title>Templates — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Templates</h1>
      <p class="page-subtitle">Saved meal configurations</p>
    </div>
  </div>

  {#if loading}
    <div class="skeleton" style="height: 200px;"></div>
  {:else if templates.length === 0}
    <div class="empty-state"><p class="empty-state-text">No templates yet.</p></div>
  {:else}
    <div class="tmpl-list">
      {#each templates as t, i}
        <div class="tmpl-row animate-slide-up" style="animation-delay: {i * 30}ms">
          <div class="tmpl-info">
            <span class="tmpl-name">{t.name}</span>
            <span class="tmpl-count">{t.items?.length || 0} items</span>
          </div>
          <div class="tmpl-macros">
            <span class="mono" style="color: var(--cal)">{Math.round(t.totalMacros?.calories || 0)}</span>
            <span class="ml">kcal</span>
            <span class="mono" style="color: var(--pro)">{t.totalMacros?.protein || 0}g</span>
            <span class="ml">P</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => deleteTemplate(t._id)} style="color: var(--text-3);"><Trash2 size={13} strokeWidth={1.5} /></button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .top-bar { margin-bottom: var(--space-5); }
  .tmpl-list { display: flex; flex-direction: column; }
  .tmpl-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); border-bottom: var(--border-width) solid var(--border); }
  .tmpl-row:hover { background: var(--bg-hover); }
  .tmpl-info { flex: 1; }
  .tmpl-name { font-size: var(--font-sm); font-weight: 500; display: block; }
  .tmpl-count { font-size: var(--font-xs); color: var(--text-3); }
  .tmpl-macros { display: flex; align-items: baseline; gap: var(--space-1); }
  .ml { font-size: var(--font-xs); color: var(--text-3); margin-right: var(--space-2); }
</style>
