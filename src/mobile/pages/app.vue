<!--
 Copyright (C) 2025 3NSoft Inc.

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
  import { ref, computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    Ui3nButton,
    Ui3nDialogProvider,
    Ui3nProgressCircular,
    Ui3nProgressLinear,
    Ui3nMobileMenu,
    Ui3nMobileMenuItem,
  } from '@v1nt1248/3nclient-lib';
  import { useAppPage } from '@/common/composables/use-app-page';

  import ContactIcon from '@/common/components/ui/contact-icon.vue';
  import { DEFAULT_GROUP } from '@shared/constants';
  import { storeToRefs } from 'pinia';
  import { useRecordStore } from '@/common/stores/record.store';
  import type { TreasureGroup } from '@shared/@types';

  const recordStore = useRecordStore();
  const { sortedGroups, numOfRecentRecords } = storeToRefs(recordStore);
  const { t } = useI18n();

  const { appVersion, commonLoading, user, connectivityStatus, isSyncRunning, exitApp } = useAppPage();

  const isMenuOpen = ref(false);

  const sortedGroupsAll = computed(() => [
    { id: 'all', name: t('list.all') },
    { id: DEFAULT_GROUP.RECENT, name: t('list.recent') },
    { id: DEFAULT_GROUP.CARDS, name: t('list.cards') },
    { id: DEFAULT_GROUP.FAVORITES, name: t('list.favorites') },
    ...sortedGroups.value,
  ]);

  const selectedMenu = ref<TreasureGroup>(sortedGroupsAll.value[0]);

  async function selectMenuItem(item: TreasureGroup) {
    selectedMenu.value = item;
    isMenuOpen.value = false;
  }

  function checkSelectedMenu(selected: TreasureGroup) {
    if (!selectedMenu.value) {
      selectedMenu.value = sortedGroupsAll.value[0];
    }
    return selectedMenu.value && selected.id === selectedMenu.value.id;
  }

  const setInitialGroupToRecent = computed(() => numOfRecentRecords.value > 0);

  const stopWatchingGroups = watch(setInitialGroupToRecent, doSetRecent => {
    doSetRecent
      ? (selectedMenu.value = sortedGroupsAll.value[1])
      : (selectedMenu.value = sortedGroupsAll.value[0]);
    stopWatchingGroups();
  });
</script>

<template>
  <section :class="$style.app">
    <div :class="[$style.body, isMenuOpen && $style.bodyDisabled]">
      <div :class="$style.item">
        <span :class="$style.itemName">
          {{ t('app.title') }}
        </span>

        <span :class="$style.version">
          {{ appVersion }}
        </span>
      </div>
      <div :class="$style.mobileMenu">
        <ui3n-mobile-menu
          v-model="isMenuOpen"
          width="80%"
          with-blur
        >
          <template #header>
            <div :class="$style.userData">
              <contact-icon
                :size="36"
                :name="String(user)"
                readonly
              />
              <div :class="$style.info">
                <div :class="$style.user">
                  {{ user }}
                </div>

                <div :class="$style.status">
                  {{ t('app.status.label') }}:
                  <span :class="connectivityStatus === 'online' && $style.ok">
                    {{ connectivityStatus }}
                  </span>
                </div>
              </div>
            </div>
          </template>
          <template #menuBody>
            <div :class="$style.menu">
              <div
                v-for="item in sortedGroupsAll"
                :key="item!.id"
              >
                <ui3n-mobile-menu-item
                  :item="item!"
                  :class="$style.menuItems"
                  :is-active="checkSelectedMenu(item!)"
                  @select-item="selectMenuItem(item!)"
                />
              </div>
            </div>
          </template>
          <template #footer>
            <ui3n-button
              :class="$style.logout"
              square
              @click="exitApp()"
            >
              {{ t('app.exit') }}
            </ui3n-button>
          </template>
        </ui3n-mobile-menu>
      </div>
      <div
        v-if="isSyncRunning"
        :class="$style.processing"
      >
        <ui3n-progress-linear indeterminate />
      </div>
      <div :class="$style.content">
        <router-view v-slot="{ Component }">
          <transition>
            <component
              :is="Component"
              :select-group-item="selectedMenu"
            />
          </transition>
        </router-view>

        <div
          v-if="commonLoading"
          :class="$style.loader"
        >
          <ui3n-progress-circular
            indeterminate
            size="100"
            width="4"
          />
        </div>
      </div>
    </div>
    <ui3n-dialog-provider />
  </section>
</template>

<style lang="scss" module>
  .app {
    --app-toolbar-height: 48px;

    position: fixed;
    inset: 0;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
    overflow: hidden;
  }

  .menu {
    padding: var(--spacing-s);
  }

  .mobileMenu {
    position: absolute;
    top: 0;
  }

  .body {
    position: relative;
    min-width: 100%;
    width: 100%;
    height: calc(100% - var(--spacing-s));

    &.bodyDisabled {
      background-color: var(--files-darker);

      .toolbar {
        border-bottom: none !important;
        background-color: var(--files-darker);
      }

      .content {
        pointer-events: none;

        &::after {
          position: absolute;
          content: '';
          inset: 0;
          z-index: 5;
          background-color: var(--files-darker);
        }
      }
    }

    .content {
      position: relative;
      width: 100%;
      height: calc(100% - var(--app-toolbar-height) - 1px);
    }
  }

  .menuItems {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    margin-bottom: var(--spacing-xs);
  }

  .item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
    margin: var(--spacing-s) var(--spacing-s);
    padding-top: var(--spacing-xs);
    padding-bottom: var(--spacing-s);
    border-bottom: 1px solid var(--color-border-block-primary-default);

    .itemName {
      font-size: var(--font-16);
      font-weight: 700;
      color: var(--color-text-block-primary-default);
    }

    .version {
      font-size: var(--font-11);
      line-height: var(--font-12);
      color: var(--color-text-block-secondary-default);
    }
  }

  .userData {
    display: flex;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    padding: var(--spacing-s);
    column-gap: var(--spacing-m);
  }

  .info {
    align-items: center;
    color: var(--color-text-control-primary-default);

    .user {
      font-size: var(--font-14);
      font-weight: 700;
    }

    .status {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      column-gap: var(--spacing-s);
      font-size: var(--font-11);
      font-weight: 500;
      text-transform: capitalize;

      b {
        position: relative;
        width: 12px;
        min-width: 12px;
        height: 12px;
        min-height: 12px;
        border-radius: 50%;
        background-color: var(--warning-content-default);
      }

      .ok {
        color: var(--success-content-default);
      }
    }
  }

  .processing {
    position: absolute;
    left: 0;
    width: 100%;
    bottom: 0;
  }

  .loader {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logout {
    position: absolute;
    left: var(--spacing-m);
    width: calc(100% - var(--spacing-l));
    bottom: var(--spacing-m);
  }
</style>

<style lang="scss">
  .slide-fade-enter-active {
    transition: all 0.2s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
  }
</style>
