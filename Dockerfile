FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend-router/package.json frontend-router/package-lock.json ./frontend-router/
COPY frontend-state/package.json frontend-state/package-lock.json ./frontend-state/

RUN npm ci \
  && npm ci --prefix backend \
  && npm ci --prefix frontend-router \
  && npm ci --prefix frontend-state

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend && npm cache clean --force

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/database ./backend/database
COPY --from=build /app/frontend-router/dist ./frontend-router/dist

EXPOSE 3000

CMD ["npm", "run", "start:production", "--prefix", "backend"]
