<script lang="ts">
  import { Stepper, getToastStore } from '@skeletonlabs/skeleton';
  import confetti from 'canvas-confetti';

  const toastStore = getToastStore();

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
  <div class="bg-surface-backdrop-token m-5 h-1/2 w-1/2 rounded-3xl p-5">
    <Stepper on:complete={celebrate} regionContent="flex flex-col ">
      <slot />
    </Stepper>
  </div>
</div>
