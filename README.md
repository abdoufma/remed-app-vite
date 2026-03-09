Steps to make sure the remed backend is ready for the Electron shell integration:

1. Folder structure:
   - backend/ # built backend code
   - frontend/ # built frontend code
   - data/ contains a copy of the database (`remed.db`), as well as the 7z archive of the database to be bundled with the app (`db.7z`)
   - logs/ logs directory for development
   - src/ # source code
   - bin/ # contains the os-specific binaries for the app (7z, sqlite3)


2. Remed backend:
- `app.js` is the entry point for the backend
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