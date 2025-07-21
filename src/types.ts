/**
 * Supported platforms for Steam detection
 */
export type SteamPlatform = 'win32' | 'darwin' | 'linux';

/**
 * Result of Steam location detection
 */
export interface SteamLocation {
  /** Path to the Steam installation directory */
  path: string;
  /** Whether Steam is currently running */
  isRunning: boolean;
  /** Platform where Steam was found */
  platform: SteamPlatform;
  /** Version of Steam if detectable */
  version?: string | undefined;
  /** List of Steam library folders */
  libraryFolders: string[];
}

/**
 * Information about an installed Steam app/game
 */
export interface SteamApp {
  /** Steam App ID */
  appId: string;
  /** Display name of the app */
  name?: string | undefined;
  /** Installation directory path */
  installDir?: string | undefined;
  /** Size on disk in bytes */
  sizeOnDisk?: number | undefined;
  /** Whether the app is currently installed */
  isInstalled: boolean;
  /** Last updated timestamp */
  lastUpdated?: Date | undefined;
}
