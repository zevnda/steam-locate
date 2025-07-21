import { execSync } from 'child_process';
import { platform } from 'os';

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
