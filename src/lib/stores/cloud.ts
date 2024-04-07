import { SignatureAlgorithmName } from '$lib/types';
import { EcdsaPublicKey, type EcdsaKeygenResult, type Ed25519KeygenResult } from '@sodot/sodot-web-sdk-demo';
import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';

export type BackupData = EcdsaBackupData | Ed25519BackupData;

interface EcdsaBackupData {
  userId: string;
  sigAlgo: SignatureAlgorithmName.ECDSA;
  keygenResult: EcdsaKeygenResult;
  derivedPubkey: EcdsaPublicKey;
}

interface Ed25519BackupData {
  userId: string;
  sigAlgo: SignatureAlgorithmName.ED25519;
  keygenResult: Ed25519KeygenResult;
  derivedPubkey: Uint8Array;
}

/**
 * The source-of-truth regarding the user's key data.
 * Using it inside a store means we can watch when the value changes and subscribe to that event.
 */
export const userData: Writable<BackupData | null> = writable(null);
/**
 * A global store that tells us whether we're signed into Google, meaning it's safe to call `gapi` functions.
 */
export const isSignedIn: Writable<boolean> = writable(false);

const BACKUP_DATA_FILENAME = 'secret_backup.json';

// Each time the user key changes, we want to backup it up using Google Drive.
userData.subscribe(createFileInDrive);

/**
 * Create a new key backup data in the client's `appDataFolder` on Google Drive.
 * @param backupData the new key data to backup.
 */
async function createFileInDrive(backupData: BackupData | null): Promise<void> {
  // If we're not signed in OR there isn't any data to backup, stop the operation.
  if (!backupData || !get(isSignedIn)) {
    // We don't want to throw here since the function will be called as soon as the subscription operation will begin.
    // In that case, there won't be any data, so we prefer to simply "fail quietly".
    return;
  }

  // Create a new file entry in the Google Drive `appDataFolder`.
  const createdFile = await gapi.client.drive.files.create({
    uploadType: 'media',
    resource: {
      name: BACKUP_DATA_FILENAME,
      mimeType: 'text/plain',
      parents: ['appDataFolder'],
    },
    fields: 'id',
  });

  const data = serializeBackupData(backupData);
  const file = new Blob([data], { type: 'text/plain' });
  const token = gapi.client.getToken().access_token;
  // Push the backup data inside the new file entry we created - essentially creating the file.
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${createdFile.result.id}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      'Content-Length': file.size.toString(),
    },
    body: data,
  });
}

/**
 * Get the most recent backed up key from Google Drive.
 * @returns `null` if there was no backup file, or a parsed JSON of the backup data.
 */
export async function getBackupFile(): Promise<BackupData | null> {
  // If we're not signed in, stop the operation.
  if (!get(isSignedIn)) {
    throw new Error('Tried backing up user data while not signed into Google');
  }
  // List all the files inside `appDataFolder` that match our backup name.
  const resp = await gapi.client.drive.files.list({
    orderBy: 'createdTime desc',
    q: `name='${BACKUP_DATA_FILENAME}'`,
    spaces: 'appDataFolder',
  });
  if (!resp.result.files || resp.result.files.length === 0) {
    return null;
  }
  // Since we've sorted by descending created time, the first result should be the most recent backed up key.
  const fileMetadata = resp.result.files[0];
  const token = gapi.client.getToken().access_token;
  // Fetch fhe file data.
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileMetadata.id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const fileRawData = await res.text();
  return deserializeBackupData(fileRawData);
}

function serializeBackupData(backupData: BackupData): string {
  const backupClone = { ...backupData, keygenResult: { ...backupData.keygenResult } };
  if (backupClone.sigAlgo === SignatureAlgorithmName.ECDSA) {
    backupClone.derivedPubkey = backupClone.derivedPubkey.serializeUncompressed();
    backupClone.keygenResult.pubkey = backupClone.keygenResult.pubkey.serializeUncompressed();
  }
  backupClone.derivedPubkey = Array.from(backupClone.derivedPubkey);
  backupClone.keygenResult.pubkey = Array.from(backupClone.keygenResult.pubkey);
  return JSON.stringify(backupClone);
}

function deserializeBackupData(rawBackupData: text): BackupData {
  const backupData = JSON.parse(rawBackupData) as BackupData;
  backupData.derivedPubkey = new Uint8Array(backupData.derivedPubkey);
  backupData.keygenResult.pubkey = new Uint8Array(backupData.keygenResult.pubkey);
  if (backupData.sigAlgo === SignatureAlgorithmName.ECDSA) {
    backupData.derivedPubkey = new EcdsaPublicKey(backupData.derivedPubkey);
    backupData.keygenResult.pubkey = new EcdsaPublicKey(backupData.keygenResult.pubkey);
  }
  return backupData;
}
