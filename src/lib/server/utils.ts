import { N } from '$lib/config';
import { SignatureAlgorithmName } from '$lib/types';
import type { EcdsaKeygenResult, Ed25519KeygenResult } from '@sodot/sodot-node-sdk-demo';
import { Ecdsa, Ed25519 } from '@sodot/sodot-node-sdk-demo';
import 'dotenv/config';

export const API_KEY: string = process.env.API_KEY || '';

const mpcSigners = {
  [SignatureAlgorithmName.ECDSA]: new Ecdsa(),
  [SignatureAlgorithmName.ED25519]: new Ed25519(),
} as const;

export function getMpcSigner(signature: SignatureAlgorithmName) {
  return mpcSigners[signature];
}

export type ServerShare = EcdsaKeygenResult | Ed25519KeygenResult;

export async function createRoom(signature: SignatureAlgorithmName) {
  const mpcSigner = getMpcSigner(signature);
  return await mpcSigner.createRoom(N, API_KEY);
}
