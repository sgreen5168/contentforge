FROM node:22-alpine

# Install system FFmpeg + fonts for captions
# This replaces ffmpeg-static and eliminates Railway sandbox restrictions
RUN apk add --no-cache ffmpeg fontconfig ttf-dejavu

# Set working directory
WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy server code
COPY . .

# Start the server
CMD ["node", "server.js"]
