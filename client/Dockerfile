# Build stage: Node.js is only needed to produce the static files.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Final image: nginx and the static files, without Node.js or the source code.
FROM nginx:1.28-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy.inc /etc/nginx/conf.d/proxy.inc
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
