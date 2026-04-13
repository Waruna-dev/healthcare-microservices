# Use the same lightweight Node.js version
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# CHANGE THIS PORT to match your patient-service server.js!
EXPOSE 5005

CMD ["npm", "start"]