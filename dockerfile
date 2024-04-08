FROM node:20
ADD . /sodot-key-backup-example
WORKDIR /sodot-key-backup-example
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
RUN npm i
RUN npm run build
EXPOSE 4173
ARG API_KEY
ENV API_KEY=${API_KEY}
CMD ["npm" , "run", "preview", "--", "--host"]
