# Psitest-Imagem

Este aplicativo permite extrair dados sobre quais respostas foram escolhidas para um teste de multipla-escolha preenchido, através apenas da imagem do teste preenchido.

Por enquanto, por uma limitação dos dados disponíveis para treinamento do modelo, é necessário fornecer, junto com o teste, a imagem dos quadrados de resposta, para que o modelo possa identificar quais quadrados estão marcados.

A idéia deste aplicativo é armazenar além dos quadrados, as posições onde os quadrados estão com relação a imagem, permitindo o treinamento de um modelo de segmentação de imagem, que possa identificar os quadrados marcados sem a necessidade de fornecer a imagem dos quadrados.

Por enquanto, o aplicativo é capaz de dizer se um quadrado marcado está confirmado, cancelado ou vazio.

O aplicativo funciona da seguinte forma:

1. Upload de uma imagem do teste de múltipla escolha/
2. Upload de uma ou mais imagens dos quadrados (pode ser interessante fornecer uma imagem de um quadrado vazio e de um quadrado completamente preenchido).
3. O aplicativo identifica a posição dos quadrados na imagem com base nos templates.
4. Opcionalmente, o usuário pode adicionar, remover ou editar os quadrados na imagem.
5. Quando o usuário estiver satisfeito com os quadrados e pressionar o botão "processar", o aplicativo identificará quais quadrados estão marcados e exibirá na tela qual foi a alternativa escolhida em cada pergunta.
6. Opcionalmente, o usuário pode editar a marcação de um quadrado, caso o modelo tenha errado.

Durante todo o processo os dados sobre a posição e o label de cada quadrado é atualizado em tempo real com um banco de dados MongoDB. A ideia é que posteriormente esses dados sejam utilizados para o treinamento do modelo de segmentação de imagem, permitindo identificar as respostas para diferentes layouts de teste.

## Utilização do projeto

Para que o aplicativo funcione, é necessário que o back-end também esteja em execução. Para isso, é necessário inicialmente clonar os dois repositórios:

```bash
mkdir psitest-imagem
cd psitest-imagem
git clone https://github.com/vitorcapdeville/psitest-imagem-front.git
git clone https://github.com/vitorcapdeville/psitest-imagem.git
```

O front-end precisa de um arquivo .env na raiz do projeto com a seguinte variável de ambiente:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

O back-end precisa de um arquivo .env na raiz do projeto com as seguintes variáveis de ambiente:

```
MONGODB_URL=localhost:27017
```

Em seguida, é necessário instalar as dependências de cada projeto.

Para o front-end:

```bash
npm install
```

Para o back-end:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Além disso, é necessário que o MongoDB esteja em execução na porta 27017 (ou a porta especificada no .env).

Por fim, é necessário inicializar o back-end e o front-end:

Front-end:

```bash
npm run dev
```

Back-end:

```bash
source .venv/bin/activate
fastapi run
```

O aplicativo está disponível em http://localhost:3000.
