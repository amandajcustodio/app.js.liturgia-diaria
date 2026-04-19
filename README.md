# Liturgia Diaria - Frontend

Interface web simples (HTML, CSS e JavaScript) que consome a API para mostrar a liturgia do dia.

## Tecnologias

- HTML
- CSS
- JavaScript (vanilla)

## Funcionalidade

A pagina:

- Faz requisicao para `https://api-nodejs-liturgia-diaria.vercel.app/missallete/today`
- Exibe titulo com a data do dia
- Renderiza link para PDF quando `type = "pdf"`
- Renderiza HTML diretamente quando `type = "html"`
- Mostra mensagem de erro quando a API falha

## Estrutura

- `index.html`: estrutura da pagina
- `style.css`: estilos da interface
- `app.js`: consumo da API e renderizacao de conteudo

## Requisitos

- Navegador moderno
- API disponivel em `https://api-nodejs-liturgia-diaria.vercel.app`

## Como executar

Opcao 1 (mais simples):

- Abra `index.html` no navegador

Opcao 2 (recomendado para desenvolvimento):

- Servir os arquivos com um servidor estatico local

Exemplo com `npx serve`:

```bash
npx serve .
```

Depois abra a URL exibida no terminal.

## Dependencia do backend

O frontend depende do endpoint:

- `GET https://api-nodejs-liturgia-diaria.vercel.app/missallete/today`

Se o backend estiver em outra URL/porta, altere a constante `API_URL` no arquivo `app.js`.

## Resposta esperada da API

```json
{
  "type": "html",
  "date": "2026-04-19",
  "content": "<div>...</div>"
}
```

Ou:

```json
{
  "type": "pdf",
  "date": "2026-04-19",
  "content": "https://...pdf"
}
```
