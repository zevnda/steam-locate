/**
 * Example usage of steam-locate package
 * 
 * This example demonstrates how to use the steam-locate package
 * to find Steam installation and check if it's running.
 */

import { findSteamLocation, findSteamLocationSync, isSteamRunning, SteamNotFoundError } from './src/index';

async function asyncExample() {
  console.log('--- Async Example ---');
  
  try {
    // Find Steam location asynchronously
    const steamInfo = await findSteamLocation();
    console.log('✅ Steam found!');
    console.log('📁 Installation path:', steamInfo.path);
    console.log('🔄 Steam is running:', steamInfo.isRunning);
    
    // Check if Steam is running separately
    const isRunning = await isSteamRunning();
    console.log('🔍 Steam running (separate check):', isRunning);
    
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      console.log('❌ Steam installation not found');
    } else {
      console.error('💥 Error:', (error as Error).message);
    }
  }
}

function syncExample() {
  console.log('\n--- Sync Example ---');
  
  try {
    // Find Steam location synchronously
    const steamInfo = findSteamLocationSync();
    console.log('✅ Steam found!');
    console.log('📁 Installation path:', steamInfo.path);
    console.log('🔄 Steam is running:', steamInfo.isRunning);
    
  } catch (error) {
    if (error instanceof SteamNotFoundError) {
      console.log('❌ Steam installation not found');
    } else {
      console.error('💥 Error:', (error as Error).message);
    }
  }
}

// Run examples
async function main() {
  console.log('🎮 Steam Location Finder Example\n');
  
  // Check platform
  if (process.platform !== 'win32') {
    console.log('⚠️  This package only works on Windows');
    return;
  }
  
  await asyncExample();
  syncExample();
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { asyncExample, syncExample };
