# 1단계: Build 환경
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 복사
COPY package.json package-lock.json* ./
RUN npm install

# 앱 코드 복사
COPY . .

# Next.js build
RUN npm run build

# 2단계: Production 실행 환경
FROM node:20-alpine AS runner

# Next.js가 static 파일 서빙 시 필요한 디렉토리
WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과와 node_modules만 가져오기
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
