# Remote Control

Remote control is a script for Hive witnesses to manage their witness-servers remotely via telegram. Currently available features:

- Change signing-key
- Disable witness
- Rotate through specified signing-keys

## Getting Started

### Docker Installation (Recommended)

It is recommended to use Docker.

```
git clone git@github.com:therealwolf42/hive-witness-essentials.git
cd essentials/remote
chmod +x run.sh
./run.sh install_docker
./run.sh build
./run.sh start
To get a list of possible commands, use: ./run.sh help
```

### Manual Installation

However, you can also run node manually, with PM2 or your favourite program.

```
Requirement: Node >= 8
sudo apt update
sudo apt install -y curl software-properties-common gnupg build-essential libssl-dev
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i npm@latest -g
```

##### 1.) Clone Repository and install packages

```
git clone https://github.com/witness-essentials/remote-control.git
cd remote-control
npm i
```

#### 2.) Edit your Config

```
cp configs/config.example.json configs/config.json
nano configs/config.json
```

#### Config Explanation

- WITNESS: Your witness account name
- ACTIVE*KEY: Add your private active key. Only needed if you're not adding private signing keys or if you want to change keys of a \_disabled* witness.
- SIGNING_KEYS: Add **all** your signing keys here as pairs. As of HF20, you can now also change signing-keys (as long as witness is not disabled) with the private key of your currently active signing-key.

```
 [{ "public": "STM7..", "private": "5JS.." }, { "public": "STM5..", "private": "5PD.." }, { .. }]
```

- TELEGRAM_BOT_TOKEN: The token you'll get from botfather
- TELEGRAM_PASSWORD: The password you'll need to confirm after making a remote call.
- TELEGRAM_USER_ID: You'll get the ID once you've created your bot and pressed on start or entered /help

To get the TELEGRAM data, follow this guide: https://core.telegram.org/bots#6-botfather

---

## Start

Option 1: NPM (no background)

```
npm start
```

Option 2: PM2 (background)

```
yarn global add pm2 # if you haven't installed it yet

pm2 start ecosystem.config.js --env production # or --env development
pm2 logs remote
```

Option 3: Docker (background)

```
./run.sh start
./run.sh logs
```

## Telegram Commands

Use a specific signing-key

```
/enable <key>
```

Rotate to the next signing-key as specified inside your configs/config.json

```
/rotate
```

Disable the witness

```
/disable
```

Show all available commands

```
/help
```

## Support

Developed by <a href="https://therealwolf.me">@therealwolf</a>
