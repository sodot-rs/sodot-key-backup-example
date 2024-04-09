import type { SignatureAlgorithmName } from '$lib/types';
import TTLCache from '@isaacs/ttlcache';
import { EcdsaKeygenResult, Ed25519KeygenResult } from '@sodot/sodot-node-sdk-demo';

const MAX_ITEMS_IN_CACHE = 10_000;
const CACHE_ITEM_TTL = 1000 * 60 * 60; // This is a demo server, so we'll keep the server's share live for 1 hour.
const DEFAULT_CACHE_CONFIG = {
  max: MAX_ITEMS_IN_CACHE,
  ttl: CACHE_ITEM_TTL,
  updateAgeOnGet: true,
};

type ServerShareCacheKey = `UID:${string}-SIGALG:${SignatureAlgorithmName}`;
export const serverShareCache = new TTLCache<string, EcdsaKeygenResult | Ed25519KeygenResult>(DEFAULT_CACHE_CONFIG);

export function generateServerShareCacheKey(userId: string, sigAlgo: SignatureAlgorithmName): ServerShareCacheKey {
  return `UID:${userId}-SIGALG:${sigAlgo}`;
}
