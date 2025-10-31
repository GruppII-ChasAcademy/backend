# Multi-stage build för Node.js och C++
FROM node:18-alpine AS node-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Kopiera Node.js app
COPY --from=node-builder /app/node_modules ./node_modules
COPY . .

# Installera build tools för C++
RUN apk add --no-cache g++ make cmake

# Kompilera C++ sensor kod
RUN g++ -std=c++11 -I. -o sensor_server main.cpp sensor_controller.cpp threshold_checker.cpp swagger_controller.cpp -lpthread

# Expose ports
EXPOSE 3000 8080

# Starta både Node.js och C++ server
CMD ["sh", "-c", "node src/app.js & ./sensor_server"]
