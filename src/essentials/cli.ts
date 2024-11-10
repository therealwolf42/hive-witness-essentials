import readline from 'readline-sync';
import { chooseTransactionKey, getNextKey, getWitnessByAccount, log, NULL_KEY, updateWitness, updateWitnessWrapper } from '../utils';
import { config } from '../utils';
import { PublicKey } from 'dhive-reloaded';

export let witnessData = {
  witness: config.get('WITNESS'),
  props: {
    account_creation_fee: '3.000 HIVE',
    maximum_block_size: 65536,
    hbd_interest_rate: 0,
    account_subsidy_budget: 0,
    account_subsidy_decay: 0,
  },
  url: '',
};

let CURRENT_SIGNING_KEY = '';

export const updateKey = async (key: string, node?: string, rotate = false) => {
  let setProperties = false;

  // Get Initial Witness Object
  const res = await getWitnessByAccount(config.get('WITNESS'));
  if (!res) return console.log('Invalid Witness');
  witnessData.props = res.props as any; // TODO
  witnessData.url = res.url;
  CURRENT_SIGNING_KEY = res.signing_key;

  // If key should be rotated
  if (!key && rotate) {
    const next_key = getNextKey(config.get('SIGNING_KEYS'), CURRENT_SIGNING_KEY, true);
    key = next_key.public;
  }

  // If not key has been given without wanting to rotate
  if (!key) return console.log('Invalid Key');

  // Get the private key from either the signing keys or the active key
  let transaction_signing_key = chooseTransactionKey(res.signing_key, config.get('ACTIVE_KEY'), config.get('SIGNING_KEYS'));

  if (!transaction_signing_key) {
    // Request input of active key from user
    transaction_signing_key = requestActiveKey(transaction_signing_key);
    if (!transaction_signing_key) return console.error(`Invalid Signing Key Pairs in config. Or witness is disabled, which requires your private active key.`);
  } else {
    setProperties = transaction_signing_key !== config.get('ACTIVE_KEY');
  }

  // Update witness
  const props: any = { new_signing_key: key };
  await updateWitnessWrapper({
    currentSigningKey: CURRENT_SIGNING_KEY,
    transactionSigningKey: transaction_signing_key,
    props,
    setProperties: setProperties,
    witness: witnessData.witness,
    witnessData,
    log: (msg: string) => console.log(msg),
  });
  return key;
};

export const commandDisable = async (node?: string) => {
  await updateKey(NULL_KEY, node);
  log(`Disabled Witness`);
};

export const commandEnable = async (key?: string, node?: string) => {
  await updateKey(key || '', node);
  log(`Changed key to ${key}`);
};

export const commandRotate = async (node?: string) => {
  const key = await updateKey('', node, true);
  if (key) log(`Changed key to ${key}`);
};

let setProperties = false;
const props: any = {};
export const commandUpdateWitness = async (node?: string) => {
  const res = await getWitnessByAccount(config.get('WITNESS'));
  if (!res) return console.log('Invalid Witness');
  witnessData.props = res.props as any; // TODO
  witnessData.url = res.url;
  CURRENT_SIGNING_KEY = res.signing_key;

  if (!read()) return;

  let transaction_signing_key = chooseTransactionKey(res.signing_key, config.get('ACTIVE_KEY'), config.get('SIGNING_KEYS'));

  if (!transaction_signing_key) {
    transaction_signing_key = requestActiveKey(transaction_signing_key);
    if (!transaction_signing_key) return console.log('Invalid key input. Exiting now.');
  } else {
    setProperties = transaction_signing_key !== config.get('ACTIVE_KEY');
  }

  await updateWitnessWrapper({
    currentSigningKey: res.signing_key,
    transactionSigningKey: transaction_signing_key,
    props,
    setProperties: setProperties,
    witness: witnessData.witness,
    witnessData,
    log: (msg: string) => console.log(msg),
  });
  console.log(`Update was sucessful. Exiting now.`);
};

const read = () => {
  console.log('Initiating CLI Witness Essentials. Leave blank to keep current value.\n');
  const witness_url = readline.question(`witness_url? [${witnessData.url}] : `);
  const inputAccountCreationFee = readline.question(`account_creation_fee? (number only - without STEEM) [${witnessData.props.account_creation_fee}] : `);
  const inputMaximumBlockSize = readline.question(`maximum_block_size? [${witnessData.props.maximum_block_size}] : `);
  const inputHbdInterestRate = readline.question(`hbd_interest_rate? [${witnessData.props.hbd_interest_rate}] : `);
  const inputAccountSubsidyBudget = readline.question(`account_subsidy_budget? [${witnessData.props.account_subsidy_budget}] : `);
  const inputAccountSubsidyDecay = readline.question(`account_subsidy_decay? [${witnessData.props.account_subsidy_decay}] : `);
  const inputNewSigningKey = readline.question(`new_signing_key? [${CURRENT_SIGNING_KEY}] : `);

  if (witness_url) {
    props.url = witnessData.url = witness_url;
  }

  if (inputAccountCreationFee && !isNaN(Number(inputAccountCreationFee))) {
    props.account_creation_fee = witnessData.props.account_creation_fee = `${Number(inputAccountCreationFee).toFixed(3)} STEEM`;
  }
  if (inputMaximumBlockSize && !isNaN(Number(inputMaximumBlockSize))) {
    props.maximum_block_size = witnessData.props.maximum_block_size = Number(inputMaximumBlockSize);
  }

  const hbdInterestRate = Number(inputHbdInterestRate);
  if (inputHbdInterestRate != '' && hbdInterestRate >= 0 && hbdInterestRate !== witnessData.props.hbd_interest_rate && !isNaN(hbdInterestRate)) {
    props.hbd_interest_rate = witnessData.props.hbd_interest_rate = hbdInterestRate;
  }

  const accountSubsidyBudget = Number(inputAccountSubsidyBudget);
  if (inputAccountSubsidyBudget && !isNaN(accountSubsidyBudget)) {
    props.account_subsidy_budget = accountSubsidyBudget;
    setProperties = true;
  }

  const accountSubsidyDecay = Number(inputAccountSubsidyDecay);
  if (inputAccountSubsidyDecay && !isNaN(accountSubsidyDecay)) {
    props.account_subsidy_decay = witnessData.props.account_subsidy_decay = accountSubsidyDecay;
    setProperties = true;
  }

  if (inputNewSigningKey !== '' && PublicKey.fromString(inputNewSigningKey)) {
    props.new_signing_key = inputNewSigningKey;
    setProperties = true;
  }

  if (Object.keys(props).length <= 0) {
    console.log(`\nNothing to be updated`);
    process.exit();
  }

  console.log('Changes:\n----------------\n');
  for (const key in props) {
    console.log(`${key}: ${props[key]}`);
  }

  const b = readline.keyInYN(`\nDo you want to update your witness now?`);
  return b;
};

export const requestActiveKey = (transactionSigningKey: string) => {
  let tries = 0;
  console.error(`Invalid Signing Key Pairs in config and/or missing private active key.`);
  while (tries < 3 && !transactionSigningKey) {
    const key = readline.question(`Please enter your active-key to continue: `);
    if (key) {
      transactionSigningKey = key;
    }
    tries++;
  }
  return transactionSigningKey;
};
