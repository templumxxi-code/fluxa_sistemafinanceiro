# ✅ Checklist de Deploy Hostinger

## **FASE 1: Preparação Local (Seu PC)**

- [ ] **Verificar código**
  - [ ] Executar `node --check server.js`
  - [ ] Executar `node --check database.js`
  - [ ] Verificar se não há erros de lógica

- [ ] **Atualizar dependências**
  ```bash
  npm install
  ```
  - [ ] Confirmar que `mysql2` foi instalado
  - [ ] Verificar `package.json` tem `"mysql2": "^3.6.5"`

- [ ] **Testar localmente**
  ```bash
  npm start
  ```
  - [ ] Acessar http://localhost:3000
  - [ ] Fazer login
  - [ ] Testar cadastro de investimento
  - [ ] Verificar no console do Node se há erros

- [ ] **Preparar variáveis de ambiente**
  - [ ] Anotar todas as credenciais do Hostinger:
    - Domínio: ________________
    - SSH Host: ________________
    - SSH User: ________________
    - SSH Password: ________________
    - SSH Port: ________________
    - MySQL Host: ________________
    - MySQL User: ________________
    - MySQL Password: ________________
    - MySQL Database: ________________

- [ ] **Commit final**
  ```bash
  git add .
  git commit -m "Prepara deploy para Hostinger - Adiciona suporte MySQL"
  git push origin main
  ```

---

## **FASE 2: Configuração Hostinger (Painel Web)**

- [ ] **Comprar Cloud Hosting**
  - [ ] Acesso: https://www.hostinger.com.br/
  - [ ] Plano recomendado: intermediário (~R$ 70-100/mês)
  - [ ] Incluir Node.js? **SIM**
  - [ ] Region: **América Latina**
  - [ ] Anotar todas as credenciais

- [ ] **Criar Banco de Dados MySQL**
  - [ ] Painel → Databases → Criar novo
  - [ ] Nome: `fluxa_db` (ou seu nome)
  - [ ] Usuário: anotar
  - [ ] Senha: anotar (guarde em local seguro!)
  - [ ] Host: `localhost` ou fornecido

- [ ] **Configurar SSL/HTTPS**
  - [ ] Painel → SSL/TLS → Ativar Let's Encrypt
  - [ ] Aguardar certificado ser emitido
  - [ ] Confirmar que HTTPS está ativo

---

## **FASE 3: Deploy via SSH**

### **3.1 Conectar ao servidor**

**Windows 10+ (PowerShell):**
```powershell
ssh username@seu-dominio.com
# Ou com porta customizada:
ssh -p 2222 username@seu-dominio.com
```

**Windows 7-8 (PuTTY):**
- Download: https://www.putty.org/
- Host: seu-dominio.com
- Port: 22 ou 2222
- Username: username
- Password: senha

### **3.2 No servidor, clonar repositório**

```bash
# Entrar na pasta public_html
cd public_html

# Limpar pasta se necessário
rm -rf *

# Clonar repositório
git clone https://github.com/templumxxi-code/fluxa_sistemafinanceiro.git .

# Verificar se arquivos chegaram
ls -la
```

- [ ] Confirmar que `server.js`, `database.js`, etc. estão presentes
- [ ] Confirmar que pasta `data/` existe

### **3.3 Instalar dependências**

```bash
# Verificar Node.js
node --version
npm --version

# Se Node não existir, ativar via painel Hostinger

# Instalar dependências
npm install
```

- [ ] Aguardar `npm install` terminar
- [ ] Verificar que `node_modules/mysql2` foi instalado
- [ ] Verificar que não há erros críticos

### **3.4 Criar arquivo .env**

```bash
# Criar arquivo .env
nano .env

# Colar conteúdo abaixo e EDITAR com suas credenciais:
```

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=seu-usuario-mysql
DB_PASSWORD=sua-senha-mysql-aqui
DB_NAME=seu-banco-dados
DB_PORT=3306
JWT_SECRET=uma-chave-super-secreta-e-complexa-mudar-isto
CORS_ORIGIN=https://seu-dominio.com
```

**Salvar:** `Ctrl+X` → `Y` → `Enter`

- [ ] Verificar que `.env` foi criado
  ```bash
  cat .env
  ```

### **3.5 Criar tabelas no banco de dados**

```bash
# Opção 1: Via PhpMyAdmin (Painel Hostinger)
# - Acessar phpmyadmin.seu-dominio.com
# - Ir em SQL
# - Copiar conteúdo de criar-tabelas-mysql.sql
# - Executar

# Opção 2: Via SSH
mysql -h localhost -u seu-usuario -p seu-banco < criar-tabelas-mysql.sql
# Digite a senha quando solicitado
```

- [ ] Confirmar que tabelas foram criadas
  ```bash
  mysql -h localhost -u seu-usuario -p seu-banco -e "SHOW TABLES;"
  ```

### **3.6 Iniciar aplicação**

```bash
# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Iniciar a aplicação
pm2 start server.js --name "fluxa"

