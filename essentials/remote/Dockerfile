FROM keymetrics/pm2:latest-alpine

WORKDIR /remote
COPY package*.json yarn.* ecosystem.config.js ./

# Fix for 'could not get uid/gid'
RUN npm config set unsafe-perm true
RUN npm i
RUN npm i -D @types/node 
RUN npm i --global pm2 ts-node typescript @types/node

COPY . /remote

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
