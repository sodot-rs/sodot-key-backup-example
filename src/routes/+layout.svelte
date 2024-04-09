<script>
  import '../app.pcss';
  import { AppBar, AppShell, LightSwitch, Modal, Toast } from '@skeletonlabs/skeleton';
  import logoLight from '$lib/assets/sodot-color-logo-light.svg';
  import logoDark from '$lib/assets/sodot-color-logo-dark.svg';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import SidebarLeft from '$lib/components/ui/Sidebar.svelte';
  import NavigationTabs from '$lib/components/ui/NavigationTabs.svelte';
  import { isMobile } from '$lib/stores/ui';
  import { onMount } from 'svelte';

  initializeStores();

  $: logoSize = $isMobile ? 'size-1/3' : 'size-1/6';

  onMount(() => {
    const mediaQuery = window.matchMedia('(max-width: 800px)');
    $isMobile = mediaQuery.matches;
    const handleResize = () => {
      $isMobile = mediaQuery.matches;
    };
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  });
</script>

<Toast />
<Modal />
<AppShell>
  <svelte:fragment slot="header">
    <AppBar>
      <svelte:fragment slot="lead">
        <a href="https://sodot.dev" target="_blank">
          <img alt="Sodot logo" src={logoLight} class="block {logoSize} dark:hidden" />
          <img alt="Sodot logo" src={logoDark} class="hidden {logoSize} dark:block" />
        </a>
      </svelte:fragment>
      <svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <svelte:fragment slot="footer">
    {#if $isMobile}
      <NavigationTabs />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    {#if !$isMobile}
      <SidebarLeft />
    {/if}
  </svelte:fragment>
  <slot />
</AppShell>
