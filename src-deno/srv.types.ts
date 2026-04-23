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
import { TreasureEvent, type TreasureGroup, TreasureRecord } from '../@types/common.types.ts';

export interface TreasureDenoSrv {
  fs: web3n.files.WritableFS;
  emitTreasureEvent: (event: TreasureEvent) => void;
  watchEvent: (obs: web3n.Observer<TreasureEvent>) => () => void;

  rewriteGroups: (data: TreasureGroup[]) => Promise<boolean>;
  getAllTreasureGroups: () => Promise<TreasureGroup[] | null | undefined>;

  addRecord: (
    data: TreasureRecord,
    withoutUploadParentFolder?: boolean,
  ) => Promise<{ id: string; wasSync?: boolean }>;
  updateRecord: (data: TreasureRecord) => Promise<boolean>;
  deleteRecord: (data: TreasureRecord, withoutUploadParentFolder?: boolean) => Promise<boolean>;
  deleteRecords: (ids: string[]) => Promise<boolean>;
  getRecord: (id: string) => Promise<TreasureRecord | null>;
  getRecordSyncStatus: (id: string) => Promise<web3n.files.SyncStatus | undefined>;
  getAllRecords: () => Promise<{ records: TreasureRecord[]; errors: unknown[] }>;
  initial: () => Promise<void>;
}

export type TreasureDenoSrvInternal = Omit<TreasureDenoSrv, 'fs' | 'emitTreasureEvent'>;

export interface TreasureFileSrv {
  saveFile: (data: TreasureRecord | TreasureGroup[], fileName?: string) => Promise<string>;
  updateFile: (data: TreasureRecord | TreasureGroup[], fileName?: string) => Promise<void>;
  getFile: <T>(fileName: string) => Promise<(T extends TreasureRecord ? TreasureRecord : TreasureGroup[]) | null>;
  deleteFile: (fileName: string) => Promise<void>;
  deleteFiles: (currentRecordFileName: string[]) => Promise<void>;
}
