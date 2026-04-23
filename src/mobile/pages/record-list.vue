<!--
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
-->
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { storeToRefs } from 'pinia';
  import { Ui3nButton, Ui3nInput, Ui3nSelector } from '@v1nt1248/3nclient-lib';
  import { useRecordStore } from '@/common/stores/record.store';
  import { useSyncStore } from '@/common/stores/sync.store';
  import { useSort } from '@/common/composables/use-sort';
  import type { SyncType, TreasureRecord } from '@types';
  import RecordListItem from '@/mobile/components/record-list-item.vue';
  import { APP_ROUTES } from '@/common/constants';

  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  const { syncProcesses } = storeToRefs(useSyncStore());
  const recordStore = useRecordStore();
  const { sortedGroups, records, recordsByGroups } = storeToRefs(recordStore);
  const { updateRecordList, updateRecord } = recordStore;

  const { sortTreasuresTableData } = useSort();

  const sortedGroupsAll = computed(() => [
    { id: 'all', name: t('list.all') },
    { id: 'favorites', name: t('list.favorites') },
    ...sortedGroups.value,
  ]);

  const searchText = ref('');
  const selectedGroup = ref((route.query?.group as string) || '');

  const processedSearchText = computed(() => searchText.value.toLowerCase());

  const filteredRecords = computed(() => {
    return (!selectedGroup.value ? records.value : recordsByGroups.value[selectedGroup.value] || [])
      .filter(r => {
        const { resource, name = '', username } = r;
        const processedResource = resource.toLowerCase();
        const processedName = name.toLowerCase();
        const processedUsername = username.toLowerCase();

        return (
          processedResource.includes(processedSearchText.value) ||
          processedName.includes(processedSearchText.value) ||
          processedUsername.includes(processedSearchText.value)
        );
      })
      .sort((a, b) => sortTreasuresTableData(a, b, 'name', 'desc'));
  });

  function recordSyncProcess(id: string): { type: SyncType; value: number } | undefined {
    return syncProcesses.value[id];
  }

  async function selectGroup(groupId: string) {
    selectedGroup.value = groupId === 'all' ? '' : groupId;
    await router.push({ query: { group: selectedGroup.value } });
  }

  function openRecordEditor(record?: TreasureRecord) {
    router.push({
      name: APP_ROUTES.RECORD,
      params: { id: record?.id || 'new' },
      ...(!record?.id && { query: { groupId: selectedGroup.value } }),
    });
  }

  function openGroupEditor(groupId?: string) {
    router.push({ name: APP_ROUTES.GROUP, params: { id: groupId || '' } });
  }

  async function setFavorite(record: TreasureRecord) {
    const isFavorite = !record.isFavorite;
    const updatedRecord = {
      ...record,
      isFavorite,
    };
    updateRecordList(updatedRecord);
    await updateRecord(record.id, updatedRecord);
  }
</script>

<template>
  <section :class="$style.recordList">
    <div :class="$style.searchBlock">
      <ui3n-input
        v-model="searchText"
        :placeholder="t('list.search')"
        icon="round-search"
        clearable
        hide-bottom-space
      />
    </div>

    <div :class="$style.groupSelectorBlock">
      <div :class="$style.groupSelector">
        <ui3n-selector
          :model-value="selectedGroup || 'all'"
          :items="sortedGroupsAll"
          item-display="name"
          @update:model-value="selectGroup"
        />
      </div>

      <ui3n-button
        type="secondary"
        :class="$style.groupSelectorBtn"
        @click="
          () =>
            !selectedGroup || selectedGroup === 'favorites' ? openGroupEditor() : openGroupEditor(selectedGroup)
        "
      >
        {{ !selectedGroup || selectedGroup === 'favorites' ? t('list.createGroup') : t('list.editGroup') }}
      </ui3n-button>
    </div>

    <div :class="$style.list">
      <template v-if="filteredRecords.length">
        <record-list-item
          v-for="item in filteredRecords"
          :key="item.id"
          :item="item"
          :sync-process="recordSyncProcess(item.id)"
          @open="openRecordEditor"
          @set:favorite="setFavorite"
        />
      </template>

      <span
        v-else
        :class="$style.noData"
      >
        {{ t('list.noData') }}
      </span>
    </div>

    <div :class="$style.action">
      <ui3n-button
        block
        icon="round-plus"
        icon-position="left"
        icon-color="var(--color-icon-button-primary-default)"
        icon-size="16"
        @click="() => openRecordEditor()"
      >
        {{ t('list.create') }}
      </ui3n-button>
    </div>
  </section>
</template>

<style lang="scss" module>
  .recordList {
    --list-search-block-height: 64px;
    --list-group-selector-height: 48px;
    --list-action-block-height: 64px;

    position: relative;
    width: 100%;
    height: 100%;

    .searchBlock {
      display: flex;
      width: 100%;
      height: var(--list-search-block-height);
      padding: 0 var(--spacing-m);
      justify-content: stretch;
      align-items: center;
    }

    .groupSelectorBlock {
      display: flex;
      width: 100%;
      height: var(--list-group-selector-height);
      padding: 0 var(--spacing-m);
      justify-content: space-between;
      align-items: center;
      column-gap: var(--spacing-m);

      .groupSelector {
        flex-grow: 1;
      }

      .groupSelectorBtn {
        width: fit-content;
      }
    }

    .list {
      position: relative;
      width: 100%;
      height: calc(
        100% - var(--list-search-block-height) - var(--list-group-selector-height) - var(
            --list-action-block-height
          )
      );
      overflow-x: hidden;
      overflow-y: auto;

      .noData {
        display: block;
        padding: var(--spacing-l) var(--spacing-m) var(--spacing-m) var(--spacing-m);
        text-align: center;
        font-size: var(--font-16);
        font-weight: 500;
        color: var(--color-text-control-secondary-default);
      }
    }

    .action {
      display: flex;
      width: 100%;
      height: var(--list-action-block-height);
      padding: 0 var(--spacing-m);
      justify-content: stretch;
      align-items: center;
    }
  }
</style>
