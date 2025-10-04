# -- Build -- #
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# -- Production -- #
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from build stage
COPY --from=build /app/build ./build

# Copy server files
COPY server ./server

EXPOSE 3000

# Start the Node.js server (not nginx)
CMD ["node", "server/index.js"]