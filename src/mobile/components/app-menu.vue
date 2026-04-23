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
<script lang="ts" setup>
  import { useI18n } from 'vue-i18n';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import ContactIcon from '@/common/components/ui/contact-icon.vue';

  defineProps<{
    user: string;
    appExit?: () => void;
  }>();

  const { t } = useI18n();
</script>

<template>
  <div :class="$style.appMenu">
    <div :class="$style.appMenuHeader">
      <contact-icon
        :size="32"
        :name="user"
        readonly
      />

      <div :class="$style.info">
        <div :class="$style.user">
          {{ user }}
        </div>
      </div>
    </div>

    <div :class="$style.appMenuBody">
      <ui3n-button
        :class="$style.logout"
        @click="() => appExit && appExit()"
      >
        {{ t('app.exit') }}
      </ui3n-button>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins' as mixins;

  .appMenu {
    --app-menu-header-heigh: 48px;

    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-block-primary-default);
    border-right: 1px solid var(--color-border-block-primary-default);
  }

  .appMenuHeader {
    display: flex;
    width: 100%;
    height: var(--app-menu-header-heigh);
    padding-left: var(--spacing-s);
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .info {
    position: relative;
    width: calc(100% - 44px);
    color: var(--color-text-control-primary-default);
  }

  .user {
    font-size: var(--font-14);
    font-weight: 700;
    line-height: var(--font-16);
    @include mixins.text-overflow-ellipsis();
  }

  .status {
    font-size: var(--font-12);
    font-weight: 600;
    line-height: var(--font-14);
  }

  .appMenuBody {
    position: relative;
    width: 100%;
    height: calc(100% - var(--app-menu-header-heigh));
    overflow: hidden;
    padding: var(--spacing-m) 0 64px;
  }

  .logout {
    position: absolute;
    left: var(--spacing-m);
    width: calc(100% - var(--spacing-l));
    bottom: var(--spacing-m);
  }
</style>
