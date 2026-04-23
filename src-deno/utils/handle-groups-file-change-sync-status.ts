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
import { GROUPS_FILE_NAME } from '../../shared/constants.ts';
import type { TreasureFileSrv } from '../srv.types.ts';
import { type TreasureEvent } from '../../@types';
import { handleFileSyncedStatus } from './handle-diff-sys-statuses/handle-file-synced-status.ts';
import { handleFileUnsyncedStatus } from './handle-diff-sys-statuses/handle-file-unsynced-status.ts';
import { handleFileBehindStatus } from './handle-diff-sys-statuses/handle-file-behind-status.ts';
import { handleGroupsConflictingStatus } from './handle-diff-sys-statuses/handle-groups-conflicting-status.ts';

export async function handleGroupsFileChangeSyncStatus(
  fs: web3n.files.WritableFS,
  fileSrv: TreasureFileSrv,
  emitEvent: (event: TreasureEvent) => void,
) {
  try {
    const groupsFileSyncStatus = await fs.v?.sync?.status(GROUPS_FILE_NAME);
    // console.log(
    //   '🔔 HANDLE_GROUPS_FILE_CHANGE_SYNC_STATUS => ',
    //   groupsFileSyncStatus ? JSON.stringify(groupsFileSyncStatus) : '👎',
    // );

    if (!groupsFileSyncStatus) {
      return undefined;
    }

    switch (groupsFileSyncStatus.state) {
      case 'synced': {
        return handleFileSyncedStatus({
          fs,
          path: GROUPS_FILE_NAME,
          syncStatus: groupsFileSyncStatus,
          emitEvent,
        });
      }

      case 'unsynced': {
        return handleFileUnsyncedStatus({
          fs,
          path: GROUPS_FILE_NAME,
          emitEvent,
        });
      }

      case 'behind': {
        return handleFileBehindStatus({
          fs,
          path: GROUPS_FILE_NAME,
          syncStatus: groupsFileSyncStatus,
          emitEvent,
        });
      }

      case 'conflicting': {
        return handleGroupsConflictingStatus({
          fs,
          fileSrv,
          syncStatus: groupsFileSyncStatus,
          emitEvent,
        });
      }

      // no default
    }
  } catch (err) {
    console.error('🔥 Error handling the groups file sync status. ', err);
    throw err;
  }
}
