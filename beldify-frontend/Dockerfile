FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=3001
# Match the live API host. The prod image (Dockerfile.prod) also defaults to
# pro.beldify.com. If you build the dev image behind a different gateway, pass
# `--build-arg NEXT_PUBLIC_API_URL=...` — NEXT_PUBLIC_* is baked at build time.
ENV NEXT_PUBLIC_API_URL=https://pro.beldify.com

EXPOSE 3001

CMD ["npm", "run", "start:dev"]