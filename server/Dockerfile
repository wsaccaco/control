FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Explicitly copy server package.json from the ROOT context
COPY server/package*.json ./

RUN npm install

# Explicitly copy all server source code from the ROOT context
COPY server/ .

EXPOSE 3000

CMD ["npm", "start"]
