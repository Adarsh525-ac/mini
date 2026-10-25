FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY shared/ ./shared/
COPY services/api-gateway/ ./services/api-gateway/
COPY uploads/ ./uploads/
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["node", "services/api-gateway/src/gateway.js"]
