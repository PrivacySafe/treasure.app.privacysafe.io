import { resolve } from 'node:path';
import { type UserConfig, defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

function _resolve(dir: string) {
  return resolve(__dirname, dir);
}

export const makeConfig = ({ mode }: UserConfig) => {
  const isDev = mode === 'development';
  // const isProd = mode === 'production'

  const server = {
    port: 3030,
    cors: { origin: '*' },
  };
  const define = {
    'process.env': {},
    global: 'globalThis',
  };

  const plugins = [
    vue(),
    // nodePolyfills({
    //   include: ['timers', 'timers/promises', 'path', 'url', 'fs'],
    //   globals: {
    //     Buffer: true,
    //     global: true,
    //     process: true,
    //   },
    // }),
    vueDevTools(),
  ];

  return {
    server,

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },

    build: {
      // reference: https://rollupjs.org/configuration-options/
      rollupOptions: {
        input: {
          main: _resolve('./index.html'),
          'main-mobile': _resolve('./index-mobile.html'),
        },
        output: [
          {
            name: 'main',
            dir: 'app',
          },
          {
            name: 'main-mobile',
            dir: 'app',
          },
        ],
      },
    },

    define,

    plugins,

    optimizeDeps: {
      include: isDev ? ['vue', 'vue-router', 'vue-i18n', 'pinia', 'lodash'] : [],
    },

    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
        '@': _resolve('./src'),
        '@shared': _resolve('./shared'),
        '@deno': _resolve('./src-deno'),
      },
    },
  };
}

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(makeConfig);
