# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Enable Corepack and install the correct Yarn version
RUN corepack enable
RUN corepack prepare yarn@4.0.1 --activate

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy source code
COPY . .

# Build the application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Enable Corepack and install the correct Yarn version
RUN corepack enable
RUN corepack prepare yarn@4.0.1 --activate

# Install production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build

# Set up health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "serve"]
