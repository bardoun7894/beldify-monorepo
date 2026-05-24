FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV NODE_ENV=development
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "run", "dev"]