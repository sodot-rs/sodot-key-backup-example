<script lang="ts">
  import { Ecdsa, EcdsaSignature, Ed25519, MessageHash } from '@sodot/sodot-web-sdk-demo';
  import { SignatureAlgorithmName } from '$lib/types';
  import { DERIVATION_PATH_ARRAY } from '$lib/config';
  import { userData } from '$lib/stores/cloud';
  import { CodeBlock } from '@skeletonlabs/skeleton';
  import { hexlify } from 'ethers';

  const mpcSigners = {
    [SignatureAlgorithmName.ECDSA]: new Ecdsa(),
    [SignatureAlgorithmName.ED25519]: new Ed25519(),
  } as const;

  let message: string = '';

  let messageSignature = '';

  async function signMessage() {
    if (!$userData) {
      throw new Error('Cannot sign messages without a prepared key');
    }
    const mpcSigner = mpcSigners[$userData?.sigAlgo];
    // We pick a derivation path - this uses standard non-hardened key derivation.
    // Using key derivation paths we can have as many public keys as we want generated from just a single keygen session.
    const derivationPath = new Uint32Array(DERIVATION_PATH_ARRAY);

    // You can verify the signature over at https://etherscan.io/verifiedSignatures
    const formattedMessage =
      $userData?.sigAlgo === SignatureAlgorithmName.ECDSA
        ? `\x19Ethereum Signed Message:\n${message.length}${message}`
        : message;

    // Ask the server to sign the key - again, getting the roomId in the response.
    const response = await fetch(
      `/api/sign/${$userData.userId}/${$userData.sigAlgo}/${formattedMessage}/${JSON.stringify(DERIVATION_PATH_ARRAY)}`
    );
    const responseData = await response.json();

    let messageToSign: string | MessageHash = message;
    if ($userData.sigAlgo === SignatureAlgorithmName.ECDSA) {
      // For ecdsa, signing requires a hashed message, while ed25519 requires the raw message
      messageToSign = MessageHash.keccak256(formattedMessage);
    }

    // Now we sign the message together!
    let signature = await mpcSigner.sign(responseData.roomId, $userData.keygenResult, messageToSign, derivationPath);
    if ($userData.sigAlgo === SignatureAlgorithmName.ECDSA) {
      const ecdsaSig = signature as EcdsaSignature; // Purely to convince TS that this is indeed an EcdsaSignature object.
      messageSignature = hexlify(ecdsaSig.r).slice(2) + hexlify(ecdsaSig.s).slice(2) + ecdsaSig.v.toString(16);
    } else {
      messageSignature = (signature as Uint8Array).toString();
    }
  }
</script>

<div class="keygen">
  <textarea class="textarea" rows="3" placeholder="What would you like to sign?" bind:value={message} />
  <div class="flex justify-between">
    <button type="button" class="variant-filled btn m-3" on:click={signMessage}>
      <span>📝</span>
      <span>Sign!</span>
    </button>
    <a
      href="https://etherscan.io/verifiedSignatures"
      target="_blank"
      title="Verify on Etherscan"
      class="anchor text-sm"
    >
      Verify this signature on Etherscan!
    </a>
  </div>
  {#if messageSignature}
    <div class="m-3">
      <CodeBlock language="plaintext" code={`0x${messageSignature}`}></CodeBlock>
    </div>
  {/if}
</div>

<style>
</style>
