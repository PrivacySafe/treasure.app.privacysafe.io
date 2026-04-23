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
import type { TreasureEvent } from '../../@types/index.ts';
import type { TreasureFileSrv } from '../srv.types.ts';
import { GROUPS_FILE_NAME } from '../../shared/constants.ts';
import { handleFileSyncedStatus } from './handle-diff-sys-statuses/handle-file-synced-status.ts';
import { handleFileBehindStatus } from './handle-diff-sys-statuses/handle-file-behind-status.ts';
import { handleFileUnsyncedStatus } from './handle-diff-sys-statuses/handle-file-unsynced-status.ts';
import { handleRecordConflictingStatus } from './handle-diff-sys-statuses/handle-record-conflicting-status.ts';
import { handleGroupsConflictingStatus } from './handle-diff-sys-statuses/handle-groups-conflicting-status.ts';
import { handleRootUnsyncedStatus } from './handle-diff-sys-statuses/handle-root-unsynced-status.ts';
import { handleRootBehindStatus } from './handle-diff-sys-statuses/handle-root-behind-status.ts';
import { handleRootConflictingStatus } from './handle-diff-sys-statuses/handle-root-conflicting-status.ts';

export async function checkItemSyncState({
  path,
  fs,
  fileSrv,
  emitEvent,
}: {
  path: string;
  fs: web3n.files.WritableFS;
  fileSrv: TreasureFileSrv;
  emitEvent: (event: TreasureEvent) => void;
}) {
  const syncStatus = await fs.v?.sync?.status(path);
  // console.log(`🔔 CHECK SYNC [${path}] => ${syncStatus ? JSON.stringify(syncStatus) : '👎'}`);

  if (syncStatus) {
    switch (syncStatus.state) {
      case 'synced': {
        return handleFileSyncedStatus({ fs, path, syncStatus, emitEvent });
      }

      case 'unsynced': {
        return handleFileUnsyncedStatus({ fs, path, emitEvent });
      }

      case 'behind': {
        return handleFileBehindStatus({ fs, path, syncStatus, emitEvent });
      }

      case 'conflicting': {
        if (path === GROUPS_FILE_NAME) {
          return handleGroupsConflictingStatus({ fs, fileSrv, syncStatus, emitEvent });
        }

        return handleRecordConflictingStatus({ fs, fileSrv, fileName: path, syncStatus, emitEvent });
      }

      // no default
    }
  }
}

export async function checkRootSyncState({
  fs,
  emitEvent,
}: {
  fs: web3n.files.WritableFS;
  emitEvent: (event: TreasureEvent) => void;
}) {
  try {
    const rootSyncStatus = await fs.v?.sync?.status('');
    // console.log(`🔔 CHECK SYNC [ROOT] => ${rootSyncStatus ? JSON.stringify(rootSyncStatus) : '👎'}`);
    if (rootSyncStatus) {
      switch (rootSyncStatus.state) {
        case 'unsynced': {
          return handleRootUnsyncedStatus({ fs, emitEvent });
        }

        case 'behind': {
          return handleRootBehindStatus({ fs, syncStatus: rootSyncStatus, emitEvent });
        }

        case 'conflicting': {
          return  handleRootConflictingStatus({ fs, emitEvent });
        }

        // no default
      }
    }
  } catch (err) {
    if (
      (err as web3n.files.FSSyncException).type === 'fs-sync' &&
      (err as web3n.files.FSSyncException).childNeverUploaded
    ) {
      setTimeout(async () => {
        await checkRootSyncState({ fs, emitEvent });
      }, 10000);
      return;
    }

    throw err;
  }
}

export async function checkSyncFsState({
  fs,
  fileSrv,
  emitEvent,
}: {
  fs: web3n.files.WritableFS;
  fileSrv: TreasureFileSrv;
  emitEvent: (event: TreasureEvent) => void;
}) {
  try {
    const folderList = await fs.listFolder('');
    for (const entity of folderList) {
      await checkItemSyncState({
        path: entity.name,
        fs,
        fileSrv,
        emitEvent,
      });
    }

    await checkRootSyncState({ fs, emitEvent });
    emitEvent({ event: 'update:records' });
  } catch (err) {
    w3n.log('error', '🔥 Error while initial checking sync state. ', err);
  }
}
