# libsql production packaging

Research date: 2026-09-06. This is a proposal based on the source and upstream documentation. No production artifact was built or launched during this investigation; the checkout has no installed dependencies.

## What the current app actually loads

`src/main.ts` launches `resources/backend/app.js` in a Node Worker when packaged. Forge copies `backend` through `extraResource`, so this entry point lives outside `app.asar`. The supplied backend bundle already contains libsql's JavaScript wrapper and its dynamic `require('@libsql/' + target)` equivalent. Changing `vite.main.config.ts` cannot change that prebuilt backend bundle.

The current workaround puts the native package at `resources/node_modules/@libsql/<target>`, an ancestor dependency directory the backend can resolve. Putting it only in `app.asar/node_modules` would not preserve that relationship. Node searches `node_modules` relative to the requiring module and then its ancestors. [Node module resolution](https://nodejs.org/api/modules.html#loading-from-node_modules-folders)

The two lockfiles disagree: `bun.lock` records libsql 0.5.13 and Forge Vite 7.7.0; `package-lock.json` records libsql 0.5.22 and Forge Vite 7.10.2. Neither proves which wrapper version was embedded in the separately built backend.

## Recommended layout

Make the backend a self-contained runtime artifact with its own exact production dependencies and committed lockfile:

```text
resources/
  app.asar
  backend/
    app.js
    package.json
    package-lock.json
    node_modules/
      libsql/
      @libsql/<target>/
      @neon-rs/load/
      detect-libc/
```

1. Externalize `libsql` and `libsql/*` in the actual upstream backend build. Its output must leave those imports to runtime resolution. Forge documents externalization for native packages, but this project's relevant bundler is the one producing `backend/app.js`. [Forge Vite native modules](https://www.electronforge.io/config/plugins/vite#native-node-modules)
2. Give this backend runtime a minimal package manifest containing an exact libsql version. `0.5.22` matches the current npm lockfile; select and test the version with the backend source rather than assuming the existing embedded wrapper matches it. Include any other imports left external by that build.
3. In a clean staging directory on each target OS and architecture, run `npm ci --omit=dev --include=optional` using that runtime lockfile. npm installs the locked dependency tree and retains explicitly included optional dependencies. Do not reuse macOS ARM dependencies in a Windows build. [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
4. Use the existing `extraResource: ['backend', ...]` to copy the complete staged runtime. Remove the platform-specific native extra resource and native post-package move. The packaged worker path stays the same. Electron Packager copies `extraResource` directories into the application's resources directory. [Packager extraResource](https://electron.github.io/packager/main/interfaces/Options.html#extraResource)

This keeps the native binary outside ASAR, so backend libsql needs neither an ASAR unpack rule nor the auto-unpack plugin. Installation and packaging own the file layout before signing and installer creation.

libsql 0.5.x selects an optional platform package dynamically. Its Rust binding uses Neon with Node-API 6. Rebuilding does not repair a missing package or a wrong directory. Node-API provides ABI stability subject to its documented limits; loading and exercising the binary in the shipped Electron runtime remains the acceptance test. [libsql loader](https://github.com/tursodatabase/libsql-js/blob/v0.5.13/index.js), [libsql 0.5.22 native configuration](https://github.com/tursodatabase/libsql-js/blob/v0.5.22/Cargo.toml), [Node-API compatibility](https://nodejs.org/api/n-api.html#implications-of-abi-stability)

If the upstream backend cannot be rebuilt yet, stage the same dependency tree beside its existing bundle as a transitional solution. First establish the embedded wrapper's version from its upstream lockfile, then pin the matching native version. Installing 0.5.22 beside an unidentified bundled wrapper is not a compatibility guarantee.

## Required release checks

- Before packaging, fail if the expected platform package or its `.node` entry cannot be resolved from the staged backend, its version differs from the pinned wrapper, or the staging target differs from the packaging target. Inspect the actual packaged tree again before making the installer. Throw on failure rather than logging and continuing.
- Launch the packaged Electron executable through a dedicated smoke-test argument that runs before normal startup and updates. Spawn a Worker located beside the packaged backend. Resolve libsql there, create a temporary disk database, insert and read a value, close, reopen, and verify persistence. Record the resolved module path and Electron architecture. Require a success message and a zero exit status, with a timeout and Worker errors treated as failures.
- Also launch the real backend Worker against a disposable valid application database fixture, isolated user-data directory, and unused port. Require `server-started` plus a database-backed request. A SQL probe alone cannot prove application startup or schema compatibility.
- Run these checks from an isolated installed/extracted artifact on every supported OS and architecture, without repository dependencies or `NODE_PATH`. Repeat against the final installer output. The current `RunAsNode: false` fuse means `ELECTRON_RUN_AS_NODE` is not an appropriate test runner for the release executable. [Electron fuses](https://www.electronjs.org/docs/latest/tutorial/fuses#runasnode)

An alternative is to move the backend and its dependencies into ASAR together and unpack the native binaries, but that changes the worker layout. Forge Vite 7.10.2 also excludes everything except `.vite` by default, so packaging external dependencies there requires an explicit inclusion policy. Auto-unpack cannot recover files the packaging filter excluded. [Forge Vite source](https://github.com/electron/forge/blob/v7.10.2/packages/plugin/vite/src/VitePlugin.ts), [auto-unpack plugin](https://www.electronforge.io/config/plugins/auto-unpack-natives)
