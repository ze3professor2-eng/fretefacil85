Connect Frete - Vercel + Neon setup

This folder contains the static site (unchanged) and serverless API routes to run on Vercel using a Neon (Postgres) database.

Files added:
- /api/* - serverless API endpoints (drivers, payments, settings, approved-driver)
- /api/db.js - Postgres pooling and init helper
- /public/server-db-shim.js - client shim to call the server API (keeps client code unchanged)
- /db/init.sql - optional SQL init script
- package.json - declares Node runtime and dependency on pg
- .env.example - environment variables example
- vercel.json - Vercel configuration

Deploy steps (summary):
1. Create a GitHub repo and push this project (do NOT modify site HTML/CSS).
2. On Vercel, create a new project from GitHub repo.
3. Create a Neon database and copy its DATABASE_URL to Vercel environment variables.
4. Set the Vercel environment variable DATABASE_URL (Neon connection string).
5. Deploy. The static site will be served and the client will use `/public/server-db-shim.js` to call the serverless API.

See `.env.example` and vercel dashboard for more details.
Connect Frete - servidor local

Passos rápidos (Windows PowerShell):

1. Abrir PowerShell na pasta do projeto (ex: c:\Users\...\fretefacil85\fretefacil85)
2. Instalar dependências:

   npm install

3. Iniciar servidor:

   npm start

O servidor roda por padrão em http://localhost:3000 e expõe um shim `server-db-shim.js` que conecta o frontend aos endpoints locais.
