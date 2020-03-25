module.exports = {
  apps: [
    {
      name: 'watcher',
      script: 'ts-node',
      args: './src/index.ts',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
