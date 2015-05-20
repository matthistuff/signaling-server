FROM node:0.12

ENV NODE_ENV="production"

ADD . signaling-server/

WORKDIR /signaling-server

RUN npm install

CMD node index

EXPOSE 8080