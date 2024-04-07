<script lang="ts">
  import { onMount } from 'svelte';
  import logo from '$lib/assets/google_g_icon.svg';
  import { isSignedIn } from '$lib/stores/cloud';

  const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  const CLIENT_ID = '553390358390-ueket1htfn2n673r4jj7ih712al5f865.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

  let tokenClient: google.accounts.oauth2.TokenClient;

  let gapiLoaded = (val: unknown) => {};
  let gsiLoaded = (val: unknown) => {};

  const gapiLoadPromise = new Promise((resolve, reject) => {
    gapiLoaded = resolve;
  });
  const gsiLoadPromise = new Promise((resolve, reject) => {
    gsiLoaded = resolve;
  });

  async function initGapi() {
    // If `gapi` is not defined, it means the script didn't finish loading.
    if (!window.gapi) {
      await gapiLoadPromise;
    }
    await new Promise((resolve, reject) => {
      gapi.load('client', { callback: resolve, onerror: reject });
    });
    await gapi.client.init({});
    await gapi.client.load(DRIVE_DISCOVERY_DOC);
  }

  async function initGsi() {
    // If `google` is not defined, it means the script didn't finish loading.
    if (!window.google) {
      await gsiLoadPromise;
    }
    await new Promise((resolve, reject) => {
      try {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          prompt: 'consent',
          callback: () => {
            $isSignedIn = true;
          }, // defined at request time in await/promise scope.
        });
        resolve(tokenClient);
      } catch (err) {
        reject(err);
      }
    });
  }

  async function signIn() {
    if (!$isSignedIn) {
      tokenClient.requestAccessToken();
    }
  }

  onMount(async () => {
    await initGapi();
    await initGsi();
  });
</script>

<svelte:head>
  <script defer async src="https://apis.google.com/js/api.js" on:load={gapiLoaded}></script>
  <script defer async src="https://accounts.google.com/gsi/client" on:load={gsiLoaded}></script>
</svelte:head>

<div class="flex flex-col">
  <button type="button" class="variant-filled btn-icon btn-icon-xl m-3" on:click={signIn}>
    <img alt="Sign-in with Google" src={logo} />
  </button>
  <div>
    <span class="text-xl"><strong>Backed up?</strong> {$isSignedIn ? '✅' : '❌'}</span>
  </div>
</div>

<style>
</style>
