FROM keymetrics/pm2:latest-alpine

WORKDIR /pricefeed
COPY package*.json yarn.* ecosystem.config.js ./

# Fix for 'could not get uid/gid'
RUN npm config set unsafe-perm true

RUN yarn

RUN yarn global add pm2 ts-node typescript

COPY . /pricefeed

RUN ls

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]