# ==========================================
# STAGE 1: Build the React Application
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code and build it via Vite
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Serve the App with NGINX
# ==========================================
FROM nginx:alpine

# Copy the compiled React files from Stage 1 into NGINX
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]