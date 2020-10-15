require('dotenv').config()
import * as essentials from 'witness-essentials-package'
import _g = require('./_g')
import Telegraf, {session} from 'telegraf'

const bot = new Telegraf(_g.config.TELEGRAM_BOT_TOKEN)

import {get_witness, set_initial_witness, update_witness} from './helpers'
import {config} from './_g'

const start = async () => {
  try {
    console.log('\n----------------------------\n')
    console.log('Initiating Witness Remote Control')
    let witness = await get_witness()
    set_initial_witness(witness)
    essentials.log('Witness Remote Control: Active\n')

    // Initial Startup when the bot is opened for the first time in telegram
    bot.start((ctx) =>
      ctx.reply(
        `Welcome to your witness remote control. Use /enable <key> to switch to a different key, /rotate to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your .env file.`,
      ),
    )

    // Command: /help
    try {
      bot.help((ctx) =>
        ctx.reply(
          `Use /enable <key> to switch to a different key, /rotate to rotate between your signing keys and /disable to disable your witness. Your TELEGRAM_USER_ID is ${ctx.chat.id}. Make sure this is inside your config.`,
        ),
      )
    } catch (error) {
      console.error(error)
    }

    // Session is being set which works inbetween commands
    bot.use(session())

    // Command for confirming password
    bot.command('confirm', async (ctx: any) => {
      // Gets the parameter from the ctx object
      const text = ctx.message.text
      const param = text.substring(8, text.length).trim()

      // Check if the given password is correct
      if (param === _g.config.TELEGRAM_PASSWORD) {
        witness = await get_witness()
        _g.witness_data.props = witness.props
        _g.witness_data.url = witness.url

        // Get private key to sign transaction
        const transaction_signing_key = essentials.choose_transaction_key(
          witness.signing_key,
          _g.config.ACTIVE_KEY,
          _g.config.SIGNING_KEYS,
        )
        if (!transaction_signing_key) {
          // No private active-key or private signing-keys?
          const msg =
            ctx.session.command === 'disable' ||
            ctx.session.param === _g.NULL_KEY
              ? `Activating an already disabled witness requires the private active-key. Private signing-keys are insufficient in that case.`
              : 'Missing private signing-keys.'
          ctx.reply(msg)
        } else {
          // Command: Enable a specific <key>
          if (ctx.session.command === 'enable') {
            // Update Witness
            const props: any = {new_signing_key: ctx.session.param}
            await update_witness(
              witness.signing_key,
              transaction_signing_key,
              props,
              {
                set_properties: Boolean(
                  transaction_signing_key !== _g.config.ACTIVE_KEY &&
                    props.new_signing_key !== _g.NULL_KEY,
                ),
              },
            )

            // Reply via Telegram
            ctx.reply(`Updated Signing Key to ${ctx.session.param}`)
            essentials.log(`Updated Signing Key to ${ctx.session.param}`)
          }

          // Command: Disable witness completely
          if (ctx.session.command === 'disable') {
            // Update Witness
            const props: any = {new_signing_key: _g.NULL_KEY}
            await update_witness(
              witness.signing_key,
              transaction_signing_key,
              props,
              {
                set_properties: Boolean(
                  transaction_signing_key !== _g.config.ACTIVE_KEY &&
                    props.new_signing_key !== _g.NULL_KEY,
                ),
              },
            )

            // Reply via Telegram
            ctx.reply(`Disabled Witness`)
            essentials.log(`Disabled Witness`)
          }
          if (ctx.session.command === 'status') {
            witness = await get_witness()
            let key_name = `N/A`
            let signing_msg = ``

            for (const k of _g.config.SIGNING_KEYS) {
              if (k.public == witness.signing_key && 'name' in k) {
                key_name = k.name
              }
              signing_msg += `\nSigning Key: ${k.public} | Name: ${k.name}`
            }
            let msg = `Witness "${witness.owner}" is currently set to signing key ${witness.signing_key} (name: ${key_name}) and has ${witness.total_missed} missed blocks.\n\n`
            msg += signing_msg
            return ctx.reply(msg)
          }

          // Command: Rotate through keys
          if (ctx.session.command === 'rotate') {
            // Update Witness
            const props: any = {
              new_signing_key: essentials.get_next_key(
                _g.config.SIGNING_KEYS,
                witness.signing_key,
                true,
              ).public,
            }
            await update_witness(
              witness.signing_key,
              transaction_signing_key,
              props,
              {
                set_properties: Boolean(
                  transaction_signing_key !== _g.config.ACTIVE_KEY,
                ),
              },
            )

            // Reply via Telegram
            ctx.reply(`Updated Signing Key to ${props.new_signing_key}`)
            essentials.log(`Updated Signing Key to ${props.new_signing_key}`)
          } else {
            ctx.reply(`No command.`)
          }
        }

        // Resets the current session
        ctx.session.command = ''
        ctx.session.param = ''
      } else {
        return ctx.reply(`Invalid Password. Try again with /confirm.`)
      }
    })

    // Command for changing signing-key. This requires the confirm command afterwards.
    bot.command('enable', (ctx: any) => {
      const text = ctx.message.text
      const param = text.substring(7, text.length).trim()
      ctx.session.param = param
      ctx.session.command = 'enable'
      return ctx.reply('Please /confirm <password>.')
    })

    // Command for rotating through all signing keys. This requires the confirm command afterwards.
    bot.command('rotate', (ctx: any) => {
      ctx.session.command = 'rotate'
      return ctx.reply('Please /confirm <password>.')
    })

    // Command for disabling witness. This requires the confirm command afterwards.
    bot.command('disable', (ctx: any) => {
      ctx.session.command = 'disable'
      let msg = 'Please /confirm <password>.'
      if (!config.ACTIVE_KEY)
        msg += ` Important: Disabling your witness now will result in you not being able to reactive it via remote-control, due to missing private active-key in config.`
      return ctx.reply(msg)
    })

    bot.command('status', async (ctx: any) => {
      witness = await get_witness()
      ctx.session.command = 'status'
      let msg = `Witness "${witness.owner}" is currently set to signing key ${witness.signing_key}, and has ${witness.total_missed} missed blocks.\n\n`
      msg += `For more information, please /confirm <password>.`
      return ctx.reply(msg)
    })

    // Getting all recent messages and keeps it alive
    bot.startPolling()

    bot.catch((x) => {
      console.error(x)
    })
  } catch (e) {
    console.error('start', e)
    await start()
  }
}

start()
