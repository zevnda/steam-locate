import { platform } from 'os';
import { normalize } from 'path';
import type { SteamLocation, SteamPlatform, SteamApp } from './types';
import { findSteamPath, findSteamPathSync } from './steam-path';
import { getLibraryFolders, getLibraryFoldersSync } from './steam-libraries';
import { isSteamRunning, isSteamRunningSync } from './steam-process';
import { getSteamVersion, getSteamVersionSync } from './steam-version';
import {
  findSteamAppInLibraries,
  findSteamAppInLibrariesSync,
  getInstalledSteamAppsFromLibraries,
  getInstalledSteamAppsFromLibrariesSync,
} from './steam-apps';
import { SteamNotFoundError, SteamAppNotFoundError } from './errors';

/**
 * Finds the Steam client installation location across platforms
 * @returns Promise resolving to Steam location information
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export async function findSteamLocation(): Promise<SteamLocation> {
  const currentPlatform = platform() as SteamPlatform;
  try {
    let steamPath = await findSteamPath();
    let libraryFolders = await getLibraryFolders(steamPath).catch(() => []);
    // Normalize paths for Windows
    if (currentPlatform === 'win32') {
      steamPath = normalize(steamPath);
      libraryFolders = libraryFolders.map((p: string) => normalize(p));
    }
    const isRunning = await isSteamRunning();
    const version = await getSteamVersion(steamPath).catch(() => undefined);
    return {
      path: steamPath,
      isRunning,
      platform: currentPlatform,
      version,
      libraryFolders,
    };
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamNotFoundError(
      `Failed to find Steam on ${currentPlatform}: ${(error as Error).message}`,
      currentPlatform
    );
  }
}

/**
 * Synchronous version of findSteamLocation
 * @returns Steam location information
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export function findSteamLocationSync(): SteamLocation {
  const currentPlatform = platform() as SteamPlatform;
  try {
    let steamPath = findSteamPathSync();
    let libraryFolders = getLibraryFoldersSync(steamPath);
    // Normalize paths for Windows
    if (currentPlatform === 'win32') {
      steamPath = normalize(steamPath);
      libraryFolders = libraryFolders.map((p: string) => normalize(p));
    }
    const isRunning = isSteamRunningSync();
    const version = getSteamVersionSync(steamPath);
    return {
      path: steamPath,
      isRunning,
      platform: currentPlatform,
      version,
      libraryFolders,
    };
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamNotFoundError(
      `Failed to find Steam on ${currentPlatform}: ${(error as Error).message}`,
      currentPlatform
    );
  }
}

/**
 * Find a specific Steam app/game by App ID
 * @param appId Steam App ID to search for
 * @param steamPath Optional Steam installation path (will auto-detect if not provided)
 * @returns Promise resolving to Steam app information
 * @throws {SteamAppNotFoundError} When the app cannot be found
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export async function findSteamApp(appId: string, steamPath?: string): Promise<SteamApp> {
  try {
    const actualSteamPath = steamPath || (await findSteamPath());
    const libraryFolders = await getLibraryFolders(actualSteamPath);
    return findSteamAppInLibraries(appId, libraryFolders, actualSteamPath);
  } catch (error) {
    if (error instanceof SteamAppNotFoundError || error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamAppNotFoundError(appId, `Error finding Steam app: ${(error as Error).message}`);
  }
}

/**
 * Synchronous version of findSteamApp
 * @param appId Steam App ID to search for
 * @param steamPath Optional Steam installation path (will auto-detect if not provided)
 * @returns Steam app information
 * @throws {SteamAppNotFoundError} When the app cannot be found
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export function findSteamAppSync(appId: string, steamPath?: string): SteamApp {
  try {
    const actualSteamPath = steamPath || findSteamPathSync();
    const libraryFolders = getLibraryFoldersSync(actualSteamPath);
    return findSteamAppInLibrariesSync(appId, libraryFolders, actualSteamPath);
  } catch (error) {
    if (error instanceof SteamAppNotFoundError || error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamAppNotFoundError(appId, `Error finding Steam app: ${(error as Error).message}`);
  }
}

/**
 * Get list of all installed Steam apps
 * @param steamPath Optional Steam installation path (will auto-detect if not provided)
 * @returns Promise resolving to array of installed Steam apps
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export async function getInstalledSteamApps(steamPath?: string): Promise<SteamApp[]> {
  try {
    const actualSteamPath = steamPath || (await findSteamPath());
    const libraryFolders = await getLibraryFolders(actualSteamPath);
    return getInstalledSteamAppsFromLibraries(libraryFolders);
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamNotFoundError(`Error getting installed Steam apps: ${(error as Error).message}`);
  }
}

/**
 * Synchronous version of getInstalledSteamApps
 * @param steamPath Optional Steam installation path (will auto-detect if not provided)
 * @returns Array of installed Steam apps
 * @throws {SteamNotFoundError} When Steam installation cannot be found
 */
export function getInstalledSteamAppsSync(steamPath?: string): SteamApp[] {
  try {
    const actualSteamPath = steamPath || findSteamPathSync();
    const libraryFolders = getLibraryFoldersSync(actualSteamPath);
    return getInstalledSteamAppsFromLibrariesSync(libraryFolders);
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      throw error;
    }
    throw new SteamNotFoundError(`Error getting installed Steam apps: ${(error as Error).message}`);
  }
}
