FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_AI_CHAT_URL=http://localhost:8000/chat
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_VIETMAP_API_KEY=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AI_CHAT_URL=$NEXT_PUBLIC_AI_CHAT_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_VIETMAP_API_KEY=$NEXT_PUBLIC_VIETMAP_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

EXPOSE 3000

CMD ["node", "server.js"]
