FROM node:24-alpine AS build

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

COPY packages/contracts packages/contracts
COPY apps/server apps/server
ARG DATABASE_URL=postgresql://build:build@database:5432/build?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build --workspace=@savent/contracts \
  && npm run build --workspace=@savent/server

FROM build AS migration

WORKDIR /app/apps/server
CMD ["npm", "run", "db:migrate:deploy"]

FROM node:24-alpine AS production-dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --omit=dev \
  --workspace=@savent/contracts \
  --workspace=@savent/server

FROM node:24-alpine AS runtime

RUN apk add --no-cache openssl \
  && addgroup -S savent \
  && adduser -S savent -G savent
WORKDIR /app

ENV NODE_ENV=production
COPY --from=production-dependencies --chown=savent:savent /app/node_modules ./node_modules
COPY --from=build --chown=savent:savent /app/package.json /app/package-lock.json ./
COPY --from=build --chown=savent:savent /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=savent:savent /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build --chown=savent:savent /app/apps/server/package.json ./apps/server/package.json
COPY --from=build --chown=savent:savent /app/apps/server/dist ./apps/server/dist

USER savent
EXPOSE 3000
WORKDIR /app/apps/server

CMD ["node", "dist/server.js"]
