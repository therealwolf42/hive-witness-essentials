FROM keymetrics/pm2:latest-alpine

WORKDIR /pricefeed
COPY package*.json yarn.* ecosystem.config.js ./

# Fix for 'could not get uid/gid'
RUN npm config set unsafe-perm true
RUN npm i
RUN npm i -D @types/node@12.12.31
RUN npm i --global pm2 ts-node@8.8.1 typescript@3.8.3 @types/node@12.12.31

COPY . /pricefeed

RUN ls

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
