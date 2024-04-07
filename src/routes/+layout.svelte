<script>
  import { AppBar, AppShell, LightSwitch, Modal, Toast } from '@skeletonlabs/skeleton';
  import logoLight from '$lib/assets/sodot_color_logo_light.svg';
  import logoDark from '$lib/assets/sodot_color_logo_dark.svg';
  import '../app.pcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import SidebarLeft from './SidebarLeft.svelte';

  initializeStores();
</script>

<Toast />
<Modal />
<AppShell>
  <svelte:fragment slot="header">
    <AppBar>
      <svelte:fragment slot="lead">
        <img alt="Sodot logo" src={logoLight} class="block size-1/6 dark:hidden" />
        <img alt="Sodot logo" src={logoDark} class="hidden size-1/6 dark:block" />
      </svelte:fragment>
      <svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <SidebarLeft />
  </svelte:fragment>
  <slot />
</AppShell>
