import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

export const isMobile: Writable<boolean> = writable(false);
