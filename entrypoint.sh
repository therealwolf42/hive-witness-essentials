#!/bin/sh
set -e
exec pm2-runtime start pnpm --name witness-essentials -- start $ESSENTIALS