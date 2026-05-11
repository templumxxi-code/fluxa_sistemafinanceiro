# 🚀 Guia Completo: Migração para Hostinger Cloud Hosting

## **Passo 1: Contratar Cloud Hosting no Hostinger**

### 1.1 Acesse o site
- Vá para https://www.hostinger.com.br/
- Procure por **"Cloud Hosting"** ou **"Aplicações"**
- Escolha um plano (recomendo o plano intermediário: ~R$ 70-100/mês)

### 1.2 Configure a conta
- Escolha seu domínio (novo ou já existente)
- Escolha localização: **América Latina** (melhor ping)
- Node.js: **Certifique-se de escolher plano com Node.js ativo**
- MySQL/PostgreSQL: Escolha **MySQL** (mais compatível)
- Finalize a compra

### 1.3 Após a compra
- Você receberá email com credenciais SSH
- Anote:
  - **Host**: `seu-dominio.com` ou IP fornecido
  - **SSH Port**: Geralmente 22 ou 2222
  - **Username**: username fornecido
  - **Password**: senha fornecida
  - **Database**: nome do banco
  - **DB User**: usuário MySQL
  - **DB Password**: senha MySQL

---

## **Passo 2: Preparar o Código para Deploy**

### 2.1 Instalar ferramentas necessárias
```bash
# Se não tiver Git instalado
# Download em: https://git-scm.com/download/win

# Se não tiver SSH instalado
# Windows 10+: Já vem integrado
# Caso contrário, use PuTTY: https://www.putty.org/
```

### 2.2 Criar arquivo `.env` para produção
Crie um arquivo `.env` na raiz do projeto:

```env
# Hostinger Production
NODE_ENV=production
PORT=3000

# Database (MySQL)
DB_HOST=seu-host-mysql.hostinger.com
DB_USER=seu-usuario-mysql
DB_PASSWORD=sua-senha-mysql
DB_NAME=seu-banco-dados
DB_PORT=3306

# JWT
JWT_SECRET=sua-chave-secreta-super-complexa-aqui-change-me

# Cors
CORS_ORIGIN=https://seu-dominio.com
```

### 2.3 Atualizar `database.js` para usar MySQL
```javascript
// Adicionar suporte a MySQL em database.js
const mysql = require('mysql2/promise');

let db;

if (process.env.NODE_ENV === 'production') {
    // MySQL em produção
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
} else {
    // SQLite em desenvolvimento
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./data/financial.db');
}
```

### 2.4 Atualizar `package.json`
```json
{
  "name": "fluxa-sistema-financeiro",
  "version": "1.0.0",
  "description": "Sistema de Controle Financeiro",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --check server.js && node --check database.js && node --check auth.js && node --check script.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "sqlite3": "^5.1.6",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

---

## **Passo 3: Deploy via SSH no Hostinger**

### 3.1 Conectar via SSH (Windows 10+)
```bash
# Abra o PowerShell e conecte
ssh username@seu-dominio.com
# Ou com porta customizada:
ssh -p 2222 username@seu-dominio.com

# Digite a senha quando solicitado
```

### 3.2 No servidor Hostinger, clone o repositório
```bash
# Entre na pasta de aplicações (geralmente /home/seu-usuario/public_html ou app)
cd /home/seu-usuario/public_html

# Clone seu repositório
git clone https://github.com/templumxxi-code/fluxa_sistemafinanceiro.git .

# Ou se quiser em subpasta:
git clone https://github.com/templumxxi-code/fluxa_sistemafinanceiro.git fluxa
cd fluxa
```

### 3.3 Instalar dependências
```bash
# Instale Node.js (pode já estar instalado)
node --version
npm --version

# Se não tiver, o Hostinger fornece via painel

# Instale as dependências
npm install
```

### 3.4 Configurar variáveis de ambiente
```bash
# Crie o arquivo .env com as credenciais do banco
nano .env

# Cole:
NODE_ENV=production
PORT=3000
DB_HOST=seu-host-mysql
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=seu-banco
DB_PORT=3306
JWT_SECRET=mudar-isto-por-uma-chave-secreta

