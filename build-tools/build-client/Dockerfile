FROM node:12.18.1-alpine

EXPOSE 3000
WORKDIR /app

COPY client/package.json /app/

RUN cd /app &&\
    npm run setup

COPY client/src /app/src/
COPY client/public /app/public/

CMD ["npm", "start"]
