<script lang="ts">
  import { onMount } from 'svelte';
  import logo from '$lib/assets/google-g-icon.svg';
  import { isSignedIn } from '$lib/stores/cloud';

  /**
   * Used to add Google Drive to the `gapi` client.
   */
  const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  /**
   * The scope requested by the app - in this case, we simply want the `appdata` scope in order to save the backup.
   */
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  /**
   * The app's Client ID, used to initialize an OAuth token.
   */
  const CLIENT_ID = '553390358390-ueket1htfn2n673r4jj7ih712al5f865.apps.googleusercontent.com';

  let tokenClient: google.accounts.oauth2.TokenClient;

  let gapiLoaded = (val: unknown) => {};
  let gsiLoaded = (val: unknown) => {};

  // These two promises will resolve when the `gapi` and `gsi` scripts will finish loading respectively.
  const gapiLoadPromise = new Promise((resolve, reject) => {
    gapiLoaded = resolve;
  });
  const gsiLoadPromise = new Promise((resolve, reject) => {
    gsiLoaded = resolve;
  });

  /**
   * Initialize the `gapi` object loaded through the `gapi` script.
   */
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

  /**
   * Initialize a new {@link tokenClient} using the `google` object loaded by the `gsi` script.
   */
  async function initGsi() {
    // If `google` is not defined, it means the script didn't finish loading.
    if (!window.google) {
      await gsiLoadPromise;
    }
    await new Promise((resolve, reject) => {
      try {
        // We use the "implicit grant flow" in order to generate a token without storing any confidential information or redirecting to another server.
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          prompt: 'consent',
          callback: () => {
            $isSignedIn = true;
          },
        });
        resolve(tokenClient);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * "Sign in" to Google - basically request a token in order for us to perform our requests.
   */
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
  <!-- Load Google's API scripts, make sure to notify when they're fully loaded. -->
  <script defer async src="https://apis.google.com/js/api.js" on:load={gapiLoaded}></script>
  <script defer async src="https://accounts.google.com/gsi/client" on:load={gsiLoaded}></script>
</svelte:head>

<div>
  <div class="relative m-3 inline-block">
    {#if $isSignedIn}
      <span class="badge-icon absolute -right-0 -top-0 z-10 text-lg">✅</span>
    {/if}
    <button type="button" class="variant-filled btn-icon btn-icon-xl m-1" on:click={signIn}>
      <img alt="Sign-in with Google" src={logo} />
    </button>
  </div>
  <div>
    <span class="text-xl"><strong>Backup method:</strong> {$isSignedIn ? 'Google Drive' : 'None'}</span>
  </div>
</div>

<style>
</style>
