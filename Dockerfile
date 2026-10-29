FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY backend/ ./backend/
COPY frontend/ ./frontend/

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]