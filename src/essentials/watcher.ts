import {
  config,
  NULL_KEY,
  chooseTransactionKey,
  getNextKey,
  getWitnessByAccount,
  orderKeys,
  sendEmail,
  sendSms,
  sendTelegram,
  timeout,
  updateWitnessWrapper,
  Witness,
} from '../utils';
import retry from 'p-retry';

export let ORIG_KEY = '';
export let TRANSACTION_SIGNING_KEY = '';
export let USED_SIGNING_KEYS: Array<string> = [];
export let CURRENT_BACKUP_KEY: { public: string; private: string } = {
  public: 'STM1111111111111111111111111111111114T1Anm',
  private: '',
};

export let MISSED_BLOCK_FLAG = false;
export let last_confirmed_block_num = 0;

export let rotation_round = 0;

export let start_total_missed = 99999;
export let current_total_missed = 99999;
export let last_missed = new Date();

export let witnessData = {
  witness: config.get('WITNESS'),
  props: {
    account_creation_fee: '3.000 HIVE',
    maximum_block_size: 65536,
    hbd_interest_rate: 0,
  },
  url: '',
};

export let telegramData = {
  botToken: config.get('TELEGRAM.BOT_TOKEN'),
  userId: config.get('TELEGRAM.USER_ID'),
};

export let mailData = {
  mailAccount: config.get('EMAIL.GOOGLE_MAIL_ACCOUNT'),
  mailPassword: config.get('EMAIL.GOOGLE_MAIL_PASSWORD'),
  to: config.get('EMAIL.EMAIL_RECEIVER'),
};

export let providerData = {
  apiKey: config.get('SMS.API_KEY'),
  apiSecret: config.get('SMS.API_SECRET'),
  phoneNumber: config.get('SMS.PHONE_NUMBER'),
  fromNumber: config.get('SMS.FROM_NUMBER'),
};
let test_block_count = 1;

export const startWatcher = async (IS_TESTING = false, NOTIFY = true, FAILOVER = true, DISABLE = true) => {
  try {
    while (true) {
      const b = await watchWitness(IS_TESTING, NOTIFY, FAILOVER, DISABLE);

      // If we're testing, leave once disabled
      if (b && IS_TESTING) {
        return;
      }

      await timeout(IS_TESTING ? 2 : Number(config.get('WATCHER.INTERVAL') || '10') * 60);
    }
  } catch (e) {
    console.error('start', e);
    await startWatcher(IS_TESTING, NOTIFY, FAILOVER);
  }
};

const watchWitness = async (IS_TESTING: boolean, NOTIFY: boolean, FAILOVER: boolean, DISABLE: boolean) => {
  try {
    await initiate_watcher(IS_TESTING);

    const witness = await retry(async () => getWitnessByAccount(witnessData.witness), { retries: 3 });

    // Prevent API hickups from triggering failover
    if (!witness?.owner) {
      log(`Received invalid witness object. Skipping round.`);
      return false;
    }

    // If we're testing, add one missed block
    if (IS_TESTING) {
      log('TEST-MODE: Adding an imaginary missed block');
      witness.total_missed += test_block_count;
      test_block_count += 1;
    }

    // Was witness manually disabled?
    if (witness.signing_key === NULL_KEY) {
      log('Witness is disabled - skipping checking.');
      return;
    } else if (witness.signing_key === CURRENT_BACKUP_KEY.public && !config.get('TEST_MODE') && !IS_TESTING) {
      // Was the current signing key manually changed?
      logNT('Manually changed signing key - rotating');
      updateSigningKeys();
    }

    // If a block has been missed before, but witness node has recovered and signed a new block
    if (MISSED_BLOCK_FLAG && witness.last_confirmed_block_num > last_confirmed_block_num) {
      log(`Recovered on block ${witness.last_confirmed_block_num}`);
      await send_alerts(
        `Witness ${witnessData.witness}: Recovered on block ${witness.last_confirmed_block_num}`,
        `Witness ${witnessData.witness}: Recovered on block ${witness.last_confirmed_block_num}`,
      );
      start_total_missed = current_total_missed = witness.total_missed;
      rotation_round = 0;
      MISSED_BLOCK_FLAG = false;
    }

    // Update the last_confirmed_block_num
    last_confirmed_block_num = witness.last_confirmed_block_num;

    // New missed block?
    if (witness.total_missed > current_total_missed) {
      return await handleMissedBlock(witness, IS_TESTING, NOTIFY, FAILOVER, DISABLE);
    }

    return false;
  } catch (error) {
    console.error('watchWitness', error);
    await timeout(5);
    await watchWitness(IS_TESTING, NOTIFY, FAILOVER, DISABLE);
  }
};

