FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/
COPY --from=build-client /app/client/dist ./client/dist

WORKDIR /app/server
ENV PORT=3050
EXPOSE 3050
CMD ["node", "index.js"]
