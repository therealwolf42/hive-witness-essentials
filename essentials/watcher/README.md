# Watcher

Script for Steem Witnesses to watch witness for missed blocks, failover towards backup-nodes & alert via multiple services.

- Multiple alert options available (TELEGRAM, SMS <NEXMO, TWILIO>, EMAIL)
- Transaction signing either via private signing-key or private active-key
- RPC Failover
- Rotation between keys supported
- Robust error handling


## Docker Installation (Recommended)
It is recommended to use Docker. (Testing is currently not supported via docker)

```
git clone https://github.com/witness-essentials/watcher.git
cd watcher
chmod +x run.sh
./run.sh install_docker
./run.sh build
./run.sh start
```

To get a list of possible commands, use: `./run.sh help`

## Manual Installation

However, you can also run node manually, with PM2 or your favourite program.

#### Requirement: Node >= 8
```
sudo apt update
sudo apt install -y curl software-properties-common gnupg build-essential libssl-dev
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i npm@latest -g
```

#### 1.) Clone Repository and install packages
```
git clone https://github.com/witness-essentials/watcher.git
cd watcher
npm i # or yarn
```

#### 2.) Edit your Config
```
cp configs/config.example.json configs/config.json
nano configs/config.json
```

#### Config Explanation

- TEST_MODE: It will alert you in case of missed blocks, but without actually changing signing keys
- MISSED_BLOCKS_THRESHOLD: How many blocks can be missed until signing key gets changed / or disabled.
- ROTATE_KEYS: The script can rotate between your signing keys, until ROTATE_ROUNDS has been reached-
- ROTATE_ROUNDS: How many rounds should be rotated? (-1 is infinite)
- WITNESS: Witness account
- INTERVAL: How often should watcher iterate and check for new missed blocks? (in minutes)
- ACTIVE_KEY: Add your private active key. Only needed if you're not adding private signing keys (see below) or if your witness is disabled.
- SIGNING_KEYS: Add **all** your signing keys here as pairs. As of HF20, you can now also change keys and witness properties via your private signing keys.

```
 [{ "public": "STM7..", "private": "5JS.." }, { "public": "STM5..", "private": "5PD.." }, { .. }]
```

- SMS
  - NEXMO: Use NEXMO as SMS alert service
  - TWILIO: USE TWILIO as SMS alert service
  - API_KEY: NEXMO or TWILIO API KEY
  - API_SECRET: NEXMO or TWILIO API SECRET
  - PHONE_NUMBER: For NEXMO or TWILIO - incl. country-code: e.g. 49123456789 (+49 would be Germany)
  - FROM_NUMBER: Only for TWILIO

- EMAIL
  - ENABLED: Should email alert be enabled
  - GOOGLE_MAIL_ACCOUNT: Authentication for Email sending
  - GOOGLE_MAIL_PASSWORD: Authentication for Email sending
  - EMAIL_RECEIVER: Mail account that should receive the emails

- TELEGRAM
  - ENABLED: Should telegram alert be enabled
  - BOT_TOKEN: The token you'll get from botfather
  - USER_ID: You'll get the ID once you've created your bot and pressed on start or entered /help  

To get the TELEGRAM data, follow this guide: https://core.telegram.org/bots#6-botfather

---

## Start

Option 1: NPM (no background)
```
npm start
```

Option 2: PM2 (background)
```
sudo npm install pm2 -g # if you haven't installed it yet

pm2 start npm --name=watcher -- start
pm2 save
pm2 logs watcher
```

Option 3: Docker (background)
```
./run.sh start
./run.sh logs
```

## Testing

You can also test, if everything has been setup correctly, by running the test script

```
npm run test
```

## Support

Developed by <a href="https://therealwolf.me">@therealwolf</a>
