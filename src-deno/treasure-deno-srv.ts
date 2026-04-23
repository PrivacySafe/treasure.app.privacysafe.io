/*
 Copyright (C) 2026 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { MultiConnectionIPCWrap } from '../shared/ipc/ipc-service.js';
import { sleep } from '../shared/processes/sleep.ts';
import { ObserversSet } from '../shared/utils/observer-utils.ts';
import { round } from '../shared/utils/round.ts';
import { GROUPS_FILE_NAME } from '../shared/constants.ts';
import { setupGlobalReportingOfUnhandledErrors } from './utils/error-handling.ts';
import { syncUpload } from './utils/sync-upload.ts';
import { checkServerConnection } from './utils/check-server-connection.ts';
import { treasureFileSrv } from './treasure-file-srv.ts';
import { treasureSyncSrv } from './treasure-sync-srv.ts';
import { handleRootFolderChangeSyncStatus } from './utils/handle-root-folder-change-sync-status.ts';
import { handleRecordFileChangeSyncStatus } from './utils/handle-record-file-change-sync-status.ts';
import { handleGroupsFileChangeSyncStatus } from './utils/handle-groups-file-change-sync-status.ts';
import { checkSyncFsState } from './utils/check-sync-fs-state.ts';
import type { TreasureEvent, TreasureGroup, TreasureRecord } from '../@types/common.types.ts';
import type { TreasureDenoSrv, TreasureDenoSrvInternal } from './srv.types.ts';

async function treasureDenoSrv(): Promise<TreasureDenoSrv> {
  setupGlobalReportingOfUnhandledErrors(true);

  const fs = await w3n.storage!.getAppSyncedFS();
  const fileSrv = await treasureFileSrv(fs);

  const eventsObservers = new ObserversSet<TreasureEvent>();

  function emitTreasureEvent(event: TreasureEvent) {
    eventsObservers.next(event);
  }

  function watchEvent(obs: web3n.Observer<TreasureEvent>): () => void {
    eventsObservers.add(obs);
    return () => eventsObservers.delete(obs);
  }

  await treasureSyncSrv({ fs, fileSrv, emitEvent: emitTreasureEvent });

  fs.watchTree('', 2, {
    next: async event => {
      const { type, path } = event;
      const processedPath = path.replace('./', '').replace('.', '');
      // console.log(`🔵 WATCH ROOT FOLDER [${processedPath || 'ROOT'}] => `, JSON.stringify(event));

      switch (type) {
        case 'upload-started': {
          emitTreasureEvent({
            event: 'sync:start',
            payload: {
              path: processedPath || 'root',
              type: 'upload',
            },
          });
          break;
        }

        case 'upload-progress': {
          const { bytesLeftToUpload, totalBytesToUpload } = event as web3n.files.UploadProgressEvent;
          const progress = round((totalBytesToUpload - bytesLeftToUpload) / totalBytesToUpload, -3);
          emitTreasureEvent({
            event: 'sync:update',
            payload: {
              path: processedPath || 'root',
              type: 'upload',
              value: progress,
            },
          });
          break;
        }

        case 'upload-done': {
          emitTreasureEvent({
            event: 'sync:end',
            payload: {
              path: processedPath || 'root',
              type: 'upload',
            },
          });

          if (!processedPath) {
            await syncUpload({ fs, path: '', emitEvent: emitTreasureEvent, immediately: true });
          }
          break;
        }

        case 'download-started': {
          emitTreasureEvent({
            event: 'sync:start',
            payload: {
              path: processedPath || 'root',
              type: 'download',
            },
          });
          break;
        }

        case 'download-progress': {
          const { bytesLeftToDownload, totalBytesToDownload } = event as web3n.files.DownloadProgressEvent;
          const progress = round((totalBytesToDownload - bytesLeftToDownload) / totalBytesToDownload, -3);
          emitTreasureEvent({
            event: 'sync:update',
            payload: {
              path: processedPath || 'root',
              type: 'download',
              value: progress,
            },
          });
          break;
        }

        case 'download-done': {
          emitTreasureEvent({
            event: 'sync:end',
            payload: {
              path: processedPath || 'root',
              type: 'download',
            },
          });
          break;
        }

        case 'remote-change': {
          if (!processedPath) {
            await handleRootFolderChangeSyncStatus(fs, emitTreasureEvent);
          } else if (processedPath === GROUPS_FILE_NAME) {
            await handleGroupsFileChangeSyncStatus(fs, fileSrv, emitTreasureEvent);
            emitTreasureEvent({
              event: 'update:group'
            });
          } else {
            await handleRecordFileChangeSyncStatus(processedPath, fs, fileSrv, emitTreasureEvent);
            emitTreasureEvent({
              event: 'update:record',
              payload: {
                data: processedPath,
              },
            });
          }
          break;
        }

        case 'remote-removal': {
          emitTreasureEvent({
            event: 'remove:record',
            payload: {
              data: [processedPath],
            },
          });
          break;
        }

        // no default
      }
    },
    error: err => w3n.log('error', 'Error watching the root folder. ', err),
  });

  async function rewriteGroups(data: TreasureGroup[], withoutSync?: boolean): Promise<boolean> {
    await fileSrv.saveFile(data, GROUPS_FILE_NAME);
    const isConnectionAvailable = await checkServerConnection(fs);

    if (!withoutSync && isConnectionAvailable) {
      await syncUpload({ fs, path: GROUPS_FILE_NAME, emitEvent: emitTreasureEvent });
      return true;
    }

    return false;
  }

  async function getAllTreasureGroups(): Promise<TreasureGroup[] | null | undefined> {
    try {
      return fileSrv.getFile<TreasureGroup[]>(GROUPS_FILE_NAME)
    } catch (err) {
      if ((err as web3n.files.FileException).notFound) {
        return [];
      }

      w3n.log('error', 'Error getting treasure groups', err);
    }
  }

  async function addRecord(
    data: TreasureRecord,
    withoutUploadParentFolder?: boolean,
  ): Promise<{ id: string; wasSync?: boolean }> {
    const id = await fileSrv.saveFile(data);
    const isConnectionAvailable = await checkServerConnection(fs);

    if (isConnectionAvailable) {
      await syncUpload({ fs, path: id, emitEvent: emitTreasureEvent });

      if (!withoutUploadParentFolder) {
        await syncUpload({ fs, path: '', emitEvent: emitTreasureEvent, immediately: true });
      }

      return { id, wasSync: true };
    }

    return { id, wasSync: false };
  }

  async function updateRecord(data: TreasureRecord): Promise<boolean> {
    await fileSrv.updateFile(data);

    const isConnectionAvailable = await checkServerConnection(fs);
    if (isConnectionAvailable) {
      await syncUpload({ fs, path: data.id, emitEvent: emitTreasureEvent });
      return true;
    }

    return false;
  }

  async function deleteRecord(data: TreasureRecord, withoutUploadParentFolder?: boolean): Promise<boolean> {
    const reference = data.reference;
    const source = data.source;
    await fileSrv.deleteFile(data.id);
    if (reference) {
      const record = await getRecord(reference);
      if (record) {
        record.source && delete record.source;
        await updateRecord(record);
      }
    }

    if (source) {
      const record = await getRecord(source);
      if (record) {
        record.reference && delete record.reference;
        await updateRecord(record);
      }
    }

    const isConnectionAvailable = await checkServerConnection(fs);
    if (isConnectionAvailable && !withoutUploadParentFolder) {
      await syncUpload({ fs, path: '', emitEvent: emitTreasureEvent, immediately: true });
      return true;
    }

    return false;
  }

  async function deleteRecords(ids: string[]): Promise<boolean> {
    await fileSrv.deleteFiles(ids);

    const isConnectionAvailable = await checkServerConnection(fs);
    if (isConnectionAvailable) {
      await syncUpload({ fs, path: '', emitEvent: emitTreasureEvent, immediately: true });
      return true;
    }

    return false;
  }

  async function getRecord(id: string): Promise<TreasureRecord | null> {
    const record = await fileSrv.getFile<TreasureRecord>(id);
    if (!record) {
      return null;
    }

    const fileStat = await fs.stat(id);
    return {
      ...record,
      mtime: fileStat.mtime,
    };
  }

  async function getRecordSyncStatus(id: string): Promise<web3n.files.SyncStatus | undefined> {
    const isRecordFilePresent = await fs.checkFilePresence(id);
    if (!isRecordFilePresent) {
      console.info(`[!!!!!] There is no file with name ${id}.`);
      return undefined;
    }

    return fs.v?.sync?.status(id);
  }

  async function getAllRecords(): Promise<{ records: TreasureRecord[]; errors: unknown[] }> {
    const list = await fs.listFolder('');
    const workResultsPromises: Promise<TreasureRecord | null>[] = [];
    for (const item of list) {
      if (item.isFile && item.name !== GROUPS_FILE_NAME) {
        workResultsPromises.push(getRecord(item.name));
      }
    }

    const res = await Promise.allSettled(workResultsPromises);
    return res.reduce(
      (res, item) => {
        if (item.status === 'fulfilled') {
          item.value && (res.records.push(item.value));
        } else {
          res.errors.push(item.reason);
        }

        return res;
      },
      { records: [] as TreasureRecord[], errors: [] as unknown[] },
    );
  }

  async function initial() {
    const doesGroupsFileExist = await fs.checkFilePresence(GROUPS_FILE_NAME);
    if (!doesGroupsFileExist) {
      await rewriteGroups([]);
    }

    const isThereConnection = await checkServerConnection(fs);
    if (!isThereConnection) {
      setTimeout(() => {
        initial();
        return;
      }, 60000);
    }

    try {
      await checkSyncFsState({ fs, fileSrv, emitEvent: emitTreasureEvent });
    } catch (err) {
      w3n.log('error', '🔥 Error while initial synchronization process. ', err);
    }
  }

  return {
    fs,
    emitTreasureEvent,
    watchEvent,

    rewriteGroups,
    getAllTreasureGroups,

    addRecord,
    updateRecord,
    deleteRecord,
    deleteRecords,
    getRecord,
    getRecordSyncStatus,
    getAllRecords,

    initial,
  };
}

treasureDenoSrv()
  .then(srv => {
    const srvWrapInternal = new MultiConnectionIPCWrap('AppTreasureInternal');

    srvWrapInternal.exposeReqReplyMethods<TreasureDenoSrvInternal>(srv, [
      'rewriteGroups',
      'getAllTreasureGroups',
      'addRecord',
      'updateRecord',
      'deleteRecord',
      'deleteRecords',
      'getRecord',
      'getRecordSyncStatus',
      'getAllRecords',
      'initial',
    ]);
    srvWrapInternal.exposeObservableMethods<Pick<TreasureDenoSrv, 'watchEvent'>>(srv, ['watchEvent']);

    srvWrapInternal.startIPC();
  })
  .catch(async err => {
    await w3n.log('error', '🔥 Error in a startup of treasure deno service component. ', err);
    await sleep(10);
    w3n.closeSelf();
  });
