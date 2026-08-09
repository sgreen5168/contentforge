FROM node:22-slim

# Install FFmpeg system-wide
RUN apt-get update && \
    apt-get install -y ffmpeg fonts-liberation fonts-dejavu-core && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
