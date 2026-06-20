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
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { storeToRefs } from 'pinia';
  import { Ui3nButton, Ui3nInput } from '@v1nt1248/3nclient-lib';
  import { DEFAULT_GROUP } from '@shared/constants';
  import type { SyncType, TreasureRecord, TreasureGroup } from '@shared/@types';
  import { useRecordStore } from '@/common/stores/record.store';
  import { useSyncStore } from '@/common/stores/sync.store';
  import { useSort } from '@/common/composables/use-sort';
  import { APP_ROUTES } from '@/common/constants';
  import { prepareRecordList } from '@/common/utils';
  import RecordListItem from '@/mobile/components/record-list-item.vue';
  import ImagesSlider from '@/desktop/components/images-slider.vue';

  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  const { syncProcesses } = storeToRefs(useSyncStore());
  const recordStore = useRecordStore();
  const { records, recordsByGroups } = storeToRefs(recordStore);
  const { updateRecordList, updateRecord } = recordStore;

  const { sortTreasuresTableData } = useSort();

  const searchText = ref('');
  const selectedGroup = ref((route.query?.group as string) || '');
  const activeItemId = ref<string | null>(null);
  const optionsOfShowingImages = ref<string[] | null>(null);

  const processedSearchText = computed(() => searchText.value.toLowerCase());

  const filteredRecords = computed(() => {
    if (!selectedGroup.value) {
      return prepareRecordList(records.value, processedSearchText.value, sortTreasuresTableData);
    }

    return prepareRecordList(
      recordsByGroups.value[selectedGroup.value],
      processedSearchText.value,
      sortTreasuresTableData,
    );
  });

  function setActiveItem(itemId: string) {
    activeItemId.value = activeItemId.value === itemId ? null : itemId;
  }

  function recordSyncProcess(id: string): { type: SyncType; value: number } | undefined {
    return syncProcesses.value[id];
  }

  async function selectGroup(groupId: string) {
    selectedGroup.value = groupId === 'all' ? '' : groupId;
    await router.push({ query: { group: selectedGroup.value } });
  }

  function openRecordEditor(record?: TreasureRecord) {
    const query = {
      ...((!record?.id || record.id === 'new') && { groupId: selectedGroup.value }),
      ...(selectedGroup.value === DEFAULT_GROUP.CARDS && { cardGroup: 'on' }),
      ...(selectedGroup.value === DEFAULT_GROUP.BANK_CARDS && { bankCardGroup: 'on' }),
      ...(selectedGroup.value === DEFAULT_GROUP.FAVORITES && { favoriteGroup: 'on' }),
      ...(selectedGroup.value === DEFAULT_GROUP.RECENT && { recentGroup: 'on' }),
    };
    router.push({
      name: APP_ROUTES.RECORD,
      params: { id: record?.id || 'new' },
      query,
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

  const props = defineProps<{
    selectGroupItem: TreasureGroup;
  }>();

  watch(
    () => props.selectGroupItem,
    selectedGroupOrCategory => {
      selectGroup(selectedGroupOrCategory.id);
    },
    { immediate: true },
  );
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
      <div :class="$style.groupName">
        {{ selectGroupItem?.name ?? t('list.all') }}
      </div>

      <ui3n-button
        type="secondary"
        :class="$style.groupSelectorBtn"
        @click="
          () =>
            !selectedGroup || selectedGroup === DEFAULT_GROUP.FAVORITES
              ? openGroupEditor()
              : openGroupEditor(selectedGroup)
        "
      >
        {{
          !selectedGroup || selectedGroup === DEFAULT_GROUP.FAVORITES ? t('list.createGroup') : t('list.editGroup')
        }}
      </ui3n-button>
    </div>

    <div :class="$style.list">
      <template v-if="filteredRecords.length">
        <record-list-item
          v-for="item in filteredRecords"
          :key="item.id"
          :item="item"
          :sync-process="recordSyncProcess(item.id)"
          :selected-group="selectedGroup"
          :is-active="item.id === activeItemId"
          @toggle:active="setActiveItem(item.id)"
          @open="openRecordEditor"
          @set:favorite="setFavorite"
          @show:images="(v: string[]) => (optionsOfShowingImages = v)"
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

    <teleport
      v-if="optionsOfShowingImages"
      to="#mobile"
    >
      <images-slider
        :image-ids="optionsOfShowingImages"
        mobile-mode
        @close="() => (optionsOfShowingImages = null)"
      />
    </teleport>
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

      .groupName {
        color: var(--color-text-table-primary-default);
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
      padding-top: var(--spacing-xs);

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
