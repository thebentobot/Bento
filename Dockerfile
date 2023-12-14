FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Install packages
RUN npm ci

RUN npx prisma generate

# Copy the app code
COPY . .

# Build the project
RUN npm run build

# Expose ports
EXPOSE 4422

# Run the application
CMD [ "node", "dist/app.js" ]