Steps to make sure the remed backend is ready for the Electron shell integration:

Experimental backend runtime packaging:

- Put the built backend at `backend/app.cjs` and its document worker at `backend/docx-javascript-worker.cjs`. Put the exported frontend, including `index.html`, directly in `frontend/`.
- Keep `backend/package.json` and `backend/package-lock.json` when replacing build output. Externalize `libsql`, `libsql/promise`, and the other runtime packages declared in that manifest when building the backend.
- The backend must use the supplied `SQLITE_DB_PATH`, `SQLITE_DB_BACKUPS_DIR`, `FRONTEND_OUT_DIR`, `UPLOADS_DIR`, `LOGS_DIR`, and `BACKEND_PORT`/`PORT` environment variables. Use `DOCX_JAVASCRIPT_WORKER_PATH` for the document worker. Bun 1.4.0 inlines source `__dirname` when bundling, so it is not a reliable packaged path.
- Supply `data/db.7z` containing `remed.db`. Packaging copies the archive without moving or deleting the source.
- Run `npm run package` on the target OS and architecture. Forge runs `npm ci --omit=dev --include=optional` in `backend/` and includes the entire backend runtime as an extra resource. Native packages remain outside ASAR; there is no native post-package copy.
- Run `npm run check:package` to launch the packaged Electron executable with isolated temporary user data. Its worker verifies dependency resolution inside the packaged backend, libsql persistence, sharp/resvg rendering, SuperDoc's embedded process, and QuickJS WASM initialization. This check does not start the application backend or verify its database schema and UI.
- To check an app copied elsewhere, run `node scripts/check-package.cjs /absolute/path/to/the/executable`.

The experimental build was checked on macOS ARM64 with Electron 35. Windows and Intel macOS require their own builds and runtime checks.

1. Folder structure:
   - backend/ # built backend code
   - frontend/ # built frontend code
   - data/ contains a copy of the database (`remed.db`), as well as the 7z archive of the database to be bundled with the app (`db.7z`)
   - logs/ logs directory for development
   - src/ # source code
   - bin/ # contains the os-specific binaries for the app (7z, sqlite3)


2. Remed backend:
- `app.cjs` is the entry point for the backend
- the backend code must make use of environment variables to configure the app, and use the `log` function to log messages to the console and to the logs directory
- the backend code must be able to handle the server-started event from the Electron shell, and send a message to the Electron shell to indicate that the server has started
- the backend code will receive messages from the Electron shell. the server may communicate with the Electron shell using the `parentPort` object.









Version Update consideration:
- Backup the current user database
- Migrate the database to the new schema
- insert new default data into the database

Requirements for running:
- Clone the repository
- Create a `.env` file in the root directory and add the following variables: `APPLE_ID`, `APPLE_PASSWORD`, `GITHUB_TOKEN`
- Create `data/`, `bin/`, `backend/`, `frontend/` directories (if they don't exist)
- Create an archive of the database (`db.7z`) and place it in the `data/` directory.
- Run `npm install` to install the dependencies
- Run `npm run start` to start the development server
- Run `npm run package` to package the application for the current platform
- Run `npm run publish` to publish the application to the GitHub repository
