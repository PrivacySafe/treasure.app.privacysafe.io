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
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';
import keyBy from 'lodash/keyBy';
import { appTreasureDenoSrv } from '@/common/services/service-provider';
import { useAppStore } from '@/common/stores/app.store';
import type { TreasureGroup, TreasureRecord } from '@types';

export const useRecordStore = defineStore('records', () => {
  const { setCommonLoading } = useAppStore();

  const records = ref<TreasureRecord[]>([]);
  const groups = ref<Record<string, TreasureGroup>>({});

  const allGroupsNames = computed(() => Object.values(groups.value).map(gr => gr.name));

  const sortedGroups = computed(() =>
    Object.values(groups.value).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
  );

  const favoritesRecords = computed(() => records.value.filter(r => r.isFavorite));

  const recordsByGroups = computed(() =>
    records.value.reduce(
      (res, r) => {
        const { group } = r;
        if (!group) {
          return res;
        }

        if (!res[group]) {
          res[group] = [];
        }
        res[group].push(r);

        return res;
      },
      { favorites: favoritesRecords.value } as Record<string, TreasureRecord[]>,
    ),
  );

  async function upsertGroup(group: TreasureGroup) {
    const updatedGroupsData = cloneDeep(groups.value);
    updatedGroupsData[group.id] = group;
    const wasSync = await appTreasureDenoSrv.rewriteGroups(Object.values(updatedGroupsData));
    groups.value[group.id] = {
      ...group,
      withoutSync: !wasSync,
    };
  }

  async function deleteGroup(groupId: string): Promise<boolean> {
    if (size(recordsByGroups.value[groupId])) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete groups.value[groupId];
    await appTreasureDenoSrv.rewriteGroups(Object.values(groups.value));
    return true;
  }

  function getGroup(groupId: string): TreasureGroup | undefined {
    return groups.value[groupId];
  }

  async function getAllGroups() {
    const res = await appTreasureDenoSrv.getAllTreasureGroups();
    groups.value = res ? keyBy(res, 'id') : {};
  }

  function updateRecordList(record: TreasureRecord, removing?: boolean) {
    const index = records.value.findIndex(r => r.id === record.id);
    if (index >= 0) {
      removing && (records.value.splice(index, 1));
      !removing && (records.value[index] = record);
    } else {
      !removing && (records.value.push(record));
    }
  }

  async function getRecordSyncStatus(id: string): Promise<web3n.files.SyncStatus | undefined> {
    return appTreasureDenoSrv.getRecordSyncStatus(id);
  }

  async function addRecord(data: TreasureRecord): Promise<void> {
    if (data.id !== 'new') {
      throw new Error(
        `It's not possible to add a record with ID other then 'new'. The current record has ID '${data.id}'.`,
      );
    }

    const actionResult = await appTreasureDenoSrv.addRecord(data);
    if (actionResult) {
      records.value.push({
        ...data,
        id: actionResult.id,
        withoutSync: !actionResult.wasSync,
      });
    }
  }

  async function removeRecord(id: string): Promise<void> {
    const index = records.value.findIndex(r => r.id === id);
    let record: TreasureRecord | null = null;
    if (index >= 0) {
      record = records.value.splice(index, 1)[0];
    }
    record && await appTreasureDenoSrv.deleteRecord(record);
  }

  async function updateRecord(id: string, data: Partial<TreasureRecord>): Promise<void> {
    const index = records.value.findIndex(r => r.id === data.id);
    if (index === -1) {
      console.error(`There is no record with ID '${id}'`);
      return;
    }

    const record = cloneDeep(records.value[index]);
    const updatedRecord = {
      ...record,
      ...data,
    };

    const wasSync = await appTreasureDenoSrv.updateRecord(updatedRecord);
    records.value[index] = {
      ...updatedRecord,
      withoutSync: !wasSync,
    };
  }

  async function getAllRecords() {
    const res = await appTreasureDenoSrv.getAllRecords();
    records.value = res.records;
  }

  async function getRecord(recordId: string) {
    const record = await appTreasureDenoSrv.getRecord(recordId);
    if (record) {
      updateRecordList(record);
    }
  }

  async function getRecords(recordIds: string[]) {
    try {
      setCommonLoading(true);
      for (const recordId of recordIds) {
        await getRecord(recordId);
      }
    } finally {
      setCommonLoading(false);
    }
  }

  return {
    groups,
    sortedGroups,
    allGroupsNames,

    records,
    favoritesRecords,
    recordsByGroups,

    upsertGroup,
    deleteGroup,
    getGroup,
    getAllGroups,

    getRecordSyncStatus,
    updateRecordList,
    getRecord,
    getRecords,
    addRecord,
    removeRecord,
    updateRecord,
    getAllRecords,
  };
});
