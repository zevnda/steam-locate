import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { platform } from 'os';
import { execSync } from 'child_process';

/**
 * Get Steam version from installation
 */
export async function getSteamVersion(steamPath: string): Promise<string | undefined> {
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
export function getSteamVersionSync(steamPath: string): string | undefined {
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
