<script lang="ts">
  import { AppRail, AppRailAnchor } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import logoLight from '$lib/assets/github-mark-light.svg';
  import logoDark from '$lib/assets/github-mark-dark.svg';
</script>

<AppRail background="bg-surface-backdrop-token opacity-85" width="w-3/5">
  <AppRailAnchor href="/new" selected={$page.url.pathname === '/new'} name="new" title="New Wallet">
    <svelte:fragment slot="lead">
      <span class="text-2xl"> 🆕 </span>
    </svelte:fragment>
    <span>Create new wallet</span>
  </AppRailAnchor>
  <AppRailAnchor href="/existing" selected={$page.url.pathname === '/existing'} name="existing" title="Existing Wallet">
    <svelte:fragment slot="lead">
      <span class="text-2xl"> ⬇️ </span>
    </svelte:fragment>
    <span>Already have a wallet</span>
  </AppRailAnchor>
  <svelte:fragment slot="trail">
    <AppRailAnchor href="https://github.com/sodot-rs/sodot-key-backup-example" target="_blank" title="View source">
      <img alt="GitHub logo" src={logoLight} class="block p-6 dark:hidden" />
      <img alt="GitHub logo" src={logoDark} class="hidden p-6 dark:block" />
    </AppRailAnchor>
  </svelte:fragment>
</AppRail>
