FROM node:latest AS builder
WORKDIR /app
ADD ./server/ ./
RUN yarn install --pure-lockfile

FROM node:latest
WORKDIR /app
COPY --chown=node:node --from=builder /app ./
CMD ["npm", "start"]
EXPOSE 8080
