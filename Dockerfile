FROM node:24.11.1-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./

COPY packages/backend/package.json ./packages/backend/

RUN npm ci --workspace=backend --omit=dev

COPY packages/backend/src ./packages/backend/src

ENV NODE_ENV=production

USER node

EXPOSE 8000

CMD ["npm", "run", "start:backend"]