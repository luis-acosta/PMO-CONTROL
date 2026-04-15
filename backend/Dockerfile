# Use Node.js 18 alpine as base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the app
CMD ["node", "index.js"]
