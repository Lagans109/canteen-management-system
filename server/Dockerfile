# npm-workspaces monorepo: build context must be the repo root, e.g.
#   docker build -f server/Dockerfile .

# --- build stage -----------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci -w server

COPY server/tsconfig.json server/tsconfig.build.json server/
COPY server/src server/src
RUN npm run build -w server

# --- runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci -w server --omit=dev && npm cache clean --force

COPY --from=build /repo/server/dist ./server/dist

USER node
EXPOSE 4000
CMD ["node", "server/dist/server.js"]
