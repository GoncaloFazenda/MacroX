<script>
  let {
    value = 0,
    duration = 800,
    decimals = 0,
    suffix = '',
    initial = 0,
  } = $props();

  let display = $state(initial);
  let raf;
  let lastTarget = initial;

  $effect(() => {
    const target = Number(value) || 0;
    if (target === lastTarget) return;
    const start = display;
    lastTarget = target;
    const startTime = performance.now();
    cancelAnimationFrame(raf);

    const factor = decimals === 0 ? 1 : Math.pow(10, decimals);

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (target - start) * eased;
      display = Math.round(current * factor) / factor;
      if (t < 1) raf = requestAnimationFrame(tick);
      else display = target;
    }
    raf = requestAnimationFrame(tick);
  });

  $effect(() => () => cancelAnimationFrame(raf));
</script>

<span class="anim-num">{display}{suffix}</span>

<style>
  .anim-num {
    display: inline-block;
    font-variant-numeric: tabular-nums;
  }
</style>
