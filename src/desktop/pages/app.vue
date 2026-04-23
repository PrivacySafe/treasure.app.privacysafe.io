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
  import { useI18n } from 'vue-i18n';
  import {
    Ui3nButton,
    Ui3nDialogProvider,
    Ui3nIcon,
    Ui3nMenu,
    Ui3nProgressCircular,
    Ui3nProgressLinear,
    Ui3nResize,
    Ui3nRipple,
  } from '@v1nt1248/3nclient-lib';
  import { useAppPage } from '@/common/composables/use-app-page';
  import prLogo from '@/assets/images/privacysafe-logo.svg';
  import ContactIcon from '@/common/components/ui/contact-icon.vue';

  const vUi3nResize = Ui3nResize;
  const vUi3nRipple = Ui3nRipple;

  const { t } = useI18n();
  const {
    appVersion,
    commonLoading,
    customLogoSrc,
    user,
    connectivityStatus,
    isSyncRunning,
    onResize,
    openDashboard,
    exitApp,
  } = useAppPage();
</script>

<template>
  <section
    v-ui3n-resize="onResize"
    :class="$style.app"
  >
    <div :class="$style.toolbar">
      <div :class="$style.appInfo">
        <img
          :src="customLogoSrc ? customLogoSrc : prLogo"
          alt="logo"
          :class="$style.appLogo"
          @click.stop.prevent="openDashboard"
        >

        <span :class="$style.delimiter">/</span>

        <div :class="$style.info">
          {{ t('app.title') }}
          <span :class="$style.version">v {{ appVersion }}</span>
        </div>
      </div>

      <div :class="$style.toolbarRightBlock">
        <div :class="$style.userInfo">
          <span :class="$style.mail">
            {{ user }}
          </span>
          <span :class="$style.connection">
            {{ t('app.status.label') }}:

            <span :class="connectivityStatus === 'online' && $style.connectivity">
              {{ connectivityStatus === 'online' ? t('app.status.online') : t('app.status.offline') }}
            </span>
          </span>
        </div>

        <div
          v-ui3n-ripple
          :class="$style.userIcon"
        >
          <contact-icon
            :name="user || ''"
            :size="36"
            :readonly="true"
          />
        </div>

        <ui3n-menu
          position-strategy="fixed"
          :offset-y="4"
        >
          <ui3n-button
            type="icon"
            color="var(--color-bg-block-primary-default)"
            icon="round-more-vert"
            icon-size="24"
            icon-color="var(--color-icon-control-secondary-default)"
            :class="$style.toolbarBtn"
          />

          <template #menu>
            <div :class="$style.menu">
              <div
                :class="$style.menuItem"
                @click="exitApp"
              >
                <ui3n-icon icon="round-logout" />
                {{ t('app.exit') }}
              </div>
            </div>
          </template>
        </ui3n-menu>
      </div>

      <div
        v-if="isSyncRunning"
        :class="$style.processing"
      >
        <ui3n-progress-linear indeterminate />
      </div>
    </div>

    <div :class="$style.content">
      <router-view v-slot="{ Component }">
        <transition>
          <component :is="Component" />
        </transition>
      </router-view>

      <div
        v-if="commonLoading"
        :class="$style.loader"
      >
        <ui3n-progress-circular
          indeterminate
          size="100"
        />
      </div>
    </div>

    <ui3n-dialog-provider />
  </section>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins' as mixins;

  .app {
    --app-toolbar-height: 72px;

    position: fixed;
    inset: 0;
  }

  .toolbar {
    position: relative;
    width: 100%;
    height: var(--app-toolbar-height);
    padding: 0 var(--spacing-m);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-block-primary-default);

    .appInfo {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      column-gap: var(--spacing-m);

      .appLogo {
        position: relative;
        cursor: pointer;
        height: var(--spacing-m);
      }

      .info {
        position: relative;
        width: max-content;
        font-size: var(--font-16);
        font-weight: 500;
        line-height: 28px;
        color: var(--color-text-control-primary-default);
        display: flex;
        justify-content: flex-start;
        align-items: center;
        column-gap: var(--spacing-s);
      }

      .version {
        color: var(--color-text-control-secondary-default);
        line-height: 28px;
      }
    }

    .toolbarRightBlock {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      column-gap: var(--spacing-s);

      button {
        min-width: 36px !important;
        width: 36px !important;
        height: 36px;
      }

      .userInfo {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;

        .mail {
          font-size: var(--font-14);
          font-weight: 600;
        }

        .connection {
          font-size: var(--font-12);
          font-weight: 500;
        }

        span:not(.connectivity) {
          color: var(--color-text-control-primary-default);
          line-height: 1.4;
        }

        .connectivity {
          color: var(--success-content-default);
        }
      }

      .userIcon {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        border-radius: 50%;
      }

      .toolbarBtn {
        &:hover {
          div {
            color: var(--color-text-control-accent-default);
          }
        }
      }

      .menu {
        position: relative;
        padding: 2px 0;
        background-color: var(--color-bg-control-secondary-default);
        width: max-content;
        border-radius: var(--spacing-xs);
        @include mixins.elevation(1);

        .menuItem {
          position: relative;
          width: 100px;
          height: var(--spacing-l);
          padding: 0 var(--spacing-s);
          font-size: var(--font-14);
          font-weight: 500;
          color: var(--color-text-control-primary-default);
          display: flex;
          justify-content: flex-start;
          align-items: center;
          column-gap: var(--spacing-xs);
          cursor: pointer;

          &:hover {
            background-color: var(--color-bg-control-primary-hover);
            color: var(--color-text-control-accent-default);

            div {
              color: var(--color-text-control-accent-default);
            }
          }
        }
      }
    }

    .processing {
      position: absolute;
      left: 0;
      width: 100%;
      bottom: 0;
    }
  }

  .content {
    position: fixed;
    left: 0;
    right: 0;
    top: calc(var(--app-toolbar-height) + 1px);
    bottom: 0;
  }

  .delimiter {
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: var(--color-text-control-accent-default);
  }

  .loader {
    position: absolute;
    inset: 0;
    z-index: 10;
    background-color: var(--black-12);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }
</style>
