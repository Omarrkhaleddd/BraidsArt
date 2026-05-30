FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/
COPY scripts/ ./scripts/

RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false

RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/braids-booking run build

EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
