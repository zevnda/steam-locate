# steam-locate

A cross-platform Node.js library for detecting the Steam client installation, checking if Steam is running, and listing or locating installed Steam games on Windows, macOS, and Linux. Inspired by the [`steamlocate`](https://crates.io/crates/steamlocate) Rust crate.

## Installation

```sh
npm install steam-locate
```

## Usage

```typescript
import {
  findSteamLocation,
  findSteamLocationSync,
  isSteamRunning,
  isSteamRunningSync,
  findSteamApp,
  findSteamAppSync,
  getInstalledSteamApps,
  getInstalledSteamAppsSync,
  SteamNotFoundError,
  SteamAppNotFoundError
} from 'steam-locate';

// Async usage
const location = await findSteamLocation();
console.log(location);

// Sync usage
const locationSync = findSteamLocationSync();
console.log(locationSync);

// Check if Steam is running
const running = await isSteamRunning();
const runningSync = isSteamRunningSync();

// Find a specific app
const app = await findSteamApp('570'); // Dota 2
const appSync = findSteamAppSync('570');

// List all installed apps
const apps = await getInstalledSteamApps();
const appsSync = getInstalledSteamAppsSync();
```

---

## API Reference

### Types

#### `SteamLocation`
```typescript
interface SteamLocation {
  path: string; // Path to Steam installation
  isRunning: boolean; // Whether Steam is running
  platform: 'win32' | 'darwin' | 'linux';
  version?: string;
  libraryFolders: string[];
}
```

#### `SteamApp`
```typescript
interface SteamApp {
  appId: string;
  name?: string;
  installDir?: string;
  sizeOnDisk?: number;
  isInstalled: boolean;
  lastUpdated?: Date;
}
```

#### Errors
- `SteamNotFoundError`: Thrown when Steam installation is not found
- `SteamAppNotFoundError`: Thrown when a specific app is not found

---

### Functions

#### `findSteamLocation(): Promise<SteamLocation>`
Detects the Steam installation and libraries

**Example response:**
```json
{
  "path": "C:\\Program Files (x86)\\Steam",
  "isRunning": true,
  "platform": "win32",
  "version": "5.98.0.0",
  "libraryFolders": [
    "C:\\Program Files (x86)\\Steam\\steamapps",
    "D:\\SteamLibrary\\steamapps"
  ]
}
```

#### `findSteamLocationSync(): SteamLocation`
Synchronous version

---

#### `isSteamRunning(): Promise<boolean>`
Checks if Steam is running

#### `isSteamRunningSync(): boolean`
Synchronous version

---

#### `findSteamApp(appId: string, steamPath?: string): Promise<SteamApp>`
Finds a specific Steam app/game by App ID

**Example response:**
```json
{
  "appId": "570",
  "name": "Dota 2",
  "installDir": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta",
  "sizeOnDisk": 20000000000,
  "isInstalled": true,
  "lastUpdated": "2024-06-01T12:34:56.000Z"
}
```

#### `findSteamAppSync(appId: string, steamPath?: string): SteamApp`
Synchronous version

---

#### `getInstalledSteamApps(steamPath?: string): Promise<SteamApp[]>`
Lists all installed Steam apps/games

**Example response:**
```json
[
  {
    "appId": "570",
    "name": "Dota 2",
    "installDir": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta",
    "sizeOnDisk": 20000000000,
    "isInstalled": true,
    "lastUpdated": "2024-06-01T12:34:56.000Z"
  },
  {
    "appId": "730",
    "name": "Counter-Strike: Global Offensive",
    "installDir": "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive",
    "sizeOnDisk": 30000000000,
    "isInstalled": true,
    "lastUpdated": "2024-05-20T10:00:00.000Z"
  }
]
```

#### `getInstalledSteamAppsSync(steamPath?: string): SteamApp[]`
Synchronous version

---

## Error Handling

All functions may throw `SteamNotFoundError` or `SteamAppNotFoundError` if Steam or a specific app cannot be found. Use try/catch to handle errors

---

## License

[MIT License](LICENSE)
