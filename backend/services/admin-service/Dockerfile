FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY shared/ ./shared/
COPY services/admin-service/ ./services/admin-service/
COPY uploads/ ./uploads/
ENV PORT=5004
ENV NODE_ENV=production
EXPOSE 5004
USER node
CMD ["node", "services/admin-service/src/server.js"]
