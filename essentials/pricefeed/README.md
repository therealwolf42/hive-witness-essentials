# Pricefeed

Script for Hive Witnesses to publish their pricefeed. (info below will be updated soon)

- 5 major exchanges supported
- Transaction signing either via private signing-key or private active-key
- RPC Failover
- USDT > USD calulation
- PEG support
- Robust error handling.


## Docker Installation (Recommended)
It is recommended to use Docker.

```
git clone https://github.com/witness-essentials/pricefeed.git
cd pricefeed
chmod +x run.sh
./run.sh install_docker
./run.sh build
./run.sh start
```

To get a list of possible commands, use: `./run.sh help`

## Manual Installation

However, you can also  run node manually, with PM2 or your favourite program.

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
git clone https://github.com/witness-essentials/pricefeed.git
cd pricefeed
npm i # or yarn
```

#### 2.) Edit your Config
```
cp configs/config.example.json configs/config.json
nano configs/config.json
```

#### Config Explanation

- EXCHANGES: An object containing all supported exchanges. Toggle to `false` to disable a specific exchange.
- CONVERT_USDT_TO_USD: Boolean while on true will convert USDT > USD.
- EXCHANGES_USDT: An object containing all supported USDT > USD exchanges. Toggle to `false` to disable a specific exchange.
- ACTIVE_KEY: Add your private active key. Only needed if you're not adding private signing keys, see below.
- SIGNING_KEYS: Add **all** your signing keys here as pairs. As of HF20, you can now also publish your pricefeed with your private signing keys.

```
 [{ "public": "STM7..", "private": "5JS.." }, { "public": "STM5..", "private": "5PD.." }, { .. }]
```

Info: The active key is now optional and only needed if your witness is disabled and you still want to publish a pricefeed.

## Start

Option 1: NPM (no background)
```
npm start
```

Option 2: PM2 (background)
```
sudo npm install pm2 -g # if you haven't installed it yet

pm2 start pm2.js --env production # or --env development
pm2 logs pricefeed
```

Option 3: Docker (background)
```
./run.sh start
./run.sh logs
```

## Support

If you find this tool useful, consider voting for me (@therealwolf) as a witness: https://therealwolf.me/vote
