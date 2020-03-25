import * as nodemailer from 'nodemailer'

const twilio = require('twilio')
const request = require('superagent')
const Telegraf = require('telegraf')

export interface TelegramData {
  bot_token: string,
  user_id: string | number,
}

export interface MailData {
  mail_account: string,
  mail_password: string,
  to: string,
  host?: string, //smtp.gmail.com
  port?: number, //465
  secure?: boolean //true
}

export type Provider = 'nexmo' | 'twilio'

export interface ProviderData {
  api_key: string,
  api_secret: string,
  phone_number: string | number,
  from_number?: string | number
}

/**
 * Send a message through Telegram.
 */
export let send_telegram = async (message: string, telegram_data: TelegramData, retries: number = 0) => {
  try {
    const bot = new Telegraf(telegram_data.bot_token)
    bot.telegram.sendMessage(telegram_data.user_id, message)
  } catch (e) {
    if (retries < 2) {
      await send_telegram(message, telegram_data, retries += 1)
    } else {
      return e
    }
  }
}

/**
 * Send an Email. Default host is Gmail, port 465.
 */
export let send_email = async (subject: string, message: string, mail_data?: MailData, retries: number = 0) => {
  try {
    let transporter = nodemailer.createTransport({
      host: mail_data.host || 'smtp.gmail.com',
      port: mail_data.port || 465,
      secure: mail_data.secure || true,
      auth: { user: mail_data.mail_account, pass: mail_data.mail_password }
    })
    let mailOptions = { from: mail_data.mail_account, to: mail_data.to, subject, text: message }
    return await transporter.sendMail(mailOptions)
  } catch (e) {
    if (retries < 2) {
      await send_email(subject, message, mail_data, retries += 1)
    } else {
      return e
    }
  }
}

/**
 * Send SMS
 */
export let send_sms = async (from: string, message: string, provider: Provider, provider_data: ProviderData, retries: number = 0) => {
  try {
    switch (provider) {
      case 'nexmo':
        return await request.post('https://rest.nexmo.com/sms/json').query({ to: provider_data.phone_number, from, text: message, api_key: provider_data.api_key, api_secret: provider_data.api_secret })
      case 'twilio':
        const client = new twilio(provider_data.api_key, provider_data.api_secret)
        return await client.messages.create({ to: provider_data.phone_number, from: provider_data.from_number, body: message })
    }
  } catch (e) {
    if (retries < 2) {
      await send_sms(from, message, provider, provider_data, retries += 1)
    } else {
      return e
    }
  }
}
