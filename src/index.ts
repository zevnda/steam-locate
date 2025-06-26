import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join, normalize } from 'path';
import { platform, homedir } from 'os';

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

/**
 * Error thrown when Steam installation cannot be found
 */
export class SteamNotFoundError extends Error {
  constructor(
    message: string = 'Steam installation not found',
    public platform?: string
  ) {
    super(message);
    this.name = 'SteamNotFoundError';
  }
}

/**
 * Error thrown when a Steam app cannot be found
 */
export class SteamAppNotFoundError extends Error {
  constructor(appId: string, message?: string) {
    super(message || `Steam app with ID ${appId} not found`);
    this.name = 'SteamAppNotFoundError';
  }
}

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
      steamPath = normalize(resolve(steamPath));
      libraryFolders = libraryFolders.map((p: string) => normalize(resolve(p)));
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
      steamPath = normalize(resolve(steamPath));
      libraryFolders = libraryFolders.map((p: string) => normalize(resolve(p)));
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
 * Checks if Steam is currently running
 * @returns Promise resolving to true if Steam is running
 */
export async function isSteamRunning(): Promise<boolean> {
  return new Promise(resolve => {
    try {
      const currentPlatform = platform();
      let command: string;

      switch (currentPlatform) {
        case 'win32':
          command = 'tasklist /FI "IMAGENAME eq steam.exe" /FO CSV /NH';
          break;
        case 'darwin':
          command = 'pgrep -f "Steam.app"';
          break;
        case 'linux':
          command = 'pgrep -f steam';
          break;
        default:
          resolve(false);
          return;
      }

      const output = execSync(command, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      });

      if (currentPlatform === 'win32') {
        resolve(output.includes('steam.exe'));
      } else {
        resolve(output.trim().length > 0);
      }
    } catch {
      resolve(false);
    }
  });
}

/**
 * Synchronous version of isSteamRunning
 * @returns true if Steam is running
 */
export function isSteamRunningSync(): boolean {
  try {
    const currentPlatform = platform();
    let command: string;

    switch (currentPlatform) {
      case 'win32':
        command = 'tasklist /FI "IMAGENAME eq steam.exe" /FO CSV /NH';
        break;
      case 'darwin':
        command = 'pgrep -f "Steam.app"';
        break;
      case 'linux':
        command = 'pgrep -f steam';
        break;
      default:
        return false;
    }

    const output = execSync(command, {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000,
    });

    if (currentPlatform === 'win32') {
      return output.includes('steam.exe');
    } else {
      return output.trim().length > 0;
    }
  } catch {
    return false;
  }
}

/**
 * Finds Steam installation path by checking platform-specific locations
 */
async function findSteamPath(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const path = findSteamPathSync();
      resolve(path);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Synchronous Steam path finder for all platforms
 */
function findSteamPathSync(): string {
  const currentPlatform = platform();

  switch (currentPlatform) {
    case 'win32':
      return findSteamPathWindows();
    case 'darwin':
      return findSteamPathMacOS();
    case 'linux':
      return findSteamPathLinux();
    default:
      throw new SteamNotFoundError(`Unsupported platform: ${currentPlatform}`, currentPlatform);
  }
}

/**
 * Find Steam on Windows using registry and common paths
 */
function findSteamPathWindows(): string {
  // Try reading from Windows Registry first
  try {
    const regOutput = execSync(
      'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath 2>nul || reg query "HKLM\\Software\\Valve\\Steam" /v InstallPath 2>nul',
      { encoding: 'utf8', windowsHide: true, timeout: 5000 }
    );

    const pathMatch = regOutput.match(/(?:SteamPath|InstallPath)\s+REG_SZ\s+(.+)/);
    if (pathMatch && pathMatch[1]) {
      let steamPath = pathMatch[1].trim().replace(/\\\\/g, '\\');
      steamPath = normalize(resolve(steamPath));
      if (existsSync(steamPath) && existsSync(resolve(steamPath, 'steam.exe'))) {
        return steamPath;
      }
    }
  } catch {
    // Registry lookup failed, continue to other methods
  }

  // Try common installation locations
  const commonPaths = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    resolve(process.env.LOCALAPPDATA || '', 'Steam'),
    resolve(process.env.APPDATA || '', 'Steam'),
  ];

  for (let path of commonPaths) {
    path = normalize(resolve(path));
    if (existsSync(path) && existsSync(resolve(path, 'steam.exe'))) {
      return path;
    }
  }

  throw new SteamNotFoundError('Could not locate Steam installation on Windows');
}

/**
 * Find Steam on macOS
 */
function findSteamPathMacOS(): string {
  const commonPaths = [
    '/Applications/Steam.app/Contents/MacOS',
    resolve(homedir(), 'Applications/Steam.app/Contents/MacOS'),
    '/usr/local/bin/steam',
    '/opt/homebrew/bin/steam',
  ];

  for (const path of commonPaths) {
    if (existsSync(path)) {
      // For .app bundles, check for the Steam executable
      if (path.includes('Steam.app')) {
        const steamExecutable = join(path, 'Steam');
        if (existsSync(steamExecutable)) {
          return path;
        }
      } else if (existsSync(path)) {
        return path;
      }
    }
  }

  throw new SteamNotFoundError('Could not locate Steam installation on macOS');
}

