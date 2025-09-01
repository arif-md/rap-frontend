# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get upgrade -y && apt-get clean

COPY . .
RUN npm install && npm run build --prod

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]