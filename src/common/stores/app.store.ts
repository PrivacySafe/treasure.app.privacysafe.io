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
import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { AppConfig, AppConfigs, AvailableLanguage, AvailableColorTheme } from '@types';
import { blobFromDataURL, SystemSettings } from '@/common/utils';

export const useAppStore = defineStore('app', () => {
  const appVersion = ref<string>('');
  const connectivityStatus = ref<string>('offline');
  const user = ref<Nullable<string>>(null);
  const lang = ref<AvailableLanguage>('en');
  const colorTheme = ref<AvailableColorTheme>('default');
  const customLogoSrc = ref<string>();
  const appWindowSize = ref<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  // @ts-ignore
  const operatingSystem = ref<'macos' | 'linux' | 'windows'>(navigator.userAgentData?.platform.toLowerCase());
  const commonLoading = ref<boolean>(false);

  async function getAppVersion() {
    appVersion.value = await w3n.myVersion();
  }

  async function getUser() {
    user.value = await w3n.mailerid!.getUserId();
  }

  function setConnectivityStatus(value: boolean) {
    connectivityStatus.value = value ? 'online' : 'offline';
  }

  function setAppWindowSize({ width = 0, height = 0 }) {
    appWindowSize.value = {
      ...appWindowSize.value,
      ...(width && { width }),
      ...(height && { height }),
    };
  }

  function setCommonLoading(value: boolean) {
    commonLoading.value = value;
  }

  function setLang(value: AvailableLanguage) {
    lang.value = value;
  }

  function setColorTheme(theme: AvailableColorTheme) {
    const prevColorThemeCssClass = `${colorTheme.value}-theme`;
    colorTheme.value = theme;
    const curColorThemeCssClass = `${colorTheme.value}-theme`;

    const htmlEl = document.querySelector('html');
    if (!htmlEl) {
      return;
    }

    htmlEl.classList.remove(prevColorThemeCssClass);
    htmlEl.classList.add(curColorThemeCssClass);
  }

  async function setCustomLogo(dataURL: AppConfig['customLogo']): Promise<void> {
    if (dataURL) {
      try {
        const imgBlob = blobFromDataURL(dataURL);
        customLogoSrc.value = URL.createObjectURL(imgBlob);
      } catch (err) {
        console.error(`Parsing dataURL with customLogo throws error:`, err);
      }
    } else {
      customLogoSrc.value = undefined;
    }
  }

  async function getAppConfig(): Promise<AppConfigs | undefined> {
    try {
      const config = await SystemSettings.makeResourceReader();
      const { lang, colorTheme, customLogo } = await config.getAll();
      setLang(lang);
      setColorTheme(colorTheme);
      await setCustomLogo(customLogo);

      return config;
    } catch (e) {
      console.error('Load the app config error: ', e);
    }
  }

  return {
    appVersion,
    operatingSystem,
    connectivityStatus,
    user,
    lang,
    colorTheme,
    customLogoSrc,
    appWindowSize,
    commonLoading,

    getAppVersion,
    getUser,
    setConnectivityStatus,
    setAppWindowSize,
    setCommonLoading,
    setLang,
    setColorTheme,
    setCustomLogo,
    getAppConfig,
  };
});
