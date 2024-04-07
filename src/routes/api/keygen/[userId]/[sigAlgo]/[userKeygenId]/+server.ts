import { N, T } from '$lib/config';
import {
  generateKeygenInitResultCacheKey,
  generateServerShareCacheKey,
  keygenInitResultCache,
  serverShareCache,
} from '$lib/server/storage';
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
  const keygenResult = await mpcSigner.keygen(roomId, N, T, initKeygenResult, [clientKeygenId]);
  const pubkey =
    sigAlgo === SignatureAlgorithmName.ECDSA ? keygenResult.pubkey.serializeCompressed() : keygenResult.pubkey;
  console.log(`Server keygen result - PUB:${pubkey} ;; SECRET:${keygenResult.secretShare}`);
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  serverShareCache.set(serverShareCacheKey, keygenResult);
}

export const GET: RequestHandler = async ({ params }) => {
  // Parse the parameters
  const userId = params.userId;
  const sigAlgo = params.sigAlgo as SignatureAlgorithmName;
  const clientKeygenId = params.userKeygenId;
  const mpcSigner = getMpcSigner(sigAlgo);

  const roomId = await createRoom(sigAlgo);
  const initKeygenResult = await mpcSigner.initKeygen();

  const initKeygenCacheKey = generateKeygenInitResultCacheKey(userId, sigAlgo, roomId);
  keygenInitResultCache.set(initKeygenCacheKey, initKeygenResult);

  const emitParams: CallKeygenParams = {
    sigAlgo,
    userId,
    roomId,
    clientKeygenId,
    initKeygenResult,
  };
  keygenEventEmitter.emit('start', emitParams);

  // Return a 200 OK status with the roomUuid and the server's keygenId
  return json({ roomId, keygenId: initKeygenResult.keygenId });
};
