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
import { onBeforeMount } from 'vue';
import { storeToRefs } from 'pinia';
import { makeServiceCaller } from '@shared/ipc/ipc-service-caller';
import { appTreasureDenoSrv } from '@/common/services/service-provider';
import { useAppStore } from '@/common/stores/app.store';
import { useSyncStore } from '@/common/stores/sync.store';
import { useRecordStore } from '@/common/stores/record.store';
import { SystemSettings } from '@/common/utils';
import type { Ui3nResizeCbArg } from '@v1nt1248/3nclient-lib';
import type { TreasureDenoSrv } from '@deno/srv.types';
import type {
  TreasureSyncStartEvent,
  TreasureSyncEndEvent,
  TreasureSyncUpdateEvent,
  TreasureAddEvent,
  TreasureRemoveEvent,
  TreasureRecord,
  TreasureUpdateEvent,
} from '@types';

export function useAppPage() {
  const appStore = useAppStore();
  const {
    getAppVersion,
    getUser,
    setConnectivityStatus,
    setAppWindowSize,
    getAppConfig,
    setLang,
    setColorTheme,
    setCustomLogo,
  } = appStore;
  const { appVersion, commonLoading, customLogoSrc, user, connectivityStatus } = storeToRefs(appStore);

  const syncStore = useSyncStore();
  const { isSyncRunning } = storeToRefs(syncStore);
  const { addRecordToSyncList, removeRecordFromSyncList, updateSyncListRecord } = syncStore;

  const { getAllGroups, getAllRecords, getRecord, getRecords, updateRecordList } = useRecordStore();

  w3n.connectivity!.watch({
    next: event => {
      const { isOnline } = event;
      setConnectivityStatus(isOnline);
    },
    error: err => {
      console.error('🔥 CONNECTIVITY WATCHING ERROR. ', err);
    },
  });

  function onResize(value: Ui3nResizeCbArg) {
    setAppWindowSize({ width: value.width, height: value.contentHeight });
  }

  function openDashboard() {
    w3n.shell!.openDashboard!();
  }

  function exitApp() {
    w3n.closeSelf();
  }

  onBeforeMount(async () => {
    await getAppVersion();
    await getUser();
    await getAppConfig();
    await getAllGroups();
    await getAllRecords();

    const onlineFlag = await w3n.connectivity?.isOnline();
    setConnectivityStatus(!!onlineFlag?.includes('online'));

    const config = await SystemSettings.makeResourceReader();
    config.watchConfig({
      next: appConfig => {
        const { lang, colorTheme, customLogo } = appConfig;
        setLang(lang);
        setColorTheme(colorTheme);
        setCustomLogo(customLogo);
      },
    });

    const treasureSrvConnection = await w3n.rpc!.thisApp!('AppTreasureInternal');
    const treasureSrv = makeServiceCaller(treasureSrvConnection, [], ['watchEvent']) as TreasureDenoSrv;
    treasureSrv.watchEvent({
      next: eventObj => {
        // console.log('🔔 WATCH EVENT FROM DENO => ', JSON.stringify(eventObj));
        // @ts-expect-error
        const { event, payload = {} } = eventObj;

        switch (event) {
          case 'sync:start': {
            const { path, type } = payload as TreasureSyncStartEvent['payload'];
            addRecordToSyncList(path, type);
            break;
          }

          case 'sync:end': {
            const { path } = payload as TreasureSyncEndEvent['payload'];
            removeRecordFromSyncList(path);
            break;
          }

          case 'sync:update': {
            const { path, type, value } = payload as TreasureSyncUpdateEvent['payload'];
            updateSyncListRecord(path, type, value);
            break;
          }

          case 'add:record': {
            const { data } = payload as TreasureAddEvent['payload'];
            getRecords(data);
            break;
          }

          case 'remove:record': {
            const { data } = payload as TreasureRemoveEvent['payload'];
            for (const recordId of data) {
              updateRecordList({ id: recordId } as TreasureRecord, true);
            }
            break;
          }

          case 'update:record': {
            const { data } = payload as TreasureUpdateEvent['payload'];
            getRecord(data);
            break;
          }

          case 'update:group': {
            getAllGroups();
            break;
          }

          case 'update:records': {
            getAllRecords();
            break;
          }

          // no default
        }
      },
      error: err => w3n.log('error', '🔥 Error watching storage events. ', err),
      complete: () => treasureSrvConnection.close(),
    });

    await appTreasureDenoSrv.initial();
  });

  return {
    appVersion,
    commonLoading,
    customLogoSrc,
    user,
    connectivityStatus,
    isSyncRunning,

    onResize,
    openDashboard,
    exitApp,
  };
}
