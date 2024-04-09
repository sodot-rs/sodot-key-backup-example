<script lang="ts">
  import { page } from '$app/stores';
  import logoLight from '$lib/assets/github-mark-light.svg';
  import logoDark from '$lib/assets/github-mark-dark.svg';
  import { TabGroup, TabAnchor } from '@skeletonlabs/skeleton';

  const githubRepoLink = 'https://github.com/sodot-rs/sodot-key-backup-example';
</script>

<TabGroup
  justify="justify-center"
  active="variant-filled-primary"
  hover="hover:variant-soft-primary"
  flex="flex-1 lg:flex-none"
  class="bg-surface-300-600-token w-full opacity-85"
>
  <TabAnchor href="/new" selected={$page.url.pathname === '/new'}>
    <svelte:fragment slot="lead">
      <span class="text-2xl">🆕</span>
    </svelte:fragment>
    <span class="text-sm"><strong>Create new wallet</strong></span>
  </TabAnchor>
  <TabAnchor href="/existing" selected={$page.url.pathname === '/existing'}>
    <svelte:fragment slot="lead">
      <span class="text-2xl">⬇️</span>
    </svelte:fragment>
    <span class="text-sm"><strong>Already have a wallet</strong></span>
  </TabAnchor>
  <TabAnchor href={githubRepoLink} target="_blank">
    <span class="flex justify-center">
      <img alt="GitHub logo" src={logoLight} class="m-2 block size-1/2 dark:hidden" />
      <img alt="GitHub logo" src={logoDark} class="m-2 hidden size-1/2 dark:block" />
    </span>
  </TabAnchor>
</TabGroup>
