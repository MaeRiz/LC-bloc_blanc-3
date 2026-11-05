FROM node:22-alpine

WORKDIR /app

# Copied first: Docker reuses this layer while the dependencies do not change.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# The process does not run as root: a compromised API has fewer rights.
RUN mkdir -p uploads && chown -R node:node uploads
USER node

ENV NODE_ENV=production

EXPOSE 5030

CMD ["node", "server.js"]
