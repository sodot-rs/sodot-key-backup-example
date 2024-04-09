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
      } else if (isBackupDataInvalid(value)) {
        backupExists = false;
        modalStore.trigger(invalidBackupModal);
      } else {
        backupExists = true;
        modalStore.trigger(overrideModal);
      }
    });
  }

  const overrideModal: ModalSettings = {
    type: 'confirm',
    title: 'Override Backup?',
    body:
      'We found an existing backup key in your account!\n' +
      'Proceeding will override your existing key. Are you sure you want to do that?',
    buttonTextCancel: 'No, I want to import a wallet',
    buttonTextConfirm: 'Yes, override the key',
    response: async (confirmed: boolean) => {
      if (confirmed) {
        backupExists = false;
      } else {
        await goto('/existing');
      }
    },
  };

  const invalidBackupModal: ModalSettings = {
    type: 'alert',
    title: 'Invalid Backup Detected',
    body:
      'The backup connected to your account is invalid!\n' +
      "This demo server doesn't keep secret shares for long by design, but we will regenerate a new one for you!",
    buttonTextCancel: 'Thanks',
  };
</script>

<CustomStepper>
  <Step locked={!$isSignedIn || backupExists !== false}>
    <svelte:fragment slot="header">Backup Your Key</svelte:fragment>
    <p class="text-l">Please secure your wallet by choosing where to backup your key.</p>
    <GDrive />
  </Step>
  <Step locked={!$userData}>
    <svelte:fragment slot="header">Wallet Created Successfully!</svelte:fragment>
    <Keygen />
    {#if $userData}
      <Signer />
    {/if}
  </Step>
</CustomStepper>
