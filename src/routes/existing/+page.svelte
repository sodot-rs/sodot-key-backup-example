<script lang="ts">
  import CustomStepper from '$lib/components/ui/CustomStepper.svelte';
  import GDrive from '$lib/components/backup/GDrive.svelte';
  import Keygen from '$lib/components/mpc/Keygen.svelte';
  import Signer from '$lib/components/mpc/Signer.svelte';
  import { getBackupFile, isBackupDataInvalid, isSignedIn, userData } from '$lib/stores/cloud';
  import { Step, getModalStore } from '@skeletonlabs/skeleton';
  import type { ModalSettings } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';

  const modalStore = getModalStore();
  let backupExists: boolean | null = null;

  $: if ($isSignedIn) {
    getBackupFile().then((value) => {
      if (value === null) {
        backupExists = false;
        modalStore.trigger(keyNotFoundModal);
      } else if (isBackupDataInvalid(value)) {
        backupExists = false;
        modalStore.trigger(invalidBackupModal);
      } else {
        backupExists = true;
        $userData = value;
      }
    });
  }

  const keyNotFoundModal: ModalSettings = {
    type: 'confirm',
    title: "Couldn't find your key",
    body:
      "We couldn't find an existing key in your chosen backup service.\n" + 'Would you like to create a new wallet?',
    buttonTextCancel: 'Try a different backup method',
    buttonTextConfirm: 'Create a new wallet',
    response: async (confirmed: boolean) => {
      if (confirmed) {
        await goto('/new');
      } else {
        backupExists = false;
      }
    },
  };

  const invalidBackupModal: ModalSettings = {
    type: 'confirm',
    title: 'Invalid Backup Detected',
    body:
      'The backup connected to your account is invalid!\n' +
      "This demo server doesn't keep secret shares for long by design, but we will regenerate a new one for you!",
    buttonTextCancel: 'Try a different backup method',
    buttonTextConfirm: 'Create a new wallet',
    response: async (confirmed: boolean) => {
      if (confirmed) {
        await goto('/new');
      } else {
        backupExists = false;
      }
    },
  };
</script>

<CustomStepper>
  <Step locked={!$isSignedIn || !backupExists}>
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
