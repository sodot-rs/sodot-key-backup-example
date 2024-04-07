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

  $: if (noExistingBackup === false) {
    modalStore.trigger(modal);
  }

  $: if ($isSignedIn) {
    getBackupFile().then((value) => {
      noExistingBackup = value === null ? true : false;
    });
  }

  const modal: ModalSettings = {
    type: 'confirm',
    title: 'Override Backup?',
    body: 'We found an existing backup key in your account!\nProceeding will override your existing key. Are you sure you want to do that?',
    buttonTextCancel: 'No, I want to import a wallet',
    buttonTextConfirm: 'Yes, override the key',
    response: async (r: boolean) => {
      if (r) {
        noExistingBackup = true;
      } else {
        await goto('/existing');
      }
    },
  };
</script>

<CustomStepper>
  <Step locked={!$isSignedIn || !noExistingBackup}>
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
