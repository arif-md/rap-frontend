# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app

# Install git for version script
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .

# Generate version info for local builds
RUN npm run set-version

RUN npm run build --prod

# Stage 2: Runtime
FROM nginx:alpine

# Accept build arguments
ARG APP_VERSION=unknown

# Set environment variables for runtime
ENV APP_VERSION=${APP_VERSION}

# Install Node.js for runtime configuration merging
RUN apk add --no-cache nodejs

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copy runtime configuration merge script
COPY scripts/merge-runtime-config.js /usr/share/nginx/html/scripts/merge-runtime-config.js

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]