FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY shared/ ./shared/
COPY services/playlist-service/ ./services/playlist-service/
ENV PORT=5002
ENV NODE_ENV=production
EXPOSE 5002
USER node
CMD ["node", "services/playlist-service/src/server.js"]
