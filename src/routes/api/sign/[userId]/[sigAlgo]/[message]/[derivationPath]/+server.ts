import { generateServerShareCacheKey, serverShareCache } from '$lib/server/storage';
import { createRoom, getMpcSigner } from '$lib/server/utils';
import { SignatureAlgorithmName } from '$lib/types';
import { EcdsaPublicKey, MessageHash } from '@sodot/sodot-node-sdk-demo';
import { error, json } from '@sveltejs/kit';
import EventEmitter from 'events';
import type { RequestHandler } from './$types';

const keygenEventEmitter = new EventEmitter();
keygenEventEmitter.on('start', callSign);

interface CallSignParams {
  sigAlgo: SignatureAlgorithmName;
  userId: string;
  roomId: string;
  message: string;
  derivationPath: unknown;
}

async function callSign({ sigAlgo, userId, roomId, message, derivationPath }: CallSignParams) {
  const mpcSigner = getMpcSigner(sigAlgo);
  // Get the server's secret share. We know that it'll be valid by now.
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  const serverShare = serverShareCache.get(serverShareCacheKey)!;
  let pubkey = await mpcSigner.derivePubkey(serverShare, derivationPath);
  let formattedMessage: string | MessageHash = message;
  if (sigAlgo === SignatureAlgorithmName.ECDSA) {
    pubkey = (pubkey as EcdsaPublicKey).serializeCompressed();
    formattedMessage = MessageHash.keccak256(formattedMessage);
  }
  // Using the same roomId as the client, we both try and sign together.
  const signature = await mpcSigner.sign(roomId, serverShare, formattedMessage, derivationPath);
  console.log(
    `Server sign result - PUB:${pubkey} ;; SIG:${sigAlgo === SignatureAlgorithmName.ECDSA ? signature.der : signature}`
  );
}

export const GET: RequestHandler = async ({ params }) => {
  const userId = params.userId;
  const sigAlgo = params.sigAlgo as SignatureAlgorithmName;
  const message = params.message;
  const derivationPath = JSON.parse(params.derivationPath);

  // Check if the server's share still exists in the cache for this particular UID.
  // This is done purely because the demo server drops entries after several minutes - during production use you'll probably want to keep those!
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  // Using `get` instead of `has` in order to utilize `updateAgeOnGet`.
  if (serverShareCache.get(serverShareCacheKey) === undefined) {
    return error(400, `secret share expired for key ${serverShareCacheKey}`);
  }

  // Generate a new room for the signing to take place in.
  const roomId = await createRoom(sigAlgo);

  const emitParams: CallSignParams = {
    sigAlgo,
    userId,
    roomId,
    message,
    derivationPath,
  };

  /**
   * We use an event emitter in order to send the roomId to the client while attempting to preform the same action ourselves (remember, we need T of N players).
   * This pattern allows us to run the {@link callSign} function while no longer taking care of the request.
   */
  keygenEventEmitter.emit('start', emitParams);

  // Return a 200 OK status with the roomId.
  return json({ roomId });
};
