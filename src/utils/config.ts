import convict, { Schema } from 'convict';

// Define the configuration schema interface
interface ConfigSchema {
  TEST_MODE: boolean;
  RPC_NODES: string[];
  WITNESS: string;
  ACTIVE_KEY: string;
  SIGNING_KEYS: { public: string; private: string }[];
  PRICEFEED: {
    ENABLED: boolean;
    PEG: number;
    INTERVAL: number;
    EXCHANGES: {
      binance: boolean;
      upbit: boolean;
      probit: boolean;
    };
    CONVERT_USDT_TO_USD: boolean;
    EXCHANGES_USDT: {
      kraken: boolean;
    };
  };
  WATCHER: {
    ENABLED: boolean;
    INTERVAL: number;
    MISSED_BLOCKS_THRESHOLD: number;
    ROTATE_KEYS: boolean;
    ROTATE_ROUNDS: number;
    ALERT_AFTER_EVERY_MISSED: boolean;
  };
  REMOTE: {
    ENABLED: boolean;
  };
  SMS: {
    NEXMO: boolean;
    TWILIO: boolean;
    API_KEY: string;
    API_SECRET: string;
    PHONE_NUMBER: string;
    FROM_NUMBER: string;
  };
  EMAIL: {
    ENABLED: boolean;
    GOOGLE_MAIL_ACCOUNT: string;
    GOOGLE_MAIL_PASSWORD: string;
    EMAIL_RECEIVER: string;
  };
  TELEGRAM: {
    ENABLED: boolean;
    BOT_TOKEN: string;
    PASSWORD: string;
    USER_ID: string;
  };
}

// Define the convict schema based on the interface
const configSchema: Schema<ConfigSchema> = {
  TEST_MODE: {
    doc: 'Test Mode',
    format: Boolean,
    default: false,
    arg: 'test',
  },
  RPC_NODES: {
    doc: 'Array of RPC-Nodes',
    format: Array,
    default: [],
    arg: 'rpc',
  },
  WITNESS: {
    doc: 'Witness Name',
    format: String,
    default: '',
    arg: 'witness',
  },
  ACTIVE_KEY: {
    doc: 'Private active key',
    format: String,
    default: '',
  },
  SIGNING_KEYS: {
    doc: 'Signing key pairs based on public and private',
    format: Array,
    default: [{ public: '', private: '' }],
  },
  PRICEFEED: {
    doc: 'Price Feed Configuration',
    format: Object,
    default: {
      ENABLED: true,
      PEG: 1,
      INTERVAL: 60,
      EXCHANGES: {
        binance: true,
        upbit: true,
        probit: true,
      },
      CONVERT_USDT_TO_USD: true,
      EXCHANGES_USDT: {
        kraken: true,
      },
    },
  },
  WATCHER: {
    doc: 'Watcher Configuration',
    format: Object,
    default: {
      ENABLED: true,
      INTERVAL: 10,
      MISSED_BLOCKS_THRESHOLD: 1,
      ROTATE_KEYS: true,
      ROTATE_ROUNDS: 1,
      ALERT_AFTER_EVERY_MISSED: true,
    },
  },
  REMOTE: {
    doc: 'Remote Configuration',
    format: Object,
    default: {
      ENABLED: true,
    },
  },
  SMS: {
    doc: 'SMS Configuration',
    format: Object,
    default: {
      NEXMO: false,
      TWILIO: false,
      API_KEY: '',
      API_SECRET: '',
      PHONE_NUMBER: '',
      FROM_NUMBER: 'TWILIO ONLY',
    },
  },
  EMAIL: {
    doc: 'Email Configuration',
    format: Object,
    default: {
      ENABLED: false,
      GOOGLE_MAIL_ACCOUNT: '',
      GOOGLE_MAIL_PASSWORD: '',
      EMAIL_RECEIVER: '',
    },
  },
  TELEGRAM: {
    doc: 'Telegram Configuration',
    format: Object,
    default: {
      ENABLED: false,
      BOT_TOKEN: '',
      PASSWORD: '',
      USER_ID: '',
    },
  },
};

// Initialize convict with the schema
export const config = convict<ConfigSchema>(configSchema);

// Load external configuration file if present
config.loadFile('./config/config.json');

// Validate configuration against the schema
config.validate({ allowed: 'strict' });

const log = (...args: any[]) => {
  console.log(`${new Date().toISOString()} - ${args}`);
};

export const checkConfig = async () => {
  try {
    console.log('Checking config');

    const missing = [];

    if (config.get('SIGNING_KEYS').filter((x) => x.private === '').length > 0 && !config.get('ACTIVE_KEY')) {
      console.log(
        `Missing private signing-keys or private active-key. If you don't want to use the private active key, make sure to add all your signing-keys (including your active one) with the correct private signing-key.`,
      );
    }

    if (config.get('SMS').NEXMO || config.get('SMS').TWILIO) {
      const sms = config.get('SMS');
      if (!sms.API_KEY) missing.push('SMS > API_KEY');
      if (!sms.API_SECRET) missing.push('SMS > API_SECRET');
      if (!sms.PHONE_NUMBER) missing.push('SMS > PHONE_NUMBER');
      if (sms.TWILIO && !sms.FROM_NUMBER) missing.push('SMS > FROM_NUMBER');
    }

    if (config.get('EMAIL').ENABLED) {
      const email = config.get('EMAIL');
      if (!email.GOOGLE_MAIL_ACCOUNT) missing.push('EMAIL > GOOGLE_MAIL_ACCOUNT');
      if (!email.GOOGLE_MAIL_PASSWORD) missing.push('EMAIL > GOOGLE_MAIL_PASSWORD');
      if (!email.EMAIL_RECEIVER) missing.push('EMAIL > EMAIL_RECEIVER');
    }

    if (config.get('TELEGRAM').ENABLED) {
      const telegram = config.get('TELEGRAM');
      if (!telegram.BOT_TOKEN) missing.push('TELEGRAM > BOT_TOKEN');
      if (!telegram.USER_ID) missing.push('TELEGRAM > USER_ID');
    }

    if (missing.length > 0) {
      if (missing.length > 0) log(`Missing config variables: ${missing}`);
      process.exit();
    }

    console.log('Check was successful!');
  } catch (e) {
    console.error('check_missing_variables', e);
    log(`Exiting Process.`);
    process.exit(-1);
  }
};
