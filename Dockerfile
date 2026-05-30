FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false --ignore-scripts

RUN ./node_modules/.bin/esbuild --version || npx esbuild --version

RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false

RUN pnpm --filter @workspace/api-server run build

RUN pnpm --filter @workspace/braids-booking run build

FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app .

EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
