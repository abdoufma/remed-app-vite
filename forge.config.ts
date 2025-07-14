import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { resolve } from 'path';
import { move, pathExistsSync } from 'fs-extra';
import "dotenv/config";
// import { logDebug } from './src/utils';

const LIBSQL_FOLDER = process.platform === "darwin" ? "darwin-arm64" : `win32-x64-msvc`


async function copyNativeDeps() {
  // TODO: add windows-specific workaround
  // FIXME: find a better to include these
  const outDir = resolve(process.cwd(), `out/Remed-${process.platform}-${process.arch}`);
  console.log('outDir', outDir);
  const resourcesDir = process.platform === 'darwin' ? 'Remed.app/Contents/Resources' : 'resources';
  const src = resolve(outDir, resourcesDir, LIBSQL_FOLDER);
  const dest = resolve(outDir, resourcesDir, `node_modules/@libsql/${LIBSQL_FOLDER}`);
  console.log('Resources/ exists?', pathExistsSync(resolve(outDir, resourcesDir)));
  console.log('src exists?', pathExistsSync(src));
  console.debug('Copying', src, 'to', dest);
  await move(src, dest, {overwrite: true});
}


async function zipDb(){
  console.log("Zipping the db");
}

export default {
  packagerConfig: {
    name: 'Remed',
    icon: 'assets/logo',
    // asar : true,
    asar: {
      unpack: "**/node_modules/@libsql/**"
    },
    // TODO: include sqlite3 binary
    extraResource: ['db/db.7z', 'bin', 'backend', 'frontend', `node_modules/@libsql/${LIBSQL_FOLDER}`],
    // osxSign: true,
  },
  hooks: {
    async postPackage() {
      
      try {
        await copyNativeDeps();
        // await CopyPublicFolder();
      } catch (error) {
        console.error('Error copying files:', error);
      }
    }
  },
  makers: [
    new MakerSquirrel({name: "Remed", authors : "SARL DEVLOG", setupIcon : "assets/logo.ico", iconUrl : "https://raw.githubusercontent.com/abdoufma/remed-app-vite/refs/heads/with-workers/assets/logo.ico"}),
    // new MakerZIP({}, ['darwin']),
    new MakerDMG({ format: 'ULFO' }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'abdoufma',
        name: 'remed-app-vite',
      },
      prerelease: false,
      draft: false,
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
        {
          entry: 'src/server.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        }
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
} as ForgeConfig;