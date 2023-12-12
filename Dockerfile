FROM node:18 AS builder
WORKDIR /app
ADD ./server/ ./
RUN npm install

FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY --chown=node:node --from=builder /app ./
