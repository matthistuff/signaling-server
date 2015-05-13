FROM node:0.12

ENV NODE_ENV="production"

RUN wget https://github.com/dunlin/signaling-server/archive/master.tar.gz -O signaling-server-master.tar.gz && \
	tar -zxvf signaling-server-master.tar.gz && \
	rm signaling-server-master.tar.gz

WORKDIR /signaling-server-master

RUN npm install

CMD node index

EXPOSE 8888