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
  import { inject } from 'vue';
  import { storeToRefs } from 'pinia';
  import { DIALOGS_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import {
    Ui3nButton,
    Ui3nDialog,
    Ui3nIcon,
    Ui3nInput,
    Ui3nSelector,
    type Ui3nDialogComponentProps,
    type Ui3nDialogEvent,
  } from '@v1nt1248/3nclient-lib';
  import { useRecordStore } from '@/common/stores/record.store';
  import { useRecord } from '@/common/composables/use-record';
  import type { TreasureRecord } from '@types';
  import ConfirmationDialog from '@/common/components/dialogs/confirmation-dialog.vue';

  const props = defineProps<{
    record?: TreasureRecord;
    selectedGroup?: string;
    dialogProps?: Ui3nDialogComponentProps<TreasureRecord>;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: { event: Ui3nDialogEvent | 'delete'; data?: TreasureRecord }): void;
  }>();

  const { $openDialog } = inject(DIALOGS_KEY)!;
  const { sortedGroups } = storeToRefs(useRecordStore());

  const {
    t,
    isLoading,
    recordData,
    showPassword,
    errorMessages,
    isFormValid,
    isChanged,
    resourceRules,
    usernameRules,
    passwordRules,
    handleInput,
    updateValidation,
    generatePassword,
  } = useRecord({ record: props.record, selectedGroup: props.selectedGroup });

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
      emits('action', { event: 'delete', data: props.record! });
    }
  }

  function handleCancel() {
    emits('action', { event: 'cancel' });
  }

  function handleOk() {
    if (!isFormValid.value || !isChanged.value) {
      return;
    }

    emits('action', { event: 'confirm', data: recordData.value });
  }
</script>

<template>
  <ui3n-dialog
    v-bind="dialogProps"
    :class="$style.editRecordDialog"
    @action="emits('action', $event)"
  >
    <template #header>
      <div :class="$style.header">
        <div :class="$style.block">
          <ui3n-icon
            :icon="recordData.id === 'new' ? 'round-plus' : 'key-vertical-outline'"
            size="14"
            color="var(--info-outline-default)"
          />

          <span :class="$style.title">
            {{ recordData.id === 'new' ? t('recordDialog.title.add') : t('recordDialog.title.edit') }}
          </span>
        </div>
      </div>
    </template>

    <template #body>
      <div :class="$style.body">
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

        <div :class="[$style.row, $style.password]">
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
            type="custom"
            color="var(--color-bg-button-tritery-default)"
            text-color="var(--color-text-button-tritery-default)"
            :class="$style.generateBtn"
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
    </template>

    <template #actions>
      <div :class="$style.actions">
        <div :class="$style.block">
          <ui3n-button
            v-if="recordData.id !== 'new'"
            type="custom"
            color="var(--color-bg-block-primary-default)"
            text-color="var(--warning-content-default)"
            icon="trash-can"
            icon-position="left"
            icon-color="var(--warning-content-default)"
            @click.stop.prevent="deleteRecord"
          >
            {{ t('recordDialog.btn.delete') }}
          </ui3n-button>
        </div>

        <div :class="$style.block">
          <ui3n-button
            type="secondary"
            @click.stop.prevent="handleCancel"
          >
            {{ recordData.id === 'new' ? t('recordDialog.btn.close') : t('recordDialog.btn.discard') }}
          </ui3n-button>

          <ui3n-button
            :disabled="!isFormValid || !isChanged"
            @click.stop.prevent="handleOk"
          >
            {{ recordData.id === 'new' ? t('recordDialog.btn.create') : t('recordDialog.btn.save') }}
          </ui3n-button>
        </div>
      </div>
    </template>
  </ui3n-dialog>
</template>

<style lang="scss" module>
  @use '@/assets/styles/mixins' as mixins;

  .editRecordDialog {
    --record-dialog-header-height: 48px;
    --record-dialog-actions-height: 64px;

    position: relative;
    border-radius: var(--spacing-m) !important;

    .block {
      display: flex;
      justify-content: center;
      align-items: center;
      column-gap: var(--spacing-xs);
    }

    .header {
      display: flex;
      width: 100%;
      height: var(--record-dialog-header-height);
      padding: 0 var(--spacing-m);
      justify-content: space-between;
      align-items: center;
      column-gap: var(--spacing-m);
      border-bottom: 1px solid var(--color-border-block-primary-default);

      .title {
        font-size: var(--font-12);
        font-weight: 600;
        color: var(--color-text-block-primary-default);
      }
    }

    .body {
      position: relative;
      width: 100%;
      padding: var(--spacing-m);
      overflow-y: auto;

      .row {
        position: relative;
        width: 100%;
        margin-bottom: var(--spacing-s);

        &.password {
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          column-gap: var(--spacing-m);
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
      }

      .generateBtn {
        min-width: 144px;
        width: 144px;
        bottom: 15px;
      }

      .groupSelector {
        border-radius: 4px;
        background-color: var(--color-bg-control-secondary-default);
      }
    }

    .actions {
      display: flex;
      width: 100%;
      height: var(--record-dialog-actions-height);
      padding: 0 var(--spacing-m);
      justify-content: space-between;
      align-items: center;
    }

    .wrapper {
      position: relative;
      flex-grow: 1;
    }
  }
</style>
