# Etap 1: Budowanie Reacta (używamy Node 18)
FROM node:18.13.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie plików przez lekki serwer Nginx
FROM nginx:stable-alpine
# Kopiujemy zbudowane pliki (build) do folderu, który obsługuje Nginx
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]