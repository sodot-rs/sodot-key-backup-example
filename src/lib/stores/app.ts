import { SignatureAlgorithmName } from '$lib/types';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

/**
 * Whether the app should render for a mobile screen.
 */
export const isMobile: Writable<boolean> = writable(false);
/**
 * The currently selected signature algorithm.
 */
export const selectedSignatureAlgorithm: Writable<SignatureAlgorithmName> = writable(SignatureAlgorithmName.ECDSA);
