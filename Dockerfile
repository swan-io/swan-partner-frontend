FROM node:18

ADD ./yarn.lock /home/node/app/
ADD ./server/ /home/node/app/

RUN cd /home/node/app/ && yarn install --production && node-prune

WORKDIR /home/node/app/

CMD yarn start
EXPOSE 8080
