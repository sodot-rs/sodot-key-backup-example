<script lang="ts">
  import { AppRail, AppRailAnchor, AppRailTile } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';

  let currentTile: number = 0;
</script>

<AppRail background="bg-surface-backdrop-token opacity-85" width="w-24">
  <!-- <svelte:fragment slot="lead"> -->
  <!--   <AppRailAnchor href="/">(icon)</AppRailAnchor> -->
  <!-- </svelte:fragment> -->
  <!-- --- -->
  <AppRailAnchor
    href="/new"
    bind:group={currentTile}
    selected={$page.url.pathname === '/new'}
    name="new"
    value={0}
    title="New Wallet"
  >
    <svelte:fragment slot="lead">
      <span class="text-2xl"> 🆕 </span>
    </svelte:fragment>
    <span>Create new wallet</span>
  </AppRailAnchor>
  <AppRailAnchor
    href="/existing"
    bind:group={currentTile}
    selected={$page.url.pathname === '/existing'}
    name="existing"
    value={1}
    title="Existing Wallet"
  >
    <svelte:fragment slot="lead">
      <span class="text-2xl"> ⬇️ </span>
    </svelte:fragment>
    <span>Already have a wallet</span>
  </AppRailAnchor>
  <svelte:fragment slot="trail">
    <AppRailAnchor href="/" target="_blank" title="Account">TODO: GitHub</AppRailAnchor>
  </svelte:fragment>
</AppRail>
