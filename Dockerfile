# -- Build -- #
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the SvelteKit app
RUN npm run build

# -- Production -- #
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the built SvelteKit app from build stage
COPY --from=build /app/build ./build

# Copy the custom server
COPY --from=build /app/server ./server

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Start the custom Node.js server
CMD ["node", "server/index.js"]