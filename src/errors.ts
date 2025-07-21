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
