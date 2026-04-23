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
export type SyncType = 'upload' | 'adopt' | 'download';

export interface TreasureGroup {
  id: string;
  name: string;
  description?: string;
  withoutSync?: boolean;
}

export interface TreasureRecord {
  id: string;
  resource: string;
  name?: string;
  username: string;
  password: string;
  group?: string;
  source?: string;
  reference?: string;
  isFavorite?: boolean;
  withoutSync?: boolean;
  mtime?: Date;
}

export interface TreasureSyncStartEvent {
  event: 'sync:start';
  payload: {
    path: string;
    type: SyncType;
  };
}

export interface TreasureSyncUpdateEvent {
  event: 'sync:update';
  payload: {
    path: string;
    type: SyncType;
    value: number;
  };
}

export interface TreasureSyncEndEvent {
  event: 'sync:end';
  payload: {
    path: string;
    type: SyncType;
    error?: string;
  };
}

export interface TreasureAddEvent {
  event: 'add:record';
  payload: {
    data: string[];
  };
}

export interface TreasureRemoveEvent {
  event: 'remove:record';
  payload: {
    data: string[];
  };
}

export interface TreasureUpdateEvent {
  event: 'update:record';
  payload: {
    data: string;
  };
}

export interface TreasureGroupUpdateEvent {
  event: 'update:group';
}

export interface TreasureRecordsUpdateEvent {
  event: 'update:records';
}



export type TreasureEvent =
  | TreasureSyncStartEvent
  | TreasureSyncUpdateEvent
  | TreasureSyncEndEvent
  | TreasureAddEvent
  | TreasureRemoveEvent
  | TreasureUpdateEvent
  | TreasureGroupUpdateEvent
  | TreasureRecordsUpdateEvent;
