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
  import { computed, inject } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { DIALOGS_KEY, NOTIFICATIONS_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nInput, Ui3nProgressCircular, Ui3nSelector } from '@v1nt1248/3nclient-lib';
  import { APP_ROUTES } from '@/common/constants';
  import { useRecordStore } from '@/common/stores/record.store';
  import { useRecord } from '@/common/composables/use-record';
  import ConfirmationDialog from '@/common/components/dialogs/confirmation-dialog.vue';

  const route = useRoute();
  const router = useRouter();

  const { $openDialog } = inject(DIALOGS_KEY)!;
  const { $createNotice } = inject(NOTIFICATIONS_KEY)!;

  const recordStore = useRecordStore();
  const { records } = storeToRefs(recordStore);
  const { addRecord, updateRecord, removeRecord } = recordStore;

  const recordId = computed(() => (route.params?.id || 'new') as string);
  const groupId = computed(() => (route.query?.groupId || '') as string);

  const record = recordId.value === 'new' ? undefined : records.value.find(r => r.id === recordId.value);

  const {
    t,
    isLoading,
    sortedGroups,
    recordData,
    resourceRules,
    usernameRules,
    passwordRules,
    errorMessages,
    showPassword,
    isFormValid,
    isChanged,
    handleInput,
    updateValidation,
    generatePassword,
  } = useRecord({
    record,
    selectedGroup: groupId.value,
  });

  function backToList() {
    return router.push({
      name: APP_ROUTES.RECORD_LIST,
      query: { group: recordData.value.group },
    });
  }

  async function upsertRecord() {
    isLoading.value = true;
    try {
      if (recordId.value === 'new') {
        await addRecord(recordData.value);
      } else {
        await updateRecord(recordId.value, recordData.value);
      }

      $createNotice({
        type: 'success',
        content: t('list.notifications.success.saving', { entity: 'record' }),
      });

      await backToList();
    } catch (err) {
      console.error(`Error saving '${recordData.value!.name || recordData.value!.resource}' record. `, err);
      $createNotice({
        type: 'error',
        content: t('list.notifications.error.saving', {
          entity: 'record',
          name: recordData.value!.name || recordData.value!.resource,
        }),
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteRecord() {
    const confirmDialogRes = await $openDialog(ConfirmationDialog, {
      dialogText: t('confirmationDeleteRecordDialog.text'),
      dialogProps: {
        title: t('confirmationDeleteRecordDialog.title'),
        width: 300,
        confirmButtonText: t('confirmationDeleteRecordDialog.confirmButtonText'),
        cancelButtonText: t('confirmationDeleteRecordDialog.cancelButtonText'),
      },
    });

    const { event } = confirmDialogRes;
    if (event === 'confirm') {
      isLoading.value = true;

      try {
        await removeRecord(recordId.value);

        $createNotice({
          type: 'success',
          content: t('list.notifications.success.deleting', { entity: 'record' }),
        });

        await backToList();
      } catch (err) {
        console.error(`Error deleting '${recordData.value!.name || recordData.value!.resource}' record. `, err);
        $createNotice({
          type: 'error',
          content: t('list.notifications.error.deleting', {
            entity: 'record',
            name: recordData.value!.name || recordData.value!.resource,
          }),
        });
      } finally {
        isLoading.value = false;
      }
    }
  }
</script>

<template>
  <div :class="[$style.record, recordId !== 'new' && $style.deletable]">
    <div :class="$style.recordToolbar">
      <ui3n-button
        type="icon"
        color="var(--color-bg-block-primary-default)"
        icon="round-arrow-back"
        icon-color="var(--color-icon-block-primary-default)"
        @click="backToList"
      />

      <span :class="$style.title">
        {{ recordId === 'new' ? t('recordDialog.title.add') : t('recordDialog.title.edit') }}
      </span>

      <span :class="$style.empty" />
    </div>

    <div :class="[$style.recordBody, isLoading && $style.blurry]">
      <div :class="$style.row">
        <ui3n-input
          :model-value="recordData.name || ''"
          :label="t('recordDialog.form.fields.name.label')"
          :placeholder="t('recordDialog.form.fields.name.placeholder')"
          :disabled="isLoading"
          @update:model-value="v => handleInput('name', v)"
        />
      </div>

      <div :class="$style.row">
        <ui3n-input
          :model-value="recordData.resource"
          :label="`${t('recordDialog.form.fields.resource.label')}*`"
          :placeholder="t('recordDialog.form.fields.resource.placeholder')"
          :rules="resourceRules"
          :display-state-mode="errorMessages.resource ? 'error' : undefined"
          :display-state-message="errorMessages.resource"
          :disabled="isLoading"
          @update:model-value="v => handleInput('resource', v)"
          @update:valid="v => updateValidation('resource', v)"
        />
      </div>

      <div :class="$style.row">
        <ui3n-input
          :model-value="recordData.username"
          :label="`${t('recordDialog.form.fields.username.label')}*`"
          :placeholder="t('recordDialog.form.fields.username.placeholder')"
          :rules="usernameRules"
          :display-state-mode="errorMessages.username ? 'error' : undefined"
          :display-state-message="errorMessages.username"
          :disabled="isLoading"
          @update:model-value="v => handleInput('username', v)"
          @update:valid="v => updateValidation('username', v)"
        />
      </div>

      <div :class="$style.row">
        <div :class="$style.wrapper">
          <ui3n-input
            :model-value="recordData.password"
            :type="showPassword ? 'text' : 'password'"
            :label="`${t('recordDialog.form.fields.password.label')}*`"
            :placeholder="t('recordDialog.form.fields.password.placeholder')"
            :rules="passwordRules"
            :disabled="isLoading"
            :class="$style.passwordField"
            @update:model-value="v => handleInput('password', v)"
            @update:valid="v => updateValidation('password', v)"
          />

          <ui3n-button
            type="icon"
            size="small"
            color="var(--color-bg-control-secondary-default)"
            :icon="showPassword ? 'eye-off-outline' : 'eye-outline'"
            icon-color="var(--color-icon-control-accent-default)"
            icon-size="16"
            :class="$style.showBtn"
            @click.stop.prevent="showPassword = !showPassword"
          />
        </div>

        <ui3n-button
          block
          type="custom"
          color="var(--color-bg-button-tritery-default)"
          text-color="var(--color-text-button-tritery-default)"
          @click.stop.prevent="generatePassword"
        >
          {{ t('recordDialog.form.btns.generate') }}
        </ui3n-button>
      </div>

      <div :class="$style.row">
        <ui3n-selector
          :model-value="recordData.group"
          :label="t('recordDialog.form.fields.group.label')"
          :placeholder="t('recordDialog.form.fields.group.placeholder')"
          :items="sortedGroups"
          item-display="name"
          clearable
          @update:model-value="v => handleInput('group', v || null)"
        />
      </div>
    </div>

    <div :class="$style.recordActions">
      <ui3n-button
        v-if="recordId !== 'new'"
        block
        type="custom"
        color="var(--color-bg-block-primary-default)"
        text-color="var(--warning-content-default)"
        icon="trash-can"
        icon-position="left"
        icon-color="var(--warning-content-default)"
        @click="deleteRecord"
      >
        {{ t('recordDialog.btn.delete') }}
      </ui3n-button>

      <ui3n-button
        block
        :disabled="!isFormValid || !isChanged || isLoading"
        @click="upsertRecord"
      >
        {{ recordId === 'new' ? t('recordDialog.btn.create') : t('recordDialog.btn.save') }}
      </ui3n-button>
    </div>

    <div
      v-if="isLoading"
      :class="$style.loader"
    >
      <ui3n-progress-circular
        indeterminate
        size="100"
        width="6"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .record {
    --record-toolbar-height: 48px;
    --record-actions-height: 64px;
    --record-ext-actions-height: 96px;

    position: fixed;
    inset: 0;
    background-color: var(--color-bg-block-primary-default);
    overflow: hidden;

    .recordToolbar {
      display: flex;
      width: 100%;
      height: var(--record-toolbar-height);
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--spacing-m) 0 var(--spacing-s);
      border-bottom: 1px solid var(--color-border-block-primary-default);

      .title {
        font-size: var(--font-16);
        font-weight: 700;
        line-height: 1;
        color: var(--color-text-block-primary-default);
      }

      .empty {
        display: block;
        position: relative;
        width: var(--spacing-l);
      }
    }

    .recordBody {
      position: relative;
      width: 100%;
      height: calc(100% - var(--record-toolbar-height) - var(--record-actions-height) - var(--spacing-xs));
      padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
      overflow-x: hidden;
      overflow-y: auto;

      &.blurry {
        filter: blur(2px);
      }

      .row {
        position: relative;
        width: 100%;
        margin-bottom: var(--spacing-s);

        .wrapper {
          position: relative;
          width: 100%;
        }

        .passwordField {
          input {
            padding-right: var(--spacing-l);
          }
        }

        .showBtn {
          position: absolute;
          right: 4px;
          top: 24px;
        }

        .groupSelector {
          border-radius: 4px;
          background-color: var(--color-bg-control-secondary-default);
        }
      }
    }

    .recordActions {
      display: flex;
      width: 100%;
      height: var(--record-actions-height);
      padding: 0 var(--spacing-m);
      justify-content: stretch;
      align-items: center;
    }

    &.deletable {
      .recordBody {
        height: calc(100% - var(--record-toolbar-height) - var(--record-ext-actions-height) - var(--spacing-xs));
      }

      .recordActions {
        height: var(--record-ext-actions-height);
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
        row-gap: var(--spacing-s);
      }
    }

    .loader {
      position: absolute;
      left: 0;
      width: 100%;
      top: var(--record-toolbar-height);
      bottom: var(--record-actions-height);
      z-index: 1;
      pointer-events: none;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
