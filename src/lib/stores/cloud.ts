import { SignatureAlgorithmName } from '$lib/types';
import { EcdsaPublicKey, type EcdsaKeygenResult, type Ed25519KeygenResult } from '@sodot/sodot-web-sdk-demo';
import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';

/**
 * A marker for invalid data, to be returned when we don't want to throw an Error.
 */
type InvalidData = { invalid: true };

/**
 * The data that might be backed up by the client.
 */
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
 * @returns `null` if there was no backup file, a special "invalid" value for invalid data, or a parsed JSON of the backup data.
 */
export async function getBackupFile(): Promise<BackupData | InvalidData | null> {
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
  // In case we saved an empty file there by accident we can simply ignore it.
  if (fileRawData.length === 0) {
    return null;
  }
  const backupData = deserializeBackupData(fileRawData);

  // Check against our API if the server still stores the relevant secret share.
  const existsResult = await fetch(`/api/check-exists/${backupData?.userId}/${backupData?.sigAlgo}`);
  if (!existsResult.ok) {
    return { invalid: true };
  }

  return backupData;
}

/**
 * A typeguard that checks if the data is invalid or not.
 * Should only be used in conjunction with {@link getBackupFile}.
 * NOTE: the only reason data could be invalid is if the TTL cache this specific demo server is using has cleared its share.
 * @param backupData data to test for validity.
 */
export function isBackupDataInvalid(backupData: BackupData | InvalidData): backupData is InvalidData {
  // @ts-expect-error if `invalid` exists and is set to true, then this data is invalid.
  return backupData.invalid === true;
}

/**
 * Serialize data for backup as a string using `JSON.stringify`.
 * We need to normalize all the arrays in order for `JSON.stringify` to parse them correctly.
 * Meant to be used together with {@link deserializeBackupData}.
 * @param backupData data to serialize for storage.
 * @returns a string representing the backup data.
 */
function serializeBackupData(backupData: BackupData): string {
  const backupClone = { ...backupData, keygenResult: { ...backupData.keygenResult } };
  if (backupClone.sigAlgo === SignatureAlgorithmName.ECDSA) {
    // @ts-expect-error we want `derivedPubkey` to hold a `Uint8Array`.
    backupClone.derivedPubkey = backupClone.derivedPubkey.serializeUncompressed();
    // @ts-expect-error we want `pubkey` to hold a `Uint8Array`.
    backupClone.keygenResult.pubkey = backupClone.keygenResult.pubkey.serializeUncompressed();
  }
  // @ts-expect-error we want `derivedPubkey` to hold a regular array so it will be serializable by `JSON.stringify`.
  backupClone.derivedPubkey = Array.from(backupClone.derivedPubkey);
  // @ts-expect-error we want `pubkey` to hold a regular array so it will be serializable by `JSON.stringify`.
  backupClone.keygenResult.pubkey = Array.from(backupClone.keygenResult.pubkey);
  return JSON.stringify(backupClone);
}

/**
 * Deserialize data generated by {@link serializeBackupData}.
 * @param rawBackupData a serialized data string.
 * @returns the parsed data, with he correct types.
 */
function deserializeBackupData(rawBackupData: string): BackupData {
  const backupData = JSON.parse(rawBackupData) as BackupData;
  // @ts-expect-error we know that it will be a regular array.
  backupData.derivedPubkey = new Uint8Array(backupData.derivedPubkey);
  // @ts-expect-error we know that it will be a regular array.
  backupData.keygenResult.pubkey = new Uint8Array(backupData.keygenResult.pubkey);
  if (backupData.sigAlgo === SignatureAlgorithmName.ECDSA) {
    // @ts-expect-error we know that it will be a Uint8Array.
    backupData.derivedPubkey = new EcdsaPublicKey(backupData.derivedPubkey);
    // @ts-expect-error we know that it will be a Uint8Array.
    backupData.keygenResult.pubkey = new EcdsaPublicKey(backupData.keygenResult.pubkey);
  }
  return backupData;
}
