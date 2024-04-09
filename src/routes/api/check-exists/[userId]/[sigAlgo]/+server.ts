import { generateServerShareCacheKey, serverShareCache } from '$lib/server/storage';
import { SignatureAlgorithmName } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const userId = params.userId;
  const sigAlgo = params.sigAlgo as SignatureAlgorithmName;

  // Check if the server's share still exists in the cache for this particular UID.
  // This is done purely because the demo server drops entries after several minutes - during production use you'll probably want to keep those!
  const serverShareCacheKey = generateServerShareCacheKey(userId, sigAlgo);
  // Using `get` instead of `has` in order to utilize `updateAgeOnGet`.
  if (serverShareCache.get(serverShareCacheKey) === undefined) {
    return error(400, `secret share expired for key ${serverShareCacheKey}`);
  }

  // Return a 200 OK status.
  return new Response();
};
