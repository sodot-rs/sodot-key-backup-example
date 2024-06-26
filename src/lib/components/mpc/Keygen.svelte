<script lang="ts">
  import { onMount } from 'svelte';
  import { Ecdsa, EcdsaPublicKey, Ed25519 } from '@sodot/sodot-web-sdk-demo';
  import { SignatureAlgorithmName } from '$lib/types';
  import { N, T, DERIVATION_PATH_ARRAY } from '$lib/config';
  import { userData } from '$lib/stores/cloud';
  import type { BackupData } from '$lib/stores/cloud';
  import { Avatar, ProgressBar, clipboard } from '@skeletonlabs/skeleton';
  import { computeAddress, hexlify } from 'ethers';
  import { selectedSignatureAlgorithm } from '$lib/stores/app';

  const userId = crypto.randomUUID();
  const mpcSigners = {
    [SignatureAlgorithmName.ECDSA]: new Ecdsa(),
    [SignatureAlgorithmName.ED25519]: new Ed25519(),
  } as const;

  $: mpcSigner = mpcSigners[$selectedSignatureAlgorithm];

  $: publicKey =
    $userData?.derivedPubkey &&
    hexlify(
      $userData?.sigAlgo === SignatureAlgorithmName.ECDSA
        ? $userData?.derivedPubkey?.serializeCompressed()
        : $userData?.derivedPubkey
    );

  $: evmAddress =
    $userData?.sigAlgo === SignatureAlgorithmName.ECDSA
      ? computeAddress(hexlify(($userData.derivedPubkey as EcdsaPublicKey).serializeCompressed()))
      : null;

  async function initMPCKeygen() {
    // Create the local initial key, used to create a secure communication channel.
    const initKeygenResult = await mpcSigner.initKeygen();
    // Initialize key generation with the server - get the roomId.
    const response = await fetch(`/api/keygen/${userId}/${$selectedSignatureAlgorithm}/${initKeygenResult.keygenId}`);
    const responseData = await response.json();
    // Sign together!
    const result = await mpcSigner.keygen(responseData.roomId, N, T, initKeygenResult, [responseData.keygenId]);
    const derivationPath = new Uint32Array(DERIVATION_PATH_ARRAY);
    const derivedPubkey = await mpcSigner.derivePubkey(result, derivationPath);
    $userData = {
      keygenResult: result,
      userId,
      sigAlgo: $selectedSignatureAlgorithm,
      derivedPubkey,
    } as BackupData;
  }

  $: displayedValues = [
    {
      title: 'Signature Scheme',
      value: $selectedSignatureAlgorithm,
      badge: '📝',
    },
    {
      title: 'Public Key',
      value: publicKey,
      badge: '🔑',
    },
    {
      title: 'EVM Address',
      value: evmAddress,
      badge: '🏦',
    },
  ];

  onMount(async () => {
    if (!$userData) {
      await initMPCKeygen();
    }
  });
</script>

<div class="flex flex-col">
  <div>
    {#if !$userData}
      <p>Creating your key...</p>
      <ProgressBar />
    {:else}
      <dl class="list-dl">
        {#each displayedValues as { title, value, badge }, i}
          {#if value !== null}
            <div>
              <Avatar initials={badge} fontSize={250} width="w-1/12" />
              <span class="w-5/6 flex-auto">
                <dt><strong>{title}</strong></dt>
                <dd class="text-sm">
                  <div class="card justify-between text-wrap">
                    <span class="truncate" data-clipboard="keygen-info-{i}">{value}</span>
                    <button
                      type="button"
                      class="variant-filled btn btn-sm rounded-2xl"
                      use:clipboard={{ element: `keygen-info-${i}` }}>Copy</button
                    >
                  </div>
                </dd>
              </span>
            </div>
          {/if}
        {/each}
      </dl>
    {/if}
  </div>
</div>

<style>
</style>
