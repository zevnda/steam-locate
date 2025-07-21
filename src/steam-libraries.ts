import { join, normalize } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Get Steam library folders
 */
export async function getLibraryFolders(steamPath: string): Promise<string[]> {
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
export function getLibraryFoldersSync(steamPath: string): string[] {
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
