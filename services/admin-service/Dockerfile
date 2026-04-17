# Use a lightweight Node.js version
FROM node:22-alpine

# Create the directory inside the container
WORKDIR /usr/src/app

# Copy package files first (this makes builds faster)
COPY package*.json ./

# Install dependencies (using 'ci' is safer for production builds)
RUN npm ci

# Copy all your service code into the container
COPY . .

# Expose the specific port the Admin Service uses
EXPOSE 5002

# The command to start your microservice
CMD ["npm", "start"]