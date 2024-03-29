# Hive Witness Essentials

Includes Watcher, Pricefeed, Remote, CLI inside `essentials`

Docker support:

- Watcher, Pricefeed, Remote

```
git clone git@github.com:therealwolf42/hive-witness-essentials.git
cd essentials/{watcher,pricefeed,remote} # select one!

# If you need to migrate your previous config, do it now!
cp configs/config.example.json configs/config.json

# Now replace/enter everything besides the RPC nodes as they are up-to-date.
## On MacOS you can delete lines with control + k
nano configs/config.json

# script needs proper rights
chmod +x run.sh

# optional if docker not yet installed
./run.sh install_docker

# Let's get it on
./run.sh build && ./run.sh restart && ./run.sh logs

To get a list of possible commands, use: ./run.sh help
```

Yarn/NPM Only:

- CLI

## Installing Node

In case you need node, you can install it via:

```
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -

sudo apt-get install nodejs
```
