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
import type { TreasureEvent } from '../../@types/common.types.ts';
import type { TreasureFileSrv } from '../srv.types.ts';
import { handleFileSyncedStatus } from './handle-diff-sys-statuses/handle-file-synced-status.ts';
import { handleFileUnsyncedStatus } from './handle-diff-sys-statuses/handle-file-unsynced-status.ts';
import { handleFileBehindStatus } from './handle-diff-sys-statuses/handle-file-behind-status.ts';
import { handleRecordConflictingStatus } from './handle-diff-sys-statuses/handle-record-conflicting-status.ts';

export async function handleRecordFileChangeSyncStatus(
  currentFileName: string,
  fs: web3n.files.WritableFS,
  fileSrv: TreasureFileSrv,
  emitEvent: (event: TreasureEvent) => void,
) {
  try {
    const recordFileSyncStatus = await fs.v?.sync?.status(currentFileName);
    // console.log(
    //   '🔔 HANDLE_RECORD_FILE_CHANGE_SYNC_STATUS => ',
    //   recordFileSyncStatus ? JSON.stringify(recordFileSyncStatus) : '👎',
    // );

    if (!recordFileSyncStatus) {
      return undefined;
    }

    switch (recordFileSyncStatus.state) {
      case 'synced': {
        return handleFileSyncedStatus({
          fs,
          path: currentFileName,
          syncStatus: recordFileSyncStatus,
          emitEvent,
        });
      }

      case 'unsynced': {
        return handleFileUnsyncedStatus({
          fs,
          path: currentFileName,
          emitEvent,
        });
      }

      case 'behind': {
        return handleFileBehindStatus({
          fs,
          path: currentFileName,
          syncStatus: recordFileSyncStatus,
          emitEvent,
        });
      }

      case 'conflicting': {
        return handleRecordConflictingStatus({
          fs,
          fileSrv,
          fileName: currentFileName,
          syncStatus: recordFileSyncStatus,
          emitEvent,
        });
      }

      // no default
    }
  } catch (err) {
    console.error('🔥 Error handling the record file sync status. ', err);
    throw err;
  }
}
