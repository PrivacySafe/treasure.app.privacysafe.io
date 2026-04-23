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
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import { useRecordStore } from '@/common/stores/record.store';
import type { TreasureRecord } from '@types';

const newRecordData: TreasureRecord = {
  id: 'new',
  resource: '',
  name: '',
  username: '',
  password: '',
  group: '',
};

export function useRecord({ record, selectedGroup }: { record?: TreasureRecord; selectedGroup?: string }) {
  const { t } = useI18n();

  const recordStore = useRecordStore();
  const { records, sortedGroups } = storeToRefs(recordStore);

  const isLoading = ref(false);
  const recordData = ref<TreasureRecord>(
    record
      ? cloneDeep(record)
      : {
          ...cloneDeep(newRecordData),
          ...(selectedGroup && selectedGroup !== 'favorites' && { group: selectedGroup }),
          ...(selectedGroup && selectedGroup === 'favorites' && { isFavorite: true }),
        },
  );
  const initialRecordData = ref<TreasureRecord>(cloneDeep(recordData.value));
  const showPassword = ref(false);
  const validation = ref({
    resource: recordData.value.id !== 'new',
    username: recordData.value.id !== 'new',
    password: recordData.value.id !== 'new',
  });
  const errorMessages = ref({
    resource: '',
    username: '',
  });

  if (recordData.value.id !== 'new') {
    doubleValidate();
  }

  const isFormValid = computed(
    () =>
      validation.value.resource &&
      validation.value.username &&
      validation.value.password &&
      !errorMessages.value.resource &&
      !errorMessages.value.username,
  );
  const isChanged = computed(() =>
    Object.keys(newRecordData).some(
      field =>
        (recordData.value[field as keyof TreasureRecord] || '') !==
        (initialRecordData.value[field as keyof TreasureRecord] || ''),
    ),
  );

  const resourceRules = [(v: unknown) => !!v || t('recordDialog.form.fields.resource.required')];

  const usernameRules = [(v: unknown) => !!v || t('recordDialog.form.fields.username.required')];

  const passwordRules = [(v: unknown) => !!v || t('recordDialog.form.fields.password.required')];

  function doubleValidate() {
    const currentId = recordData.value.id;
    const duplicate = records.value.find(
      r =>
        r.resource === recordData.value.resource && r.username === recordData.value.username && r.id !== currentId,
    );

    errorMessages.value = {
      resource: duplicate ? t('recordDialog.form.fields.resource.unique') : '',
      username: duplicate ? t('recordDialog.form.fields.username.unique') : '',
    };
  }

  function generatePassword() {
    recordData.value.password = getRandomId(16);
    validation.value.password = true;
  }

  function updateValidation(field: 'resource' | 'username' | 'password', val: boolean) {
    validation.value[field] = val;
  }

  function handleInput(field: keyof TreasureRecord, value: string) {
    recordData.value[field] = value as string as never;
    doubleValidate();
  }

  return {
    t,
    isLoading,
    sortedGroups,
    recordData,
    resourceRules,
    usernameRules,
    passwordRules,
    showPassword,
    isFormValid,
    isChanged,
    errorMessages,
    generatePassword,
    updateValidation,
    handleInput,
  };
}
