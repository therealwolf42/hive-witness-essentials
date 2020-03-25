#!/bin/bash
# by therealwolf42, based on script by Someguy123

DOCKER_NAME="pricefeed"
building="false"

start() {
    echo "Starting container..."
    container_exists
    if [[ $? == 0 ]]; then
        docker start $DOCKER_NAME
    else
        docker run -d --name $DOCKER_NAME -t $DOCKER_NAME
    fi
}

stop() {
    echo "Stopping container..."
    docker stop $DOCKER_NAME
    echo "Removing old container..."
    docker rm $DOCKER_NAME
}

build() {
    building="true"
    docker rmi -f pricefeed
    config
    docker build -t pricefeed .
}

config() {
    if ! [ -e configs/config.json ]
    then
        cp configs/config.example.json configs/config.json
        echo "Copied config. Please enter your witness name and signing-keys. You can either choose to sign the transactions with your private signing-keys or your private active-key."
        sleep 2
    fi
    nano configs/config.json
    if [ $building = "false"  ]; then
        echo "IMPORTANT: This has not changed the config inside your container. Please 'build' again if you've changed it."
    fi
}

install_docker() {
    sudo apt update
    sudo apt install curl git
    curl https://get.docker.com | sh
    if [ "$EUID" -ne 0 ]; then 
        echo "Adding user $(whoami) to docker group"
        sudo usermod -aG docker $(whoami)
        echo "IMPORTANT: Please re-login (or close and re-connect SSH) for docker to function correctly"
    fi
}

container_exists() {
    count=$(docker ps -a -f name="^/"$DOCKER_NAME"$" | wc -l)
    if [[ $count -eq 2 ]]; then
        echo "exists"
        return 0
    else
        echo "not exists"
        return -1
    fi
}

logs() {
    echo "DOCKER LOGS: (press ctrl-c to exit) "
    docker logs -f --tail=30 $DOCKER_NAME
}

help() {
    echo "Usage: $0 COMMAND"
    echo
    echo "Commands: "
    echo "    install_docker - install docker"
    echo "    build - build container (from docker file)"
    echo "    start - starts container"
    echo "    restart - restarts container"
    echo "    stop - stops container"
    echo "    logs - monitor the logs"
    echo
    exit
}


case $1 in
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