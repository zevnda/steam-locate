import {
  findSteamLocation,
  findSteamLocationSync,
  isSteamRunning,
  findSteamApp,
  getInstalledSteamApps,
  SteamNotFoundError,
  SteamAppNotFoundError,
} from '../src/index';

// Mock child_process module
jest.mock('child_process');
jest.mock('fs');
jest.mock('os');

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { platform, homedir } from 'os';

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockPlatform = platform as jest.MockedFunction<typeof platform>;
const mockHomedir = homedir as jest.MockedFunction<typeof homedir>;

describe('steam-locate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock platform to be Windows by default
    mockPlatform.mockReturnValue('win32');
    mockHomedir.mockReturnValue('/home/user');
  });

  describe('findSteamLocation', () => {
    it('should find Steam location with all information on Windows', async () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';
      mockExecSync
        .mockReturnValueOnce(`SteamPath    REG_SZ    ${steamPath}`)
        .mockReturnValueOnce('INFO: No tasks are running which match the specified criteria.')
        .mockReturnValueOnce('3.4.0.0');

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        '"libraryfolders"\n{\n\t"0"\n\t{\n\t\t"path"\t\t"C:\\\\Program Files (x86)\\\\Steam"\n\t}\n}'
      );

      const result = await findSteamLocation();

      expect(result.path).toBe(steamPath);
      expect(result.platform).toBe('win32');
      expect(result.isRunning).toBe(false);
      expect(result.libraryFolders).toEqual([`${steamPath}\\steamapps`]);
    });

    it('should find Steam on macOS', async () => {
      mockPlatform.mockReturnValue('darwin');
      const steamPath = '/Applications/Steam.app/Contents/MacOS';

      mockExecSync.mockReturnValue('');
      mockExistsSync
        .mockReturnValueOnce(true) // Steam.app exists
        .mockReturnValueOnce(true) // Steam executable exists
        .mockReturnValueOnce(true); // steamapps folder exists

      mockReadFileSync.mockReturnValue('');

      const result = await findSteamLocation();

      expect(result.path).toBe(steamPath);
      expect(result.platform).toBe('darwin');
    });

    it('should find Steam on Linux', async () => {
      mockPlatform.mockReturnValue('linux');
      const steamPath = '/usr/bin/steam';

      mockExecSync
        .mockReturnValueOnce('') // pgrep for running check
        .mockReturnValueOnce(steamPath); // which steam

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('');

      const result = await findSteamLocation();

      expect(result.path).toBe(steamPath);
      expect(result.platform).toBe('linux');
    });

    it('should throw error on unsupported platform', async () => {
      mockPlatform.mockReturnValue('aix' as NodeJS.Platform);

      await expect(findSteamLocation()).rejects.toThrow(SteamNotFoundError);
      await expect(findSteamLocation()).rejects.toThrow('Unsupported platform: aix');
    });

    it('should handle Steam not found gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      mockExistsSync.mockReturnValue(false);

      await expect(findSteamLocation()).rejects.toThrow(SteamNotFoundError);
    });
  });

  describe('findSteamLocationSync', () => {
    it('should work synchronously', () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';
      mockExecSync
        .mockReturnValueOnce(`SteamPath    REG_SZ    ${steamPath}`)
        .mockReturnValueOnce('INFO: No tasks are running which match the specified criteria.')
        .mockReturnValueOnce('3.4.0.0');

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('');

      const result = findSteamLocationSync();

      expect(result.path).toBe(steamPath);
      expect(result.platform).toBe('win32');
    });
  });

  describe('isSteamRunning', () => {
    it('should detect Steam running on Windows', async () => {
      mockExecSync.mockReturnValue('"steam.exe","1234","Console","1","123,456 K"');

      const result = await isSteamRunning();

      expect(result).toBe(true);
    });

    it('should detect Steam running on macOS', async () => {
      mockPlatform.mockReturnValue('darwin');
      mockExecSync.mockReturnValue('1234');

      const result = await isSteamRunning();

      expect(result).toBe(true);
    });

    it('should detect Steam running on Linux', async () => {
      mockPlatform.mockReturnValue('linux');
      mockExecSync.mockReturnValue('1234\n5678');

      const result = await isSteamRunning();

      expect(result).toBe(true);
    });

    it('should return false when Steam is not running', async () => {
      mockExecSync.mockReturnValue(
        'INFO: No tasks are running which match the specified criteria.'
      );

      const result = await isSteamRunning();

      expect(result).toBe(false);
    });

    it('should return false on unsupported platform', async () => {
      mockPlatform.mockReturnValue('aix' as NodeJS.Platform);

      const result = await isSteamRunning();

      expect(result).toBe(false);
    });
  });

  describe('findSteamApp', () => {
    it('should find an installed Steam app', async () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';
      const appId = '440'; // Team Fortress 2

      mockExecSync.mockReturnValue(`SteamPath    REG_SZ    ${steamPath}`);
      mockExistsSync
        .mockReturnValueOnce(true) // Steam path exists
        .mockReturnValueOnce(true) // steam.exe exists
        .mockReturnValueOnce(true) // steamapps folder exists
        .mockReturnValueOnce(true) // app manifest exists
        .mockReturnValueOnce(true); // game install dir exists

      mockReadFileSync
        .mockReturnValueOnce('') // library folders
        .mockReturnValueOnce(
          '"name"\t\t"Team Fortress 2"\n"installdir"\t\t"Team Fortress 2"\n"SizeOnDisk"\t\t"15000000000"\n"LastUpdated"\t\t"1640995200"'
        );

      const result = await findSteamApp(appId);

      expect(result.appId).toBe(appId);
      expect(result.name).toBe('Team Fortress 2');
      expect(result.isInstalled).toBe(true);
      expect(result.sizeOnDisk).toBe(15000000000);
    });

    it('should throw SteamAppNotFoundError when app manifest not found in any library', async () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';
      const appId = '999999';

      // Mock file system calls - the steamapps folder exists but the manifest file doesn't
      mockExistsSync
        .mockReturnValueOnce(true) // steamapps folder exists (for getLibraryFoldersSync)
        .mockReturnValueOnce(false) // libraryfolders.vdf doesn't exist
        .mockReturnValueOnce(false); // app manifest doesn't exist

      // Mock empty library folders VDF content
      mockReadFileSync.mockReturnValue('');

      await expect(findSteamApp(appId, steamPath)).rejects.toThrow(SteamAppNotFoundError);
    });
  });

  describe('getInstalledSteamApps', () => {
    it('should return list of installed apps', async () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';

      mockExecSync.mockReturnValue(`SteamPath    REG_SZ    ${steamPath}`);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockReturnValueOnce('') // library folders
        .mockReturnValueOnce('"name"\t\t"Team Fortress 2"\n"installdir"\t\t"Team Fortress 2"')
        .mockReturnValueOnce(
          '"name"\t\t"Counter-Strike 2"\n"installdir"\t\t"Counter-Strike Global Offensive"'
        );

      (mockReaddirSync as jest.Mock).mockReturnValue([
        'appmanifest_440.acf',
        'appmanifest_730.acf',
      ]);

      const result = await getInstalledSteamApps();

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Team Fortress 2');
      expect(result[1]?.name).toBe('Counter-Strike 2');
    });

    it('should handle empty app list gracefully', async () => {
      const steamPath = 'C:\\Program Files (x86)\\Steam';

      mockExecSync.mockReturnValue(`SteamPath    REG_SZ    ${steamPath}`);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('');
      mockReaddirSync.mockReturnValue([]);

      const result = await getInstalledSteamApps();

      expect(result).toEqual([]);
    });
  });

  describe('Error classes', () => {
    it('should create SteamNotFoundError with platform info', () => {
      const error = new SteamNotFoundError('Custom message', 'win32');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SteamNotFoundError');
      expect(error.message).toBe('Custom message');
      expect(error.platform).toBe('win32');
    });

    it('should create SteamAppNotFoundError with app ID', () => {
      const error = new SteamAppNotFoundError('440', 'Custom message');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SteamAppNotFoundError');
      expect(error.message).toBe('Custom message');
    });
  });
});
