FROM node:12.18.1-alpine

WORKDIR /app

COPY service/package.json service/tsconfig.json service/tslint.json service/jest.config.js /app/

RUN cd /app &&\
    npm run setup

COPY service/src /app/src/
RUN npm run compile &&\
    npm run lint
    
CMD ["./node_modules/.bin/nodemon", "--delay", "4000ms", "--watch", "dist", "dist/server.js"]
