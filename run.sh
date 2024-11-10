#!/bin/bash
# by therealwolf42, based on script by Someguy123

# Get enabled essentials from config.json
get_enabled_essentials() {
    local essentials=""
    if [ $(jq '.WATCHER.ENABLED' config/config.json) = true ]; then
        essentials="${essentials:+$essentials,}watcher"
    fi
    if [ $(jq '.PRICEFEED.ENABLED' config/config.json) = true ]; then
        essentials="${essentials:+$essentials,}pricefeed"
    fi
    if [ $(jq '.REMOTE.ENABLED' config/config.json) = true ]; then
        essentials="${essentials:+$essentials,}remote"
    fi
    echo "$essentials"
}

# Default command if none specified
CMD=${1:-"start"}
ESSENTIALS=$(get_enabled_essentials)
building="false"

start() {
    echo "Starting witness-essentials container..."
    container_exists
    if [[ $? == 0 ]]; then
        docker start witness-essentials
    else
        docker run -d --name witness-essentials -e ESSENTIALS=$ESSENTIALS -t witness-essentials
    fi
}

stop() {
    echo "Stopping witness-essentials container..."
    docker stop witness-essentials
    echo "Removing old witness-essentials container..."
    docker rm witness-essentials
}

build() {
    building="true"
    docker rmi -f witness-essentials
    config
    docker build -t witness-essentials --build-arg ESSENTIALS=$ESSENTIALS -f Dockerfile .
}

config() {
    if ! [ -e config/config.json ]
    then
        cp config/config.example.json config/config.json
        echo "Copied config. Please enter your witness name and signing-keys. You can either choose to sign the transactions with your private signing-keys or your private active-key."
        sleep 2
    fi
    nano config/config.json
    if [ $building = "false"  ]; then
        echo "IMPORTANT: This has not changed the config inside your container. Please 'build' again if you've changed it."
    fi
    # Update ESSENTIALS based on new config
    ESSENTIALS=$(get_enabled_essentials)
}

install_docker() {
    sudo apt update
    sudo apt install curl git jq
    curl https://get.docker.com | sh
    if [ "$EUID" -ne 0 ]; then 
        echo "Adding user $(whoami) to docker group"
        sudo usermod -aG docker $(whoami)
        echo "IMPORTANT: Please re-login (or close and re-connect SSH) for docker to function correctly"
    fi
}

container_exists() {
    count=$(docker ps -a -f name="^/witness-essentials$" | wc -l)
    if [[ $count -eq 2 ]]; then
        echo "exists"
        return 0
    else
        echo "not exists"
        return -1
    fi
}

logs() {
    echo "DOCKER LOGS for witness-essentials: (press ctrl-c to exit) "
    docker logs -f --tail=30 witness-essentials
}

help() {
    echo "Usage: $0 COMMAND"
    echo
    echo "Commands: "
    echo "    install_docker - install docker"
    echo "    build - build container"
    echo "    start - starts container"
    echo "    restart - restarts container"
    echo "    stop - stops container"
    echo "    logs - monitor the logs"
    echo
    echo "Essentials are automatically determined from config.json based on enabled services"
    echo "Currently enabled: $ESSENTIALS"
    echo
    exit
}

case $CMD in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 5
        start
        ;;
    build)
        build
        ;;
    config)
        config
        ;;
    logs)
        logs
        ;;
    install_docker)
        install_docker
        ;;
    *)
        echo "Invalid CMD"
        help
        ;;
esac