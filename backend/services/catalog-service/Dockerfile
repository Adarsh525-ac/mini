FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY shared/ ./shared/
COPY services/catalog-service/ ./services/catalog-service/
COPY uploads/ ./uploads/
ENV PORT=5001
ENV NODE_ENV=production
EXPOSE 5001
USER node
CMD ["node", "services/catalog-service/src/server.js"]
