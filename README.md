# steam-locate

A Node.js package to find Steam installations and games across Windows, macOS, and Linux. Inspired by the [`steamlocate`](https://crates.io/crates/steamlocate) Rust crate.

## Features

- Find Steam installation paths on Windows, macOS, and Linux
- Detect if Steam is currently running
- Locate specific Steam games by App ID
- Get all installed Steam games
- Both async and sync APIs
- Zero dependencies
- Full TypeScript support

## Installation

```bash
npm install steam-locate
```

## Usage

### Find Steam Installation

```typescript
import { findSteamLocation } from 'steam-locate';

try {
  const steam = await findSteamLocation();
  console.log('Steam path:', steam.path);
  console.log('Is running:', steam.isRunning);
  console.log('Library folders:', steam.libraryFolders);
} catch (error) {
  console.error('Steam not found:', error.message);
}
```

### Find a Specific Game

```typescript
import { findSteamApp } from 'steam-locate';

try {
  // Find Counter-Strike 2 (App ID: 730)
  const game = await findSteamApp('730');
  console.log('Game:', game.name);
  console.log('Installed:', game.isInstalled);
  console.log('Install directory:', game.installDir);
} catch (error) {
  console.error('Game not found:', error.message);
}
```

### Get All Installed Games

```typescript
import { getInstalledSteamApps } from 'steam-locate';

try {
  const games = await getInstalledSteamApps();
  console.log(`Found ${games.length} installed games:`);
  games.forEach(game => {
    console.log(`- ${game.name} (${game.appId})`);
  });
} catch (error) {
  console.error('Could not get games:', error.message);
}
```

### Check if Steam is Running

```typescript
import { isSteamRunning } from 'steam-locate';

const running = await isSteamRunning();
console.log('Steam is running:', running);
```

## Synchronous APIs

All functions have synchronous versions:

```typescript
import { findSteamLocationSync, isSteamRunningSync } from 'steam-locate';

const steam = findSteamLocationSync();
const running = isSteamRunningSync();
```

## License

[MIT License](LICENSE)
