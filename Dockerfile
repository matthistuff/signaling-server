FROM node:5.5

ENV NODE_ENV="production"

COPY . signaling-server/

WORKDIR /signaling-server

RUN npm install

CMD node index

EXPOSE 8080