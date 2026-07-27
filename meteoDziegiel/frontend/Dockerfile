# ETAP 1: Budowanie aplikacji
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install axios recharts lucide-react
COPY . .
RUN npm run build

# ETAP 2: Serwowanie przez Nginx
FROM nginx:alpine
# Kopiujemy skompilowane pliki z etapu budowania do domyślnego katalogu Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Wystawiamy port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
