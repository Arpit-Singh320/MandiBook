FROM node:20-alpine

WORKDIR /app

COPY MandiBook_Backend/package*.json ./
RUN npm ci --omit=dev

COPY MandiBook_Backend/ ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
