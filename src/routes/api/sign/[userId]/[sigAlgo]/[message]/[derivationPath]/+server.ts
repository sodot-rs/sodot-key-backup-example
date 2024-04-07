import { generateServerShareCacheKey, serverShareCache } from '$lib/server/storage';
import { createRoom, getMpcSigner } from '$lib/server/utils';
import { SignatureAlgorithmName } from '$lib/types';
import { EcdsaPublicKey, MessageHash } from '@sodot/sodot-node-sdk-demo';
import { json } from '@sveltejs/kit';
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
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  const serverShare = serverShareCache.get(serverShareCacheKey)!;
  let pubkey = await mpcSigner.derivePubkey(serverShare, derivationPath);
  let formattedMessage: string | MessageHash = message;
  if (sigAlgo === SignatureAlgorithmName.ECDSA) {
    pubkey = (pubkey as EcdsaPublicKey).serializeCompressed();
    formattedMessage = MessageHash.keccak256(formattedMessage);
  }
  const signature = await mpcSigner.sign(roomId, serverShare, formattedMessage, derivationPath);
  console.log(
    `Server sign result - PUB:${pubkey} ;; SIG:${sigAlgo === SignatureAlgorithmName.ECDSA ? signature.der : signature}`
  );
}

export const GET: RequestHandler = async ({ params }) => {
  // Parse the parameters
  const userId = params.userId;
  const sigAlgo = params.sigAlgo as SignatureAlgorithmName;
  const message = params.message;
  const derivationPath = JSON.parse(params.derivationPath);

  const roomId = await createRoom(sigAlgo);

  const emitParams: CallSignParams = {
    sigAlgo,
    userId,
    roomId,
    message,
    derivationPath,
  };
  keygenEventEmitter.emit('start', emitParams);

  // Return a 200 OK status with the roomUuid
  return json({ roomId });
};
