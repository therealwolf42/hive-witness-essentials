FROM node:22-alpine

WORKDIR /witness-essentials

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm pm2 && pnpm i && npm install pm2@latest -g && pm2 update

COPY . /witness-essentials

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]