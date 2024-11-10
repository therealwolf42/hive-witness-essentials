import { Context, session, Telegraf } from 'telegraf';
import retry from 'p-retry';
import { Update } from 'telegraf/types';
import {
  chooseTransactionKey,
  getNextKey,
  getWitnessByAccount,
  updateWitnessWrapper as coreUpdateWitnessWrapper,
  orderKeys,
  UpdateWitnessWrapperProps,
  WitnessData,
} from '../utils';
import { NULL_KEY } from '../utils/constants';
import { config } from '../utils';

interface TelegrafContext<U extends Update = Update> extends Context<U> {
  session: {
    command: string;
    payload: string;
  };
}

const bot = new Telegraf<TelegrafContext>(config.get('TELEGRAM.BOT_TOKEN'));

// Session is being set which works inbetween commands
bot.use(session({ defaultSession: () => ({ command: '', payload: '' }) }));

export let witnessData: WitnessData = {
  witness: config.get('WITNESS'),
  props: {
    account_creation_fee: '0.100 HIVE',
    maximum_block_size: 65536,
    hbd_interest_rate: 0,
  },
  url: 'https://hive.blog',
};

export const startRemote = async () => {
  try {
    console.log('\n----------------------------\n');
    logNT('Starting Remote Control');
    let witness = await getWitness();
    if (!witness) {
      return console.error('Failed to fetch witness data. Please try again later.');
    }
    setInitialWitness(witness);
    log('Witness Remote Control: Active\n');

    // Initial Startup when the bot is opened for the first time in telegram
    bot.start((ctx) =>
      ctx.reply(
        `Welcome to your witness remote control. Use /enable <key> to switch to a different key, /rotate to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your .env file.`,
      ),
    );

    // Command: /help
    try {
      bot.help((ctx) =>
        ctx.reply(
          `Use /enable <key> to switch to a different key, /rotate to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your config.`,
        ),
      );
    } catch (error) {
      console.error(error);
    }

    // Command for confirming password
    bot.command('confirm', async (ctx) => {
      // Gets the parameter from the ctx object
      const text = ctx.message.text;
      const param = text.substring(8, text.length).trim();

      await ctx.deleteMessage();

      // Check if the given password is correct
      if (param === config.get('TELEGRAM.PASSWORD')) {
        witness = await getWitness();
        if (!witness) {
          return ctx.reply(`Failed to fetch witness data. Please try again later.`);
        }
        witnessData.props = witness?.props;
        witnessData.url = witness?.url;

        // Get private key to sign transaction
        const transaction_signing_key = chooseTransactionKey(witness.signing_key, config.get('ACTIVE_KEY'), config.get('SIGNING_KEYS'));
        if (!transaction_signing_key) {
          // No private active-key or private signing-keys?
          const msg =
            ctx.session.command === 'disable' || ctx.session.payload === NULL_KEY
              ? `Activating an already disabled witness requires the private active-key. Private signing-keys are insufficient in that case.`
              : 'Missing private signing-keys.';
          ctx.reply(msg);
        } else {
          // Command: Enable a specific <key>
          if (ctx.session.command === 'enable') {
            // Update Witness
            const props: any = { new_signing_key: ctx.session.payload };
            await retry(
              async () =>
                updateWitness({
                  witness: witness!.owner,
                  witnessData,
                  currentSigningKey: witness!.signing_key,
                  transactionSigningKey: transaction_signing_key,
                  props,
                  setProperties: Boolean(transaction_signing_key !== config.get('ACTIVE_KEY') && props.new_signing_key !== NULL_KEY),
                }),
              { retries: 3 },
            );

            // Reply via Telegram
            ctx.reply(`Updated Signing Key to ${ctx.session.payload}`);
            log(`Updated Signing Key to ${ctx.session.payload}`);
          }

          // Command: Disable witness completely
          else if (ctx.session.command === 'disable') {
            // Update Witness
            const props: any = { new_signing_key: NULL_KEY };
            await retry(
              async () =>
                updateWitness({
                  witness: witness!.owner,
                  witnessData,
                  currentSigningKey: witness!.signing_key,
                  transactionSigningKey: transaction_signing_key,
                  props,
                  setProperties: Boolean(transaction_signing_key !== config.get('ACTIVE_KEY') && props.new_signing_key !== NULL_KEY),
                }),
              { retries: 3 },
            );

            // Reply via Telegram
            ctx.reply(`Disabled Witness`);
            log(`Disabled Witness`);
          } else if (ctx.session.command === 'status') {
            witness = await getWitness();
            let key_name = `N/A`;
            let signing_msg = ``;

            for (const k of config.get('SIGNING_KEYS')) {
              // if (k.public == witness.signing_key && 'name' in k) {
              //   key_name = k.name as any;
              // }
              signing_msg += `\nSigning Key: ${k.public}`;
            }
            let msg = `Witness "${witness?.owner}" is currently set to signing key ${witness?.signing_key} (name: ${key_name}) and has ${witness?.total_missed} missed blocks.\n\n`;
            msg += signing_msg;
            return ctx.reply(msg);
          }

          // Command: Rotate through keys
          else if (ctx.session.command === 'rotate') {
            // Update Witness
            const props: any = {
              new_signing_key: getNextKey(config.get('SIGNING_KEYS'), witness.signing_key, true).public,
            };
            await retry(
              async () =>
                updateWitness({
                  witness: witness!.owner,
                  witnessData,
                  currentSigningKey: witness!.signing_key,
                  transactionSigningKey: transaction_signing_key,
                  props,
                  setProperties: Boolean(transaction_signing_key !== config.get('ACTIVE_KEY')),
                }),
              { retries: 3 },
            );

            // Reply via Telegram
            ctx.reply(`Updated Signing Key to ${props.new_signing_key}`);
            log(`Updated Signing Key to ${props.new_signing_key}`);
          } else {
            logNT(ctx.session);
            ctx.reply(`Not a valid command: ${ctx.session.command}`);
          }
        }

        // Resets the current session
        ctx.session.command = '';
        ctx.session.payload = '';
      } else {
        return ctx.reply(`Invalid Password. Try again with /confirm.`);
      }
    });

    // Command for changing signing-key. This requires the confirm command afterwards.
    bot.command('enable', (ctx) => {
      const text = ctx.message.text;
      const param = text.substring(7, text.length).trim();
      ctx.session.command = 'enable';
      ctx.session.payload = param;
      return ctx.reply('Please /confirm <password>.');
    });

    // Command for rotating through all signing keys. This requires the confirm command afterwards.
    bot.command('rotate', (ctx) => {
      ctx.session.command = 'rotate';
      return ctx.reply('Please /confirm <password>.');
    });

    // Command for disabling witness. This requires the confirm command afterwards.
    bot.command('disable', (ctx) => {
      ctx.session.command = 'disable';
      let msg = 'Please /confirm <password>.';
      if (!config.get('ACTIVE_KEY'))
        msg += ` Important: Disabling your witness now will result in you not being able to reactive it via remote-control, due to missing private active-key in config.`;
      return ctx.reply(msg);
    });

    bot.command('status', async (ctx) => {
      witness = await getWitness();
      ctx.session.command = 'status';
      let msg = `Witness "${witness?.owner}" is currently set to signing key ${witness?.signing_key}, and has ${witness?.total_missed} missed blocks.\n\n`;
      msg += `For more information, please /confirm <password>.`;
      return ctx.reply(msg);
    });

    // Getting all recent messages and keeps it alive
    bot.launch();

    bot.catch((x) => {
      console.error(x);
    });
  } catch (e) {
    console.error('start', e);
    await startRemote();
  }
};

const setInitialWitness = (x: any) => {
  witnessData.url = x.url;
  witnessData.props = x.props;

  if (config.get('SIGNING_KEYS').filter((y: any) => y.public === x.signing_key).length <= 0) {
    config.set('SIGNING_KEYS', [...config.get('SIGNING_KEYS'), { public: x.signing_key, private: '' }]);
  }

  config.set('SIGNING_KEYS', orderKeys(config.get('SIGNING_KEYS'), x.signing_key));
};

const getWitness = async () => await retry(async () => getWitnessByAccount(config.get('WITNESS')), { retries: 3 });
const updateWitness = async (props: UpdateWitnessWrapperProps) => await retry(async () => coreUpdateWitnessWrapper({ ...props, log }), { retries: 3 });
const log = (...args: any[]): void => console.log(`[REMOTE] ${new Date().toISOString()} - ${args}`);
const logNT = (...args: any[]): void => console.log(`[REMOTE] ${args}`);