/**
 * Find Steam on Linux
 */
function findSteamPathLinux(): string {
  const commonPaths = [
    '/usr/bin/steam',
    '/usr/local/bin/steam',
    '/opt/steam',
    resolve(homedir(), '.steam/steam'),
    resolve(homedir(), '.local/share/Steam'),
    '/usr/games/steam',
    '/snap/steam/current',
  ];

  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Try to find via which command
  try {
    const whichOutput = execSync('which steam', { encoding: 'utf8', timeout: 5000 });
    const steamPath = whichOutput.trim();
    if (steamPath && existsSync(steamPath)) {
      return steamPath;
    }
  } catch {
    // which command failed
  }

  throw new SteamNotFoundError('Could not locate Steam installation on Linux');
}

/**
 * Get Steam version from installation
 */
async function getSteamVersion(steamPath: string): Promise<string | undefined> {
  return new Promise(resolve => {
    try {
      const version = getSteamVersionSync(steamPath);
      resolve(version);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Synchronous version of getSteamVersion
 */
function getSteamVersionSync(steamPath: string): string | undefined {
  try {
    const currentPlatform = platform();

    if (currentPlatform === 'win32') {
      // Try to read version from steam.exe
      const steamExePath = join(steamPath, 'steam.exe');
      if (existsSync(steamExePath)) {
        try {
          const output = execSync(
            `powershell -Command "(Get-Item '${steamExePath}').VersionInfo.FileVersion"`,
            {
              encoding: 'utf8',
              timeout: 5000,
              windowsHide: true,
            }
          );
          return output.trim();
        } catch {
          // Fall back to package info
        }
      }
    }

    // Try to read from package/version files
    const versionPaths = [
      join(steamPath, 'package', 'steam_client_win32'),
      join(steamPath, 'steam_client_win32'),
      join(steamPath, 'version.txt'),
      join(steamPath, 'package', 'version.txt'),
    ];

    for (const versionPath of versionPaths) {
      if (existsSync(versionPath)) {
        try {
          const content = readFileSync(versionPath, 'utf8').trim();
          if (content && content.length > 0) {
            return content;
          }
        } catch {
          continue;
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get Steam library folders
 */
async function getLibraryFolders(steamPath: string): Promise<string[]> {
  return new Promise(resolve => {
    try {
      const folders = getLibraryFoldersSync(steamPath);
      resolve(folders);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Synchronous version of getLibraryFolders
 */
function getLibraryFoldersSync(steamPath: string): string[] {
  try {
    const libraryFolders: string[] = [];

    // Add main Steam apps folder
    const mainAppsFolder = join(steamPath, 'steamapps');
    if (existsSync(mainAppsFolder)) {
      libraryFolders.push(normalize(mainAppsFolder));
    }

    // Read library folders VDF file
    const libraryFoldersVdf = join(steamPath, 'steamapps', 'libraryfolders.vdf');
    if (existsSync(libraryFoldersVdf)) {
      try {
        const content = readFileSync(libraryFoldersVdf, 'utf8');

        // Parse VDF format to find library paths
        const pathMatches = content.match(/"path"\s*"([^"]+)"/g);
        if (pathMatches) {
          for (const match of pathMatches) {
            const pathMatch = match.match(/"path"\s*"([^"]+)"/);
            if (pathMatch && pathMatch[1]) {
              const libraryPath = normalize(join(pathMatch[1].replace(/\\\\/g, '\\'), 'steamapps'));
              if (existsSync(libraryPath) && !libraryFolders.includes(libraryPath)) {
                libraryFolders.push(libraryPath);
              }
            }
          }
        }
      } catch {
        // VDF parsing failed, return main folder only
      }
    }

    return libraryFolders;
  } catch {
    return [];
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

/**
 * Get installed apps from library folders
 */
async function getInstalledSteamAppsFromLibraries(libraryFolders: string[]): Promise<SteamApp[]> {
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
function getInstalledSteamAppsFromLibrariesSync(libraryFolders: string[]): SteamApp[] {
  const apps: SteamApp[] = [];

  for (const libraryFolder of libraryFolders) {
    try {
      const files = readdirSync(libraryFolder);

      for (const file of files) {
        if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
          try {
            const appId = file.match(/appmanifest_(\d+)\.acf/)?.[1];
            if (appId) {
              const app = findSteamAppInLibrariesSync(appId, [libraryFolder], '');
              if (app.isInstalled) {
                apps.push(app);
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

/**
 * Find Steam app in library folders
 */
function findSteamAppInLibraries(
  appId: string,
  libraryFolders: string[],
  steamPath: string
): SteamApp {
  return findSteamAppInLibrariesSync(appId, libraryFolders, steamPath);
}

/**
 * Synchronous version of findSteamAppInLibraries
 */
function findSteamAppInLibrariesSync(
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

// Default export for convenience
export default findSteamLocation;
