FROM node:22-alpine

# Set working directory
WORKDIR /witness-essentials

# Copy and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm pm2 && pnpm i && npm install pm2@latest -g && pm2 update

# Copy the rest of the application code
COPY . /witness-essentials

# Use PM2 to run the application with restart on failure
CMD ["/bin/sh", "-c", "pm2-runtime pnpm --name witness-essentials -- start \"$ESSENTIALS\""]
