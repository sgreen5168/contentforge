FROM node:22-slim

# Install FFmpeg system-wide
RUN apt-get update && \
    apt-get install -y ffmpeg fonts-liberation fonts-dejavu-core && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy from the backend subfolder
COPY video-engine-only\ \(1\)/video-engine/backend/package.json ./
RUN npm install --production

COPY video-engine-only\ \(1\)/video-engine/backend/server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
