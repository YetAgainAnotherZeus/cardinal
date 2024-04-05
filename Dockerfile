## BUILDER
FROM node:21-alpine3.19 AS builder
WORKDIR /app

COPY . .
RUN npm install -g pnpm

RUN pnpm install
RUN pnpm build 
RUN pnpm copy:locales

## PRODUCTION
FROM node:21-alpine3.19
ENV NODE_ENV="production"

WORKDIR /app

COPY --from=builder /app/build ./build
COPY package.json ./
COPY pnpm-lock.yaml ./

# Do a single run layer to reduce image size
RUN npm install -g pnpm \
    && pnpm install

CMD ["pnpm", "start"]