# Salvar para iniciar automaticamente
pm2 startup
pm2 save

# Verificar status
pm2 status
```

- [ ] Verificar que processo está "online"
- [ ] Testar acesso: `curl http://localhost:3000`

### **3.7 Configurar Reverse Proxy (se necessário)**

```bash
# Geralmente Hostinger faz isso automaticamente
# Mas se não funcionar, configure:

# Para Nginx:
# Editar /etc/nginx/sites-available/default

# Para Apache:
# Editar .htaccess ou habilitar ProxyPass
```

- [ ] Testar acesso via domínio: https://seu-dominio.com

---

## **FASE 4: Testar Aplicação**

### **4.1 Testes Funcionais**

- [ ] **Acessar página inicial**
  - [ ] Abrir https://seu-dominio.com
  - [ ] Verificar se carrega

- [ ] **Fazer login**
  - [ ] Email: test@example.com (ou seu email)
  - [ ] Senha: (configurada no banco)
  - [ ] Verificar se redireciona para dashboard

- [ ] **Cadastrar investimento**
  - [ ] Preencher formulário
  - [ ] Clicar em "Salvar"
  - [ ] Verificar se aparece na tabela
  - [ ] **IMPORTANTE:** Verificar console do navegador (F12) para erros

- [ ] **Adicionar gasto rápido**
  - [ ] Preencher valor
  - [ ] Clicar em "Adicionar"
  - [ ] Verificar se aparece em "Despesas"

- [ ] **Visualizar relatórios**
  - [ ] Ir para "Relatórios"
  - [ ] Verificar gráficos
  - [ ] Tentar gerar PDF

- [ ] **Fazer logout**
  - [ ] Clicar em "Sair"
  - [ ] Verificar se volta para login

### **4.2 Verificar Logs**

```bash
# Ver logs em tempo real
pm2 logs fluxa

# Ver logs de erro
pm2 logs fluxa --err

# Monitorar em tempo real
pm2 monit
```

- [ ] Verificar que não há erros JavaScript
- [ ] Verificar que requisições à API estão retornando 200

### **4.3 Testes de Performance**

```bash
# Medir tempo de resposta
curl -w "Tempo: %{time_total}s\n" https://seu-dominio.com

# Verificar headers
curl -i https://seu-dominio.com
```

- [ ] Tempo de resposta < 2 segundos
- [ ] Header `Content-Security-Policy` presente
- [ ] HTTPS ativo (veficiar certificado válido)

---

## **FASE 5: Problemas Comuns & Soluções**

### **❌ "Cannot GET /"**
```bash
# Verificar se app está rodando
pm2 list

# Se não está, iniciar
pm2 start server.js --name "fluxa"

# Verificar porta
netstat -an | grep 3000
```

### **❌ "Cannot connect to database"**
```bash
# Testar conexão com MySQL
mysql -h localhost -u seu-usuario -p seu-banco

# Se não conectar, verificar:
# 1. Credenciais em .env
# 2. Banco existe: mysql -e "SHOW DATABASES;"
# 3. Usuário tem permissões
```

### **❌ "CORS error"**
```bash
# Verificar CORS_ORIGIN em .env
cat .env | grep CORS

# Se corrigiu, reiniciar app
pm2 restart fluxa
```

### **❌ "SSL certificate error"**
```bash
# Regenerar certificado SSL via painel Hostinger
# Ou via CLI:
certbot renew
```

### **❌ "PM2: command not found"**
```bash
# Reinstalar PM2 globalmente
npm install -g pm2
pm2 startup
```

---

## **FASE 6: Manutenção Pós-Deploy**

- [ ] **Criar backup do banco**
  ```bash
  mysqldump -h localhost -u seu-usuario -p seu-banco > backup.sql
  ```

- [ ] **Configurar backups automáticos**
  - [ ] Acessar painel Hostinger
  - [ ] Backups → Ativar automático (diário)

- [ ] **Monitorar uptime**
  - [ ] Usar ferramenta: UptimeRobot (gratuita)
  - [ ] Configurar alertas por email

- [ ] **Atualizar código futuramente**
  ```bash
  cd public_html
  git pull origin main
  npm install
  pm2 restart fluxa
  ```

- [ ] **Rotacionar JWT_SECRET** (a cada 3 meses)
  - [ ] Gerar novo secret
  - [ ] Atualizar .env
  - [ ] Reiniciar app

---

## **Suporte Hostinger**

📞 **Chat**: 24/7 em português  
📧 **Email**: support@hostinger.com.br  
📖 **Docs**: https://support.hostinger.com/

---

## **Após Deploy Bem-Sucedido**

1. ✅ Testar todas funcionalidades
2. ✅ Solicitar aos usuários para testar
3. ✅ Corrigir bugs reportados
4. ✅ Monitorar logs nos próximos 7 dias
5. ✅ Fazer backup inicial do banco

---

**Tudo pronto? Comece pela FASE 1!** 🚀
