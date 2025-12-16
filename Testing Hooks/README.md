# React Hooks - Testes e Solução de Problemas

Aplicação para testar e resolver problemas comuns com React Hooks.

## Instalação

```bash
npm install
```

## Executar

```bash
npm start
```

Ou em modo desenvolvimento (com auto-reload):

```bash
npm run dev
```

O servidor iniciará na porta 5000 e abrirá automaticamente o navegador em `http://localhost:5000/problems`.

## Estrutura

- `server/` - Servidor Express com EJS
  - `views/` - Templates EJS
  - `public/` - Arquivos estáticos (CSS, JS)
  - `index.js` - Servidor principal

## Rotas

- `/` - Redireciona para `/problems`
- `/problems` - Página de resolução de problemas
- `/tests` - Página de testes de hooks
- `/examples` - Página de exemplos avançados