const initiate_watcher = async (IS_TESTING: boolean) => {
  if (start_total_missed === 99999) {
    console.log('\n----------------------------\n');
    logNT(`Starting Witness Watcher`);

    const witness = await getWitnessByAccount(witnessData.witness);
    if (witness) {
      setInitialWitness(witness);

      if (IS_TESTING && Number(config.get('WATCHER.ROTATE_ROUNDS')) <= 0) {
        logNT('Setting KEY ROTATION to 2 for TEST MODE');
        config.set('ROTATE_ROUNDS', 1);
      }

      logNT(`Witness: ${witnessData.witness} | Current Total Missed Blocks: ${start_total_missed} | Threshold: ${config.get('WATCHER.MISSED_BLOCKS_THRESHOLD')}`);
      logNT(
        `TELEGRAM: ${config.get('TELEGRAM.ENABLED') ? 'ENABLED' : 'DISABLED'} | EMAIL: ${config.get('EMAIL.ENABLED') ? 'ENABLED' : 'DISABLED'} | SMS: ${
          config.get('SMS.NEXMO') || config.get('SMS.TWILIO') ? 'ENABLED' : 'DISABLED'
        }`,
      );
      logNT(
        `Signing Keys: ${config
          .get('SIGNING_KEYS')
          .map((x) => x.public)
          .join(', ')}`,
      );
      logNT(`Next Backup Key: ${CURRENT_BACKUP_KEY.public !== NULL_KEY ? CURRENT_BACKUP_KEY.public : `No Backup Keys - Disabling Witness Directly`}`);
      logNT(
        `KEY ROTATION: ${
          config.get('WATCHER.ROTATE_KEYS') && config.get('WATCHER.ROTATE_ROUNDS') !== 0
            ? `ENABLED (${config.get('WATCHER.ROTATE_ROUNDS') > -1 ? config.get('WATCHER.ROTATE_ROUNDS') : 'INFINITE'} ROUNDS)`
            : `DISABLED`
        } ${IS_TESTING ? 'Test-Mode: ENABLED' : ''}`,
      );
      console.log('\n----------------------------\n');
      log('Witness Watcher: Active\n');
    }
  }
};

const handleMissedBlock = async (witness: Witness, IS_TESTING: boolean, NOTIFY: boolean, FAILOVER: boolean, DISABLE: boolean) => {
  MISSED_BLOCK_FLAG = true;
  const missed_since_start = witness.total_missed - start_total_missed;

  log('[ DANGER ] Missed a Block!');

  // Send notifications if missed block should always be alerted or if the missed block threshold has been reached
  if (NOTIFY && (config.get('WATCHER.ALERT_AFTER_EVERY_MISSED') || missed_since_start > config.get('WATCHER.MISSED_BLOCKS_THRESHOLD'))) {
    await send_alerts(
      `Witness ${witnessData.witness}: Missed Block!`,
      `Witness ${witnessData.witness}: Missed Block!${missed_since_start < config.get('WATCHER.MISSED_BLOCKS_THRESHOLD') ? ` ${missed_since_start} more until failover.` : ''}`,
    );
  } else {
    log(!NOTIFY ? 'TEST-MODE: Would have send notifications for missed block' : `Didn't send notification due to not reaching missed block threshold`);
  }

  // Is the current missed count >= than what the threshold is?
  if (missed_since_start >= config.get('WATCHER.MISSED_BLOCKS_THRESHOLD')) {
    // No Backupkey? Set key for upcoming update to null-key!
    if (!CURRENT_BACKUP_KEY.public) {
      CURRENT_BACKUP_KEY.public = NULL_KEY;
    }

    // If testing and not allow disabling of witness, then return true to exit program
    if (CURRENT_BACKUP_KEY.public === NULL_KEY && IS_TESTING && !DISABLE) {
      log('TEST-MODE: Would have disabled witness');
      return true;
    }

    // Failover to node and choose correct tx signing key
    if (FAILOVER && (!config.get('TEST_MODE') || IS_TESTING)) {
      const transaction_key = chooseTransactionKey(witness.signing_key, config.get('ACTIVE_KEY'), config.get('SIGNING_KEYS'));
      const props: any = { new_signing_key: CURRENT_BACKUP_KEY.public };
      await updateWitnessWrapper({
        witness: witness.owner,
        witnessData,
        currentSigningKey: witness.signing_key,
        transactionSigningKey: transaction_key,
        props,
        setProperties: Boolean(transaction_key !== config.get('ACTIVE_KEY')),
        log,
      });
    } else {
      log(`TEST-MODE: Would have updated witness to ${CURRENT_BACKUP_KEY.public}`);
    }

    // Send notifications
    if (NOTIFY) {
      await send_alerts(`Witness ${witnessData.witness}: Updated Signing Key`, `Witness ${witnessData.witness}: Updated Signing Key to ${CURRENT_BACKUP_KEY.public}`);
    } else {
      log(`TEST-MODE: Would have send notifications for updated signing key`);
    }

    start_total_missed = current_total_missed = witness.total_missed;

    // If keys have been rotated, internal keys have to be rotated as well!
    if (CURRENT_BACKUP_KEY.public !== NULL_KEY) {
      updateSigningKeys();
    } else if (CURRENT_BACKUP_KEY.public === NULL_KEY && IS_TESTING) {
      return true;
    }
  } else {
    current_total_missed = witness.total_missed;
  }

  // Empty Line
  console.log();
};

