FROM keymetrics/pm2:latest-alpine

WORKDIR /remote
COPY package*.json yarn.* ecosystem.config.js ./remote/

# Fix for 'could not get uid/gid'
RUN npm config set unsafe-perm true

RUN yarn

RUN yarn global add pm2 ts-node typescript

COPY . /remote

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]