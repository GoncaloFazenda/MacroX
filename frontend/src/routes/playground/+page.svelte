<script>
  import { api } from '$lib/api/client.js';
  import { CheckCircle, XCircle, Play } from 'lucide-svelte';

  let tests = $state([]);
  let running = $state(false);

  const testSuite = [
    { name: 'API Health', desc: 'Backend status', run: async () => { const r = await fetch('/api/health'); const d = await r.json(); if (d.status !== 'ok') throw new Error('Fail'); return 'OK'; } },
    { name: 'Register', desc: 'Create account', run: async () => { const e = `t-${Date.now()}@test.io`; try { const d = await api.post('/auth/register', { name: 'Test', email: e, password: 'test123456' }); return d.user.email; } catch (err) { if (err.message.includes('already')) return 'Exists (OK)'; throw err; } } },
    { name: 'Login', desc: 'Authenticate', run: async () => { const e = `pg-${Date.now()}@test.io`; await api.post('/auth/register', { name: 'PG', email: e, password: 'test123456' }); const d = await api.post('/auth/login', { email: e, password: 'test123456' }); return d.user.name; } },
    { name: 'Auth Check', desc: 'JWT cookie', run: async () => { const d = await api.get('/auth/me'); return d.user.name; } },
    { name: 'List Foods', desc: 'Fetch database', run: async () => { const d = await api.get('/foods?limit=5'); return `${d.pagination.total} foods`; } },
    { name: 'Search', desc: 'Find chicken', run: async () => { const d = await api.get('/foods?search=chicken'); return `${d.foods.length} results`; } },
    { name: 'Create Food', desc: 'Custom item', run: async () => { const d = await api.post('/foods', { name: `TF-${Date.now()}`, protein: 20, totalCarbs: 10, fiber: 3, fat: 5, calories: 165, category: 'Protein' }); return d.food.name; } },
    { name: 'Composite Meal', desc: 'Build meal', run: async () => { const f = await api.get('/foods?limit=2'); const d = await api.post('/composite-meals', { name: `TM-${Date.now()}`, items: [{ foodId: f.foods[0]._id, quantity: 150 }, { foodId: f.foods[1]._id, quantity: 100 }] }); return `${d.meal.totalMacros.calories} kcal`; } },
    { name: 'Daily Plan', desc: 'Save plan', run: async () => { const f = await api.get('/foods?limit=1'); const t = new Date().toISOString().split('T')[0]; await api.put('/daily-plans', { date: t, meals: [{ slot: 'breakfast', items: [{ type: 'food', refId: f.foods[0]._id, quantity: 100 }] }] }); return t; } },
    { name: 'Update Goals', desc: 'Macro targets', run: async () => { const d = await api.put('/auth/goals', { goals: { calories: 2500, protein: 180, netCarbs: 80, fat: 70 } }); return `${d.user.goals.calories} kcal`; } },
    { name: 'Logout', desc: 'Clear session', run: async () => { await api.post('/auth/logout'); return 'Done'; } },
  ];

  async function runAll() {
    running = true;
    tests = testSuite.map(t => ({ ...t, status: 'pending', result: '' }));
    for (let i = 0; i < tests.length; i++) {
      tests[i].status = 'running'; tests = [...tests];
      try { tests[i].result = await testSuite[i].run(); tests[i].status = 'pass'; }
      catch (err) { tests[i].result = err.message; tests[i].status = 'fail'; }
      tests = [...tests];
      await new Promise(r => setTimeout(r, 150));
    }
    running = false;
  }

  const pass = $derived(tests.filter(t => t.status === 'pass').length);
  const fail = $derived(tests.filter(t => t.status === 'fail').length);
</script>

<svelte:head><title>Playground — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Playground</h1>
      <p class="page-subtitle">E2E test suite</p>
    </div>
    <button class="btn btn-primary btn-sm" onclick={runAll} disabled={running}>
      {#if running}Running…{:else}<Play size={13} strokeWidth={1.5} /> Run{/if}
    </button>
  </div>

  {#if tests.length > 0}
    <div class="summary animate-slide-up">
      <span class="s-pass">{pass} passed</span>
      <span class="s-fail">{fail} failed</span>
      <span class="s-total">{pass + fail} / {tests.length}</span>
      <div class="s-bar">
        <div class="s-fill pass" style="width: {tests.length ? (pass / tests.length * 100) : 0}%"></div>
        <div class="s-fill fail" style="width: {tests.length ? (fail / tests.length * 100) : 0}%"></div>
      </div>
    </div>
  {/if}

  <div class="test-list">
    {#each (tests.length > 0 ? tests : testSuite.map(t => ({...t, status: 'idle', result: ''}))) as test, i}
      <div class="test-row" class:pass={test.status === 'pass'} class:fail={test.status === 'fail'} style="animation-delay: {i * 25}ms">
        <div class="t-status">
          {#if test.status === 'pass'}<CheckCircle size={14} strokeWidth={1.5} style="color: var(--success)" />
          {:else if test.status === 'fail'}<XCircle size={14} strokeWidth={1.5} style="color: var(--danger)" />
          {:else if test.status === 'running'}<div class="t-spinner"></div>
          {:else}<div class="t-dot"></div>{/if}
        </div>
        <div class="t-info"><span class="t-name">{test.name}</span><span class="t-desc">{test.desc}</span></div>
        {#if test.result}<span class="t-result mono" class:error={test.status === 'fail'}>{test.result}</span>{/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }

  .summary { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: var(--space-5); flex-wrap: wrap; }
  .s-pass { font-size: var(--font-sm); font-weight: 500; color: var(--success); }
  .s-fail { font-size: var(--font-sm); font-weight: 500; color: var(--danger); }
  .s-total { font-size: var(--font-sm); color: var(--text-2); margin-left: auto; }
  .s-bar { width: 100%; height: 2px; background: var(--bg-3); border-radius: 1px; display: flex; overflow: hidden; }
  .s-fill { height: 100%; transition: width 300ms ease; }
  .s-fill.pass { background: var(--success); }
  .s-fill.fail { background: var(--danger); }

  .test-list { display: flex; flex-direction: column; }
  .test-row {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border);
    animation: slideUp 200ms ease both;
  }
  .test-row.pass { border-left: 2px solid var(--success); }
  .test-row.fail { border-left: 2px solid var(--danger); }

  .t-status { width: 18px; flex-shrink: 0; display: flex; justify-content: center; }
  .t-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bg-4); }
  .t-spinner { width: 14px; height: 14px; border: 1.5px solid var(--bg-4); border-top-color: var(--text-1); border-radius: 50%; animation: spin 600ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .t-info { flex: 1; }
  .t-name { font-size: var(--font-sm); font-weight: 500; display: block; }
  .t-desc { font-size: var(--font-xs); color: var(--text-3); }

  .t-result { font-size: var(--font-xs); color: var(--success); }
  .t-result.error { color: var(--danger); }
</style>
