# Use a lightweight Node.js version
FROM node:22-alpine

# Create the directory inside the container
WORKDIR /usr/src/app

# Copy package files first (this makes builds faster)
COPY package*.json ./

# Install exact dependencies locked in package-lock.json
RUN npm ci

# Copy all your service code into the container
COPY . .

# Match the port in your server.js (Patient is 5005)
EXPOSE 5005

# The command to start your microservice
CMD ["npm", "start"]