/**
 * Send all selected alert methods inside the config
 * @param subject The subject of the alert
 * @param message The message of the alert
 */
export const send_alerts = async (subject: string, message: string) => {
  try {
    if (config.get('SMS.NEXMO') || config.get('SMS.TWILIO')) {
      log(`Sending SMS: ${subject}`);
      await sendSms(`${subject}`, message, config.get('SMS.NEXMO') ? 'nexmo' : 'twilio', providerData);
    }
    if (config.get('EMAIL.ENABLED')) {
      log(`Sending Email: ${subject}`);
      await sendEmail(`${subject}`, message, mailData);
    }
    if (config.get('TELEGRAM.ENABLED')) {
      log(`Sending Telegram: ${subject}`);
      await sendTelegram(message, telegramData);
    }
  } catch (error) {
    console.error('send_alert', error);
  }
};

/**
 * Rotate through signing-keys, customized for witness-watcher. Remote uses a simpler version.
 */
export const updateSigningKeys = () => {
  USED_SIGNING_KEYS.push(CURRENT_BACKUP_KEY.public);
  const index = config.get('SIGNING_KEYS').findIndex((x) => x.public === CURRENT_BACKUP_KEY.public);

  if (index >= config.get('SIGNING_KEYS').length - 1) {
    if (config.get('WATCHER.ROTATE_KEYS') && (config.get('WATCHER.ROTATE_ROUNDS') > rotation_round || config.get('WATCHER.ROTATE_ROUNDS') === -1)) {
      USED_SIGNING_KEYS = [];
      CURRENT_BACKUP_KEY = config.get('SIGNING_KEYS')[0]!;
      rotation_round += 1;
    } else {
      CURRENT_BACKUP_KEY = { public: NULL_KEY, private: '' };
    }
  } else {
    CURRENT_BACKUP_KEY = config.get('SIGNING_KEYS')[index + 1]!;
  }
};

export const setInitialWitness = (x: any) => {
  start_total_missed = x.total_missed;
  current_total_missed = start_total_missed;
  witnessData.url = x.url;
  witnessData.props = x.props;
  last_confirmed_block_num = x.last_confirmed_block_num;

  if (config.get('SIGNING_KEYS').filter((y) => y.public === x.signing_key).length <= 0) {
    config.set('SIGNING_KEYS', [...config.get('SIGNING_KEYS'), { public: x.signing_key, private: '' }]);
  }
  config.set('SIGNING_KEYS', orderKeys(config.get('SIGNING_KEYS'), x.signing_key));
  USED_SIGNING_KEYS = [x.signing_key];
  CURRENT_BACKUP_KEY = getNextKey(config.get('SIGNING_KEYS'), x.signing_key, true);
};

export const setTransactionSigningKey = () => {
  TRANSACTION_SIGNING_KEY = '';
};

const log = (...args: any[]): void => console.log(`[WATCHER] ${new Date().toISOString()} - ${args}`);
const logNT = (...args: any[]): void => console.log(`[WATCHER] ${args}`);
