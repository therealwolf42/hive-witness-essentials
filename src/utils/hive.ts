import { Client, PrivateKey, PublicKey, utils, WitnessUpdateOperation } from '@hiveio/dhive';
import { convertNaiPrecision } from './util';
import { config } from './config';

export let client: Client = new Client(config.get('RPC_NODES'), {
  timeout: 8 * 1000,
  failoverThreshold: 3,
  consoleOnFailover: true,
});

export interface WitnessData {
  witness: string;
  props: Partial<utils.WitnessProps>;
  url: string;
}

export interface WitnessProperties {
  witness: string;
  props: any; //Array<[string, Buffer]>
}

export type UpdateWitnessWrapperProps = {
  witness: string;
  witnessData: WitnessData;
  currentSigningKey: string;
  transactionSigningKey: string;
  props: utils.WitnessProps;
  setProperties?: boolean;
  log?: (msg: string) => void;
};

export const updateWitnessWrapper = async ({ witness, witnessData, currentSigningKey, transactionSigningKey, props, setProperties = false, log }: UpdateWitnessWrapperProps) => {
  let txId: string;
  if (setProperties) {
    txId = await updateWitnessProperties(witness, currentSigningKey, props, transactionSigningKey);
  } else {
    txId = await updateWitness({ signingKey: props.new_signing_key?.toString() ?? '', witnessData, transactionSigningKey });
  }
  log?.(`Broadcasted transaction: https://hivehub.dev/tx/${txId}`);
};

/**
 * Update the witness data
 * @param key Signing Key
 * @param command Whether it is a command which will not trigger alerts
 * @param change_key Is the signing-key being changed?
 */
export const updateWitness = async ({
  signingKey,
  witnessData,
  transactionSigningKey,
  fee = '0.000',
}: {
  signingKey: string;
  witnessData: WitnessData;
  transactionSigningKey: string;
  fee?: string;
}) => {
  witnessData.props = cleanWitnessProps(witnessData.props);
  const op: WitnessUpdateOperation = [
    'witness_update',
    {
      block_signing_key: signingKey,
      fee: `${fee} HIVE`,
      owner: witnessData.witness,
      props: witnessData.props as any, // TODO
      url: witnessData.url,
    },
  ];

  return (await client.broadcast.sendOperations([op], PrivateKey.from(transactionSigningKey))).id;
};

/**
 * Update witness properties with signing-key (NEW IN HF20)
 */
export const updateWitnessProperties = async (owner: string, currentSigningKey: string, props: utils.WitnessProps, transactionSigningKey: string) => {
  props = cleanWitnessProps(props);
  props.key = currentSigningKey;
  const op = utils.buildWitnessUpdateOp(owner, props);
  op[1].props.sort((a, b) => a[0].localeCompare(b[0]));
  return (await client.broadcast.sendOperations([op], PrivateKey.from(transactionSigningKey))).id;
};

export interface ExchangeRate {
  base: {
    amount: string;
    nai: string;
    precision: number;
  };
  quote: {
    amount: string;
    nai: string;
    precision: number;
  };
}

export interface Witness {
  available_witness_account_subsidies: number;
  created: string;
  hardfork_time_vote: string;
  hardfork_version_vote: string;
  hbd_exchange_rate: ExchangeRate;
  id: number;
  last_aslot: number;
  last_confirmed_block_num: number;
  last_hbd_exchange_update: string;
  last_work: string;
  owner: string;
  pow_worker: number;
  props: utils.WitnessProps;
  running_version: string;
  signing_key: string;
  total_missed: number;
  url: string;
  virtual_last_update: string;
  virtual_position: string;
  virtual_scheduled_time: string;
  votes: string;
}

export const getWitnessByAccount = async (witness: string): Promise<Witness | null> => {
  const x = await client.call('database_api', 'find_witnesses', {
    owners: [witness],
  });
  if (x) {
    const witness = x['witnesses'][0];
    const account_creation_fee: any = convertNaiPrecision(x['witnesses'][0].props.account_creation_fee.amount, x['witnesses'][0].props.account_creation_fee.precision);
    witness.props.account_creation_fee = `${account_creation_fee} HIVE`;
    witness.props = cleanWitnessProps(witness.props);
    if (witness.sbd_exchange_rate) {
      witness.hbd_exchange_rate = witness.sbd_interest_rate;
      delete witness.sbd_interest_rate;
    }
    return witness;
  }
  return null;
};

export const isKeyValid = (key: string, key_auths: Array<[string, string]>) => {
  const pub = PublicKey.from(key);
  const filter = key_auths.filter((x) => x[0] === pub.toString());
  return filter.length > 0;
};

export const cleanWitnessProps = (props: any) => {
  if ((props as any).sbd_interest_rate) {
    props.hbd_interest_rate = (props as any).sbd_interest_rate;
    delete (props as any).sbd_interest_rate;
  }
  return props;
};
