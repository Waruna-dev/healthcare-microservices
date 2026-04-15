# Use a lightweight Node.js version
FROM node:22-alpine

# Create the directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install exact dependencies locked in package-lock.json
RUN npm ci

# Copy all your service code into the container
COPY . .

# Expose the specific port the API Gateway uses
EXPOSE 5000

# The command to start your microservice
CMD ["npm", "start"]