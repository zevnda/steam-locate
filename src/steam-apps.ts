import { join, normalize } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { platform } from 'os';
import { SteamAppNotFoundError } from './errors';
import type { SteamApp } from './types';

/**
 * Find Steam app in library folders
 */
export function findSteamAppInLibraries(
  appId: string,
  libraryFolders: string[],
  steamPath: string
): SteamApp {
  return findSteamAppInLibrariesSync(appId, libraryFolders, steamPath);
}

/**
 * Synchronous version of findSteamAppInLibraries
 */
export function findSteamAppInLibrariesSync(
  appId: string,
  libraryFolders: string[],
  _steamPath: string
): SteamApp {
  for (const libraryFolder of libraryFolders) {
    try {
      const appManifestPath = join(libraryFolder, `appmanifest_${appId}.acf`);
      if (existsSync(appManifestPath)) {
        const manifestContent = readFileSync(appManifestPath, 'utf8');
        // Parse ACF format
        const nameMatch = manifestContent.match(/"name"\s*"([^"]+)"/);
        const installDirMatch = manifestContent.match(/"installdir"\s*"([^"]+)"/);
        const sizeMatch = manifestContent.match(/"SizeOnDisk"\s*"([^"]+)"/);
        const lastUpdatedMatch = manifestContent.match(/"LastUpdated"\s*"([^"]+)"/);
        const installDir = installDirMatch?.[1]
          ? join(libraryFolder, 'common', installDirMatch[1])
          : undefined;
        const isInstalled = installDir ? existsSync(installDir) : false;
        return {
          appId,
          name: nameMatch?.[1] || undefined,
          installDir: isInstalled ? installDir : undefined,
          sizeOnDisk: sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : undefined,
          isInstalled,
          lastUpdated: lastUpdatedMatch?.[1]
            ? new Date(parseInt(lastUpdatedMatch[1], 10) * 1000)
            : undefined,
        };
      }
    } catch {
      // Continue to next library folder
    }
  }
  throw new SteamAppNotFoundError(appId);
}

/**
 * Get installed apps from library folders
 */
export async function getInstalledSteamAppsFromLibraries(
  libraryFolders: string[]
): Promise<SteamApp[]> {
  return new Promise(resolve => {
    try {
      const apps = getInstalledSteamAppsFromLibrariesSync(libraryFolders);
      resolve(apps);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Synchronous version of getInstalledSteamAppsFromLibraries
 */
export function getInstalledSteamAppsFromLibrariesSync(libraryFolders: string[]): SteamApp[] {
  const apps: SteamApp[] = [];
  const seen = new Set<string>();
  const isWin = platform() === 'win32';
  for (const libraryFolder of libraryFolders) {
    try {
      const files = readdirSync(libraryFolder);
      for (const file of files) {
        if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
          try {
            const appId = file.match(/appmanifest_(\d+)\.acf/)?.[1];
            if (appId) {
              const app = findSteamAppInLibrariesSync(appId, [libraryFolder], '');
              if (app.isInstalled && app.installDir) {
                let key = app.appId + '|' + normalize(app.installDir);
                if (isWin) key = key.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  apps.push(app);
                }
              }
            }
          } catch {
            // Skip invalid manifests
          }
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }
  return apps;
}
