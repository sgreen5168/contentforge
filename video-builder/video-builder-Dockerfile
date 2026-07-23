FROM node:22-alpine
RUN apk add --no-cache ffmpeg fontconfig ttf-dejavu
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8081
CMD ["node", "server.js"]
