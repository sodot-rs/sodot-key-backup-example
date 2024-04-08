FROM node:20
ADD . /sodot-key-backup-example
WORKDIR /sodot-key-backup-example
RUN npm i
EXPOSE 5173
CMD [ "npm", "run", "dev" , "--", "--host"]
