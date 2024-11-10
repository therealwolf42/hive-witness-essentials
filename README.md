# Hive Witness Essentials

Includes Watcher, Pricefeed, Remote & CLI methods.

Docker support:

- Watcher, Pricefeed, Remote

```
git clone git@github.com:therealwolf42/hive-witness-essentials.git

# Copy example config
cp config/config.example.json config/config.json

# Edit the config file and replace values as needed
# Ensure each essential's ENABLED flag is set to true/false as desired.
nano config/config.json

# Optional: Ensure script permissions
chmod +x run.sh

# Optional: Install Docker if not yet installed
./run.sh install_docker

# Install dependencies
sudo apt install jq

# Rebuild whenever you update the config, then restart and view logs
./run.sh build && ./run.sh restart && ./run.sh logs

To list available commands and check active essentials, use: `./run.sh help`
```

Node Only:

- CLI

## Installing Node & PNPM

In case you need node & pnpm, you can install it via:

```
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -

sudo apt-get install nodejs
npm install -g pnpm pm2 && pnpm i
```

## Getting Started with Node

Run essentials (all by default: watcher,pricefeed,rmote)

```
pnpm start <watcher,pricefeed,remote>
```

Run each one seperate

````
pnpm run <watcher|pricefeed|remote>
```

There are 4 CLI commands you can run. If you want to use a specific RPC_NODE, then you can use it as optional argument.

Active a specific signing-key

```
pnpm run enable <SIGNING_KEY> <OPTIONAL_RPC_NODE>
```

Disable your witness directly

```
pnpm run disable <OPTIONAL_RPC_NODE>
```

Change your witness parameters

```
pnpm run update <OPTIONAL_RPC_NODE>
```

Rotate between signing-keys (in config)

```
pnpm run rotate <OPTIONAL_RPC_NODE>
```


#### Config Explanation

- WITNESS: Add you witness username.

- SIGNING_KEYS: Add **all** your signing keys here as pairs. As of HF20, you can now also update your witness with your current private signing key. This is also necessary for updating new properties.

```
 [{ "public": "STM7..", "private": "5JS.." }, { "public": "STM5..", "private": "5PD.." }, { .. }]
```

- Private Key (Optional): As of HF20, the private active key is optional and/or only needed if the witness is disabled and you want to enable it again.