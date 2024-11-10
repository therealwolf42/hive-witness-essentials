# Use node:18-alpine as base
FROM node:18-alpine

# Set working directory
ARG ESSENTIALS
WORKDIR /witness-essentials

# Copy and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm pm2 && pnpm i

# Copy the rest of the application code
COPY . /witness-essentials

# Use PM2 to run the application with restart on failure
CMD ["pm2-runtime", "pnpm", "--name", "witness-essentials", "--", "start", "$ESSENTIALS"]