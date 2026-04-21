# Fluxa - Sistema de Controle Financeiro

Plataforma financeira SaaS para gestão de receitas, despesas e investimentos.

## 🚀 Deployment na Railway

### Pré-requisitos:
- Conta no GitHub (para versionar o código)
- Conta no Railway (https://railway.app)

### Passo 1: Preparar o repositório Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### Passo 2: Push para GitHub

1. Crie um repositório no GitHub (https://github.com/new)
2. Siga as instruções para fazer push do código local

```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git branch -M main
git push -u origin main
```

### Passo 3: Conectar à Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Autorize a Railway a acessar seu GitHub
5. Selecione o repositório `seu-repositorio`
6. Railway detectará automaticamente como Node.js

### Passo 4: Configurar Variáveis de Ambiente

Na Railway, vá para **Variables** e defina:

```
PORT=3000
JWT_SECRET=sua-chave-secreta-muito-segura-mudada-aqui
NODE_ENV=production
```

### Passo 5: Deploy

Railway fará deploy automaticamente quando você fazer push para `main`!

## 💻 Executar Localmente

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## 🔐 Credenciais Padrão

- **Email:** admin@fluxa.com
- **Senha:** AdminFluxa123

## 📦 Dependências

- Express.js
- SQLite3
- JWT para autenticação
- CORS ativado

## ⚠️ Importante em Produção

1. **Mude o JWT_SECRET** para uma chave segura
2. **Mude a senha padrão** do admin (configure no banco)
3. **Use HTTPS** (Railway fornece automaticamente)
4. **Backup do banco de dados** (SQLite é um arquivo)

## 📝 Estrutura do Projeto

```
├── server.js           # Servidor Node.js/Express
├── database.js         # Camada de banco de dados
├── index.html          # Dashboard principal
├── login.html          # Página de login
├── script.js           # Lógica do frontend
├── auth.js             # Autenticação compartilhada
├── login.js            # Lógica específica de login
├── styles.css          # Estilos
├── package.json        # Dependências npm
└── .env                # Variáveis de ambiente (não commitado)
```

## 🆘 Suporte

Para problemas no deployment na Railway, consulte a documentação: https://docs.railway.app
