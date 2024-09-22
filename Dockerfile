# Use a imagem oficial do Node.js
FROM node:18-alpine

# Defina o argumento de build
ARG NEXT_PUBLIC_API_URL

# Defina a variável de ambiente
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Crie um diretório de trabalho no contêiner
WORKDIR /app

# Copie o arquivo de pacotes para o contêiner
COPY package*.json ./

# Instalar dependências do canvas
RUN apk update && apk add build-base g++ cairo-dev pango-dev giflib-dev

# Instale as dependências
RUN npm install

# Copie o código do aplicativo para o contêiner
COPY . .

RUN npm run build

# Exponha a porta em que a aplicação será executada
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start"]