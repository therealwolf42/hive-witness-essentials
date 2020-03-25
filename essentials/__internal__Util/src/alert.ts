/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as nodemailer from 'nodemailer'
import {Twilio} from 'twilio'
import request from 'superagent'
import telegraf from 'telegraf'

export interface TelegramData {
  bot_token: string
  user_id: string | number
}

export interface MailData {
  mail_account: string
  mail_password: string
  to: string
  host?: string //smtp.gmail.com
  port?: number //465
  secure?: boolean //true
}

export type Provider = 'nexmo' | 'twilio'

export interface ProviderData {
  api_key: string
  api_secret: string
  phone_number: string | number
  from_number?: string | number
}

/**
 * Send a message through Telegram.
 */
export const send_telegram = async (
  message: string,
  data: TelegramData,
  retries = 0,
) => {
  try {
    const bot = new telegraf(data.bot_token)
    bot.telegram.sendMessage(data.user_id, message)
  } catch (e) {
    if (retries < 2) {
      await send_telegram(message, data, (retries += 1))
    } else {
      return e
    }
  }
}

/**
 * Send an Email. Default host is Gmail, port 465.
 */
export const send_email = async (
  subject: string,
  message: string,
  mail_data?: MailData,
  retries = 0,
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: mail_data.host || 'smtp.gmail.com',
      port: mail_data.port || 465,
      secure: mail_data.secure || true,
      auth: {user: mail_data.mail_account, pass: mail_data.mail_password},
    })
    const mailOptions = {
      from: mail_data.mail_account,
      to: mail_data.to,
      subject,
      text: message,
    }
    return await transporter.sendMail(mailOptions)
  } catch (e) {
    if (retries < 2) {
      await send_email(subject, message, mail_data, (retries += 1))
    } else {
      return e
    }
  }
}

/**
 * Send SMS
 */
export const send_sms = async (
  from: string,
  message: string,
  provider: Provider,
  provider_data: ProviderData,
  retries = 0,
) => {
  try {
    switch (provider) {
      case 'nexmo':
        return await request.post('https://rest.nexmo.com/sms/json').query({
          to: provider_data.phone_number,
          from,
          text: message,
          api_key: provider_data.api_key,
          api_secret: provider_data.api_secret,
        })
      case 'twilio':
        const client = new Twilio(
          provider_data.api_key,
          provider_data.api_secret,
        )
        return await client.messages.create({
          to: String(provider_data.phone_number),
          from: String(provider_data.from_number),
          body: message,
        })
    }
  } catch (e) {
    if (retries < 2) {
      await send_sms(from, message, provider, provider_data, (retries += 1))
    } else {
      return e
    }
  }
}
