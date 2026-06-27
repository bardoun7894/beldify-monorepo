FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_API_URL=https://api.beldify.com

EXPOSE 3001

CMD ["npm", "run", "start:dev"]