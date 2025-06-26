# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.3](https://github.com/zevnda/steam-locate/compare/v1.0.2...v1.0.3) (2025-06-26)

## [1.0.2] - 2025-06-26

### Changed
- Automated version bump from v1.0.1 to v1.0.2


## [1.0.1] - 2025-06-26

### Changed
- Automated version bump from v1.0.0 to v1.0.1


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-26

### Added

- Initial release of steam-locate package
- Find Steam client installation location on Windows
- Both synchronous and asynchronous APIs
- Check if Steam is currently running
- Custom `SteamNotFoundError` for Steam-specific errors
- TypeScript support with full type definitions
- Comprehensive test suite with >95% coverage
- Windows Registry lookup for Steam installation path
- Fallback to common installation directories
- Process detection using Windows `tasklist` command

### Features

- `findSteamLocation()` - Async Steam location finder
- `findSteamLocationSync()` - Sync Steam location finder
- `isSteamRunning()` - Async Steam process detection
- `isSteamRunningSync()` - Sync Steam process detection
- Full TypeScript definitions
- Zero runtime dependencies (uses only Node.js built-ins)
- Windows-specific implementation optimized for the platform

### Documentation

- Comprehensive README with usage examples
- API documentation with JSDoc comments
- Example usage file
- MIT License
