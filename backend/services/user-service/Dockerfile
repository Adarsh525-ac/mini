FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY shared/ ./shared/
COPY services/user-service/ ./services/user-service/
ENV PORT=5003
ENV NODE_ENV=production
EXPOSE 5003
USER node
CMD ["node", "services/user-service/src/server.js"]
