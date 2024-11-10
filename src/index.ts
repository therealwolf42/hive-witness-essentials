import { commandEnable, commandDisable, commandRotate, commandUpdateWitness } from './essentials/cli';
import { startPricefeed } from './essentials/pricefeed';
import { startRemote } from './essentials/remote';
import { startWatcher } from './essentials/watcher';
import { checkConfig, config } from './utils';

console.log('Initiating Witness Essentials.');
await checkConfig();

let essentials = process.argv[2]?.split(',');

if (!essentials || essentials.length <= 0) {
  essentials = [];
  const isWatcherEnabled = config.get('WATCHER.ENABLED');
  if (isWatcherEnabled) essentials.push('watcher');
  const isRemoteEnabled = config.get('REMOTE.ENABLED');
  if (isRemoteEnabled) essentials.push('remote');
  const isPricefeedEnabled = config.get('PRICEFEED.ENABLED');
  if (isPricefeedEnabled) essentials.push('pricefeed');
}

const startEssentials = async () => {
  const starters = {
    watcher: startWatcher,
    remote: startRemote,
    pricefeed: startPricefeed,
  };

  for (const essential of essentials) {
    if (essential in starters) {
      starters[essential as keyof typeof starters]();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

// Start tools sequentially
startEssentials();

// Handle CLI separately since it doesn't need the delay
if (essentials?.includes('cli')) {
  const command = process.argv[3];
  const key = process.argv[4];
  const node = process.argv[5];
  if (command === 'enable') {
    await commandEnable(key, node);
  } else if (command === 'update') {
    await commandUpdateWitness(key || node);
  } else if (command === 'rotate') {
    await commandRotate(key || node);
  } else if (command === 'disable') {
    await commandDisable(key || node);
  } else {
    console.log('Invalid command');
  }
}
