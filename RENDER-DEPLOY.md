# 🚀 DEPLOYMENT FLUXA NO RENDER - GUIA COMPLETO

## ✅ STATUS ATUAL
- ✅ Código no GitHub: `furrieltubarao-arch/fluxa-sistema-financeiro`
- ✅ Sistema funcionando localmente
- ❌ Projeto ainda não criado no Render

## 📋 PASSO 1: CRIAR CONTA NO RENDER

1. Acesse: **https://render.com**
2. Clique em **"Get Started"** (se não tiver conta)
3. **Login com GitHub** (mais fácil - autoriza automaticamente)

## 📋 PASSO 2: CRIAR NOVO WEB SERVICE

1. No dashboard, clique em **"New"** > **"Web Service"**
2. Selecione **"Connect GitHub"**
3. **Autorize Render** a acessar seu GitHub
4. **Procure por:** `furrieltubarao-arch/fluxa-sistema-financeiro`
5. **Selecione o repositório**
6. Clique em **"Connect"**

## 📋 PASSO 3: CONFIGURAR O SERVIÇO

Preencha os campos:
- **Name:** `fluxa-sistema-financeiro` (ou outro nome)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free` (750 horas/mês, 512MB RAM)

## 📋 PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

1. Na seção **"Environment"**, clique em **"Add Environment Variable"**
2. Adicione estas variáveis:

```
JWT_SECRET=fluxa-secret-key-2024-production-change-this-123456789
NODE_ENV=production
```

> ⚠️ Não defina `PORT` manualmente. O Render fornece a porta automaticamente através de `process.env.PORT`.

## 📋 PASSO 4.1: USAR UM BANCO DE DADOS EXTERNO

Para garantir persistência real e não depender do disco local do Render, use um banco PostgreSQL externo.

1. No painel do Render, clique em **"New"** > **"PostgreSQL"**
2. Escolha um nome e crie o banco de dados
3. O Render vai gerar automaticamente uma variável de ambiente `DATABASE_URL`
4. Não é preciso configurar `DATABASE_URL` manualmente se o banco for o gerenciado do Render

Seu app já está preparado para usar o PostgreSQL.

## 📋 PASSO 5: DEPLOY

1. Clique em **"Create Web Service"**
2. Render fará o build e deploy automaticamente (pode levar alguns minutos)

## 📋 PASSO 6: VERIFICAR URL

1. Vá na aba **"Overview"** do serviço
2. Copie a URL gerada (exemplo: `https://fluxa-sistema-financeiro.onrender.com`)

## ⚠️ NOTAS IMPORTANTES
- O plano gratuito do Render dá **750 horas por mês** (cerca de 31 dias se 24/7).
- Se o app ficar inativo por 15 minutos, ele "hiberna" e acorda na próxima requisição (pode demorar alguns segundos).
- Para manter sempre ativo, considere o plano pago a partir de US$7/mês.
- Monitore o uso em **"Usage"** para não exceder o limite.

## 🔧 POSSÍVEIS PROBLEMAS
- **Erro de porta:** Certifique-se de que o `server.js` usa `process.env.PORT || 3000`.
- **Build falha:** Verifique se o `package.json` tem `scripts.start`.
- **Database:** SQLite funciona no Render, mas dados são efêmeros (perdem ao redeploy). Para persistência, considere PostgreSQL no Render (plano pago).

Se tiver dúvidas, consulte a [documentação do Render](https://docs.render.com).</content>
<parameter name="filePath">c:\Users\luizm\Desktop\Sistema 1\Controle Financeiro  Fluxa 03\RENDER-DEPLOY.md