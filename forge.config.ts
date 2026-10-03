import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { join, resolve } from 'path';
import { copy, emptyDir, pathExists } from 'fs-extra';
import { execFileSync } from 'child_process';
import "dotenv/config";

const stagedData = resolve('.packaging/data');

export default {
  packagerConfig: {
    name: 'Remed',
    icon: 'assets/logo',
    asar: true,
    extraResource: ['progress.html', 'assets', 'bin', 'backend', 'frontend', stagedData, 'scripts/runtime-check.cjs'],
    // osxSign: true,
  },
  hooks: {
    async prePackage(_config, platform, arch) {
      if (platform !== process.platform || arch !== process.arch) {
        throw new Error(`Build on the target OS and architecture (${platform}/${arch}) so npm installs the correct native dependencies.`);
      }
      for (const file of ['backend/app.cjs', 'backend/docx-javascript-worker.cjs', 'backend/package-lock.json', 'frontend/index.html', 'data/db.7z']) {
        if (!await pathExists(file)) throw new Error(`Missing build input: ${file}`);
      }
      execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--omit=dev', '--include=optional', '--no-audit', '--no-fund'], {
        cwd: resolve('backend'),
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
      await emptyDir(stagedData);
      await copy('data/db.7z', join(stagedData, 'db.7z'));
    },
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
        // {
        //   entry: 'src/server.ts',
        //   config: 'vite.main.config.ts',
        //   target: 'main',
        // }
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
