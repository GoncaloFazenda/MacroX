<script>
  import { auth } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { Eye, EyeOff } from 'lucide-svelte';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let submitting = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    submitting = true;
    const success = await auth.register(name, email, password);
    if (success) goto('/overview');
    submitting = false;
  }
</script>

<svelte:head><title>Create Account — MacroX</title></svelte:head>

<div class="auth-page">
  <div class="auth-card animate-scale-in">
    <div class="auth-header">
      <h1 class="auth-logo">
        <span class="auth-logo-macro">Macro</span><span class="auth-logo-x">X</span>
      </h1>
      <p class="auth-sub">Create your account</p>
    </div>

    <form class="auth-form" onsubmit={handleSubmit}>
      {#if $auth.error}
        <div class="auth-error">{$auth.error}</div>
      {/if}

      <div class="field">
        <label class="label" for="name">Name</label>
        <input id="name" type="text" class="input" placeholder="Your name" bind:value={name} required />
      </div>

      <div class="field">
        <label class="label" for="email">Email</label>
        <input id="email" type="email" class="input" placeholder="you@example.com" bind:value={email} required />
      </div>

      <div class="field">
        <label class="label" for="password">Password</label>
        <div class="pw-wrap">
          <input id="password" type={showPassword ? 'text' : 'password'} class="input" placeholder="Min. 6 characters" bind:value={password} minlength="6" required />
          <button type="button" class="pw-toggle" onclick={() => showPassword = !showPassword}>
            {#if showPassword}<EyeOff size={13} strokeWidth={1.5} />{:else}<Eye size={13} strokeWidth={1.5} />{/if}
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-lg submit-btn" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Account'}
      </button>
    </form>

    <div class="auth-footer">
      <span>Have an account?</span>
      <a href="/login">Sign in</a>
    </div>
  </div>
</div>

<style>
  .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
  .auth-card { width: 100%; max-width: 360px; background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: var(--radius-xl); padding: var(--space-8); }
  .auth-header { text-align: center; margin-bottom: var(--space-8); }
  .auth-logo {
    font-size: var(--font-3xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    margin-bottom: var(--space-3);
    display: inline-flex;
    align-items: baseline;
  }
  .auth-logo-macro {
    display: inline-block;
    animation: logoMacroIn 500ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both;
  }
  .auth-logo-x {
    display: inline-block;
    color: var(--cal);
    transform-origin: 50% 70%;
    animation: logoXIn 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 750ms both;
  }
  .auth-sub {
    font-size: var(--font-sm);
    color: var(--text-2);
    animation: logoMacroIn 500ms ease 1100ms both;
  }
  .auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
  .auth-error { padding: var(--space-3); background: var(--danger-bg); border: var(--border-width) solid rgba(201,112,112,0.15); border-radius: var(--radius-md); color: var(--danger); font-size: var(--font-sm); }
  .field { display: flex; flex-direction: column; }
  .pw-wrap { position: relative; }
  .pw-wrap .input { padding-right: 32px; }
  .pw-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-3); cursor: pointer; padding: 2px; display: flex; }
  .submit-btn { width: 100%; margin-top: var(--space-2); }
  .auth-footer { text-align: center; margin-top: var(--space-6); font-size: var(--font-sm); color: var(--text-2); display: flex; gap: var(--space-2); justify-content: center; }
  .auth-footer a { color: var(--text-0); font-weight: 500; }
</style>
