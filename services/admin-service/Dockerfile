# Use a lightweight Node.js version
FROM node:22-alpine

# Create the directory inside the container
WORKDIR /usr/src/app

# Copy package files first (this makes builds faster)
COPY package*.json ./

# Install only production dependencies
RUN npm install

# Copy all your service code into the container
COPY . .

# Match the port in your server.js (Admin is 5002)
EXPOSE 5002

# The command to start your microservice
CMD ["npm", "start"]