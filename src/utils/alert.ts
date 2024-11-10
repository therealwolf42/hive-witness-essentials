import * as nodemailer from 'nodemailer';
import twilio from 'twilio';
import request from 'superagent';
import { Telegraf } from 'telegraf';

export interface TelegramData {
  botToken: string;
  userId: string | number;
}

export interface MailData {
  mailAccount: string;
  mailPassword: string;
  to: string;
  host?: string; //smtp.gmail.com
  port?: number; //465
  secure?: boolean; //true
}

export type Provider = 'nexmo' | 'twilio';

export interface ProviderData {
  apiKey: string;
  apiSecret: string;
  phoneNumber: string | number;
  fromNumber?: string | number;
}

/**
 * Send a message through Telegram.
 */
export const sendTelegram = async (message: string, data: TelegramData, retries = 0) => {
  try {
    const bot = new Telegraf(data.botToken);
    bot.telegram.sendMessage(data.userId, message);
  } catch (e) {
    if (retries < 2) {
      await sendTelegram(message, data, (retries += 1));
    } else {
      return e;
    }
  }
};

/**
 * Send an Email. Default host is Gmail, port 465.
 */
export const sendEmail = async (subject: string, message: string, mailData: MailData, retries = 0) => {
  try {
    const transporter = nodemailer.createTransport({
      host: mailData.host || 'smtp.gmail.com',
      port: mailData.port || 465,
      secure: mailData.secure || true,
      auth: { user: mailData.mailAccount, pass: mailData.mailPassword },
    });
    const mailOptions = {
      from: mailData.mailAccount,
      to: mailData.to,
      subject,
      text: message,
    };
    return await transporter.sendMail(mailOptions);
  } catch (e) {
    if (retries < 2) {
      await sendEmail(subject, message, mailData, (retries += 1));
    } else {
      return e;
    }
  }
};

/**
 * Send SMS
 */
export const sendSms = async (from: string, message: string, provider: Provider, providerData: ProviderData, retries = 0) => {
  try {
    switch (provider) {
      case 'nexmo':
        return await request.post('https://rest.nexmo.com/sms/json').query({
          to: providerData.phoneNumber,
          from,
          text: message,
          apiKey: providerData.apiKey,
          apiSecret: providerData.apiSecret,
        });
      case 'twilio':
        const client = new twilio.Twilio(providerData.apiKey, providerData.apiSecret);
        return await client.messages.create({
          to: String(providerData.phoneNumber),
          from: String(providerData.fromNumber),
          body: message,
        });
    }
  } catch (e) {
    if (retries < 2) {
      await sendSms(from, message, provider, providerData, (retries += 1));
    } else {
      return e;
    }
  }
};
