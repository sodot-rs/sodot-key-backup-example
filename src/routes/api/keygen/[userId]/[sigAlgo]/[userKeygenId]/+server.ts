import { N, T } from '$lib/config';
import { generateServerShareCacheKey, serverShareCache } from '$lib/server/storage';
import { createRoom, getMpcSigner } from '$lib/server/utils';
import { SignatureAlgorithmName } from '$lib/types';
import { EcdsaInitKeygenResult, Ed25519InitKeygenResult } from '@sodot/sodot-node-sdk-demo';
import { json } from '@sveltejs/kit';
import EventEmitter from 'events';
import type { RequestHandler } from './$types';

const keygenEventEmitter = new EventEmitter();
keygenEventEmitter.on('start', callKeygen);

interface CallKeygenParams {
  sigAlgo: SignatureAlgorithmName;
  userId: string;
  roomId: string;
  clientKeygenId: string;
  initKeygenResult: EcdsaInitKeygenResult | Ed25519InitKeygenResult;
}

async function callKeygen({ sigAlgo, userId, roomId, clientKeygenId, initKeygenResult }: CallKeygenParams) {
  const mpcSigner = getMpcSigner(sigAlgo);
  // Create a key together with the client!
  const keygenResult = await mpcSigner.keygen(roomId, N, T, initKeygenResult, [clientKeygenId]);
  const pubkey =
    sigAlgo === SignatureAlgorithmName.ECDSA ? keygenResult.pubkey.serializeCompressed() : keygenResult.pubkey;
  console.log(`Server keygen result - PUB:${pubkey} ;; SECRET:${keygenResult.secretShare}`);
  // Store the server's secret share in our cache, to act as a "storage".
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  serverShareCache.set(serverShareCacheKey, keygenResult);
}

export const GET: RequestHandler = async ({ params }) => {
  const userId = params.userId;
  const sigAlgo = params.sigAlgo as SignatureAlgorithmName;
  const clientKeygenId = params.userKeygenId;
  const mpcSigner = getMpcSigner(sigAlgo);

  // Generate a new room for the key generation to take place in.
  const roomId = await createRoom(sigAlgo);
  // Create the local initial key, used to create a secure communication channel.
  const initKeygenResult = await mpcSigner.initKeygen();

  const emitParams: CallKeygenParams = {
    sigAlgo,
    userId,
    roomId,
    clientKeygenId,
    initKeygenResult,
  };
  /**
   * We use an event emitter in order to send the roomId to the client while attempting to preform the same action ourselves (remember, we need T of N players).
   * This pattern allows us to run the {@link callKeygen} function while no longer taking care of the request.
   */
  keygenEventEmitter.emit('start', emitParams);

  // Return a 200 OK status with the roomId and the server's keygenId.
  return json({ roomId, keygenId: initKeygenResult.keygenId });
};
