FROM node:latest AS builder
WORKDIR /app
ADD ./server/ ./
RUN yarn install --pure-lockfile

FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY --chown=node:node --from=builder /app ./
CMD ["/usr/bin/npm", "start"]
EXPOSE 8080
