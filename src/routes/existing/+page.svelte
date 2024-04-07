<script lang="ts">
  import CustomStepper from '$lib/components/ui/CustomStepper.svelte';
  import GDrive from '$lib/components/backup/GDrive.svelte';
  import Keygen from '$lib/components/mpc/Keygen.svelte';
  import Signer from '$lib/components/mpc/Signer.svelte';
  import { getBackupFile, isSignedIn, userData } from '$lib/stores/cloud';
  import { Step, getModalStore } from '@skeletonlabs/skeleton';
  import type { ModalSettings } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';

  const modalStore = getModalStore();
  let noExistingBackup: boolean | null = null;

  $: if (noExistingBackup === true) {
    modalStore.trigger(modal);
  }

  $: if ($isSignedIn) {
    getBackupFile().then((value) => {
      if (value === null) {
        noExistingBackup = true;
      } else {
        noExistingBackup = false;
        $userData = value;
      }
    });
  }

  const modal: ModalSettings = {
    type: 'confirm',
    title: "Couldn't find your key",
    body: "We couldn't find an existing key in your chosen backup service.\nWould you like to create a new wallet?",
    buttonTextCancel: 'Try a different backup method',
    buttonTextConfirm: 'Create a new wallet',
    response: async (r: boolean) => {
      if (r) {
        await goto('/new');
      } else {
        noExistingBackup = null;
      }
    },
  };
</script>

<CustomStepper>
  <Step locked={!$isSignedIn || !!noExistingBackup}>
    <svelte:fragment slot="header">Recover Your Key</svelte:fragment>
    <p class="text-l">Please choose your backup method in order to recover your key.</p>
    <GDrive />
  </Step>
  <Step locked={!$userData}>
    <svelte:fragment slot="header">Wallet Recovered Successfully!</svelte:fragment>
    <Keygen />
    {#if $userData}
      <Signer />
    {/if}
  </Step>
</CustomStepper>
