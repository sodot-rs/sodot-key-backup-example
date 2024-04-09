<script lang="ts">
  import { isMobile } from '$lib/stores/app';
  import { Stepper, getToastStore } from '@skeletonlabs/skeleton';
  import confetti from 'canvas-confetti';

  const toastStore = getToastStore();

  $: width = $isMobile ? 'w-5/6' : 'w-1/2';
  $: height = $isMobile ? 'h-3/4' : 'h-3/5';

  function celebrate() {
    confetti({
      particleCount: 400,
      spread: 360,
      origin: {
        y: 0.4,
      },
    });
    toastStore.trigger({
      message: "That's it for this demo, check out our official docs for more info!",
      action: {
        label: 'To the Docs',
        response: () => window.open('https://docs.sodot.dev/docs/intro', '_blank')?.focus(),
      },
    });
  }
</script>

<div class="flex h-screen justify-center">
  <div class="variant-ghost-surface m-5 rounded-3xl p-5 {height} {width}">
    <Stepper on:complete={celebrate} regionContent="flex flex-col ">
      <slot />
    </Stepper>
  </div>
</div>
