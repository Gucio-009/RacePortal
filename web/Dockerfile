# Build (context: repo root — needs packages/api-types for Vite alias)
FROM node:22-alpine AS build
WORKDIR /app

COPY web/package.json web/package-lock.json ./web/
WORKDIR /app/web
RUN npm ci

COPY web/index.html web/vite.config.ts web/tsconfig.json web/postcss.config.mjs ./
COPY web/src ./src
COPY packages/api-types /app/packages/api-types

ARG VITE_API_URL=
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Serve
FROM nginx:1.27-alpine
COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
