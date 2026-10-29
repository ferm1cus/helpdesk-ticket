FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /app/data && chown node:node /app/data

ENV PORT=3000 \
    DB_FILE=/app/data/helpdesk.db

USER node
EXPOSE 3000

CMD ["node", "backend/server.js"]