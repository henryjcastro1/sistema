# Imagen base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar código
COPY . .

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]