FROM keymetrics/pm2:latest-alpine

WORKDIR /watcher
COPY package*.json yarn.* ecosystem.config.js ./

# Fix for 'could not get uid/gid'
RUN npm config set unsafe-perm true

RUN yarn
RUN yarn add -D @types/node 
RUN yarn global add pm2 ts-node typescript @types/node

COPY . /watcher

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
