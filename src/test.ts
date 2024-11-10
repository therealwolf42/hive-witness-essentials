// require('dotenv').config();
import * as readline from 'readline-sync';

import { startWatcher } from './essentials/watcher';
import { startPricefeed } from './essentials/pricefeed';

const start = async () => {
  console.log('Initiating Witness Essentials: Pricefeed Test');
  const broadcast = Boolean(readline.keyInYN(`Do you want to broadcast the pricefeed?`));
  await startPricefeed(true, broadcast);

  console.log();
  console.log();
  console.log('Initiating Witness Essentials: Watcher Tests');
  let disable = true;
  const failover = Boolean(readline.keyInYN(`Do you want to mimic missing blocks and test failover scenarios? (This will change your signing-keys)`));
  if (failover) disable = Boolean(readline.keyInYN(`Should the failover test also disable your witness?`));
  const notify = Boolean(readline.keyInYN(`Do you want to test your notifications?`));

  const run = Boolean(readline.keyInYN(`\nRun test with following settings? Failover: ${failover} ${failover ? `(Disable Witness: ${disable})` : ''} - Notifications: ${notify}`));
  if (run) {
    await startWatcher(true, notify, failover, disable);
    console.log('Finished tests');
  }
};

start();
