import { platform, homedir } from 'os';
import { existsSync } from 'fs';
import { resolve, normalize } from 'path';
import { execSync } from 'child_process';
import { SteamNotFoundError } from './errors';

/**
 * Finds Steam installation path by checking platform-specific locations
 */
export async function findSteamPath(): Promise<string> {
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
export function findSteamPathSync(): string {
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
      let steamPath = pathMatch[1].trim().replace(/\\/g, '\\');
      steamPath = normalize(steamPath);
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
    path = normalize(path);
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
  const steamPath = resolve(homedir(), 'Library/Application Support/Steam');
  if (existsSync(steamPath)) {
    return steamPath;
  }
  throw new SteamNotFoundError('Could not locate Steam installation on macOS');
}

/**
 * Find Steam on Linux
 */
function findSteamPathLinux(): string {
  const home = homedir();
  const snapDir = process.env.SNAP_USER_DATA
    ? resolve(process.env.SNAP_USER_DATA)
    : resolve(home, 'snap');
  const candidatePaths = [
    resolve(home, '.var/app/com.valvesoftware.Steam/.local/share/Steam'),
    resolve(home, '.var/app/com.valvesoftware.Steam/.steam/steam'),
    resolve(home, '.var/app/com.valvesoftware.Steam/.steam/root'),
    resolve(home, '.local/share/Steam'),
    resolve(home, '.steam/steam'),
    resolve(home, '.steam/root'),
    resolve(home, '.steam/debian-installation'),
    resolve(snapDir, 'steam/common/.local/share/Steam'),
    resolve(snapDir, 'steam/common/.steam/steam'),
    resolve(snapDir, 'steam/common/.steam/root'),
  ];
  const seen = new Set<string>();
  for (const path of candidatePaths) {
    if (!seen.has(path) && existsSync(path)) {
      seen.add(path);
      return path;
    }
  }
  throw new SteamNotFoundError('Could not locate Steam installation on Linux');
}