# Salve: Ctrl+X, Y, Enter
```

### 3.5 Criar banco de dados
```bash
# Se ainda não criou via painel Hostinger, faça:
# Use phpMyAdmin (fornecido pelo Hostinger) ou MySQL client

# Via terminal:
mysql -h seu-host -u seu-usuario -p seu-banco < criar-tabelas.sql

# Ou execute as migrations pelo Node
node -e "require('./database.js').createTables()"
```

### 3.6 Iniciar a aplicação
```bash
# Teste localmente antes
npm start

# Se funcionar, instale PM2 (gerenciador de processos)
npm install -g pm2

# Inicie a app com PM2
pm2 start server.js --name "fluxa"

# Configure para iniciar automaticamente
pm2 startup
pm2 save
```

---

## **Passo 4: Configurar Domínio e SSL**

### 4.1 Apontar domínio
- No painel Hostinger, vá para **Domínios**
- Aponte seu domínio para a aplicação Node.js
- Configure as DNS records:
  - **A Record**: Aponta para IP do servidor

### 4.2 Ativar HTTPS/SSL
- Hostinger fornece certificado gratuito (Let's Encrypt)
- Ative via painel **SSL/TLS**
- Reinicie a aplicação após ativar

### 4.3 Configurar Reverse Proxy (se necessário)
- Se a app roda na porta 3000, configure um reverse proxy no Nginx/Apache
- Hostinger geralmente faz isso automaticamente

---

## **Passo 5: Migrar Dados do Railway para Hostinger**

### 5.1 Exportar dados do Railway
```bash
# No seu PC, se tiver acesso ao banco Railway:
pg_dump postgres://user:pass@railway-host:5432/fluxa > backup.sql
```

### 5.2 Converter PostgreSQL → MySQL (se necessário)
```bash
# Use uma ferramenta de conversão
# Opção 1: Online converter
# Opção 2: Manual - adaptar tipos de dados
```

### 5.3 Importar no Hostinger
```bash
# Via SSH:
mysql -h seu-host -u seu-usuario -p seu-banco < backup.sql
```

---

## **Passo 6: Testar a Aplicação**

### 6.1 Acessar pelo domínio
- Vá para `https://seu-dominio.com`
- Faça login
- Teste todas as funcionalidades:
  - ✅ Cadastrar investimento
  - ✅ Adicionar gasto rápido
  - ✅ Visualizar relatórios
  - ✅ Fazer logout

### 6.2 Verificar logs de erro
```bash
# Via SSH, verifique logs do PM2
pm2 logs fluxa

# Ou monitore em tempo real
pm2 monit
```

### 6.3 Monitorar performance
- Use ferramentas: Hostinger Dashboard, PM2, ou New Relic

---

## **Troubleshooting**

### ❌ "Connection refused" (Erro de conexão com MySQL)
**Solução:**
- Verifique IP na whitelist do Hostinger
- Confirme credenciais no `.env`
- Teste via SSH: `mysql -h host -u user -p`

### ❌ "Port 3000 already in use"
**Solução:**
```bash
# Mude a porta no .env ou:
pm2 kill
pm2 start server.js
```

### ❌ "Cannot find module" durante `npm install`
**Solução:**
```bash
# Limpe cache
npm cache clean --force
npm install
```

### ❌ "CORS error" ao acessar API
**Solução:**
- Verifique `CORS_ORIGIN` no `.env`
- Adicione header correto em `server.js`

---

## **Próximas Etapas Após Deploy**

1. ✅ Fazer backup automático do banco (diário)
2. ✅ Configurar alertas de erro (PM2+)
3. ✅ Monitorar uptime
4. ✅ Adicionar firewall de aplicação (WAF)
5. ✅ Configurar rate limiting na API

---

## **Suporte Hostinger**

- Chat ao vivo: 24/7 (em português)
- Email: support@hostinger.com.br
- Documentação: https://support.hostinger.com/pt/articles/

---

**Pronto para começar?** Qual etapa você quer fazer primeiro? 🚀
