const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('./database');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fluxa-secret-key-default-change-me';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir arquivos estáticos

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
}

// Rota de login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Tentativa de login:', email);

    db.getUserByEmail(email, (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (!user) {
            console.log('Usuário não encontrado:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log('Usuário encontrado:', user.email, 'Role:', user.role);

        if (!db.validatePassword(password, user.password)) {
            console.log('Senha inválida para:', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    });
});

// Rota para obter dados do usuário atual
app.get('/api/user', authenticateToken, (req, res) => {
    db.getUserById(req.user.id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(user);
    });
});

// Rotas de administração de usuários (apenas admin)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    db.getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(users);
    });
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
    const { email, password, name, role = 'user' } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    db.createUser({ email, password, name, role }, (err, userId) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Email já cadastrado' });
            }
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }

        res.status(201).json({ id: userId, message: 'Usuário criado com sucesso' });
    });
});

app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    db.updateUser(id, { name, role, is_active }, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
        res.json({ message: 'Usuário atualizado com sucesso' });
    });
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.deleteUser(id, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar usuário' });
        }
        res.json({ message: 'Usuário desativado com sucesso' });
    });
});

// Rotas de dados financeiros
app.get('/api/financial-data', authenticateToken, (req, res) => {
    const filters = {
        type: req.query.type,
        centro_id: req.query.centro_id,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
    };

    db.getFinancialData(req.user.id, filters, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(data);
    });
});

app.post('/api/financial-data', authenticateToken, (req, res) => {
    const data = req.body;
    data.user_id = req.user.id;

    db.createFinancialData(req.user.id, data, (err, id) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar dados' });
        }
        res.status(201).json({ id, message: 'Dados salvos com sucesso' });
    });
});

app.put('/api/financial-data/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const data = req.body;

    db.updateFinancialData(id, req.user.id, data, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar dados' });
        }
        res.json({ message: 'Dados atualizados com sucesso' });
    });
});

app.delete('/api/financial-data/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.deleteFinancialData(id, req.user.id, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar dados' });
        }
        res.json({ message: 'Dados deletados com sucesso' });
    });
});

// Rotas de centros financeiros
app.get('/api/financial-centers', authenticateToken, (req, res) => {
    db.getFinancialCenters(req.user.id, (err, centers) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(centers);
    });
});

app.post('/api/financial-centers', authenticateToken, (req, res) => {
    const data = req.body;

    db.createFinancialCenter(req.user.id, data, (err, id) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao criar centro financeiro' });
        }
        res.status(201).json({ id, message: 'Centro financeiro criado com sucesso' });
    });
});

app.put('/api/financial-centers/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const data = req.body;

    db.updateFinancialCenter(id, req.user.id, data, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar centro financeiro' });
        }
        res.json({ message: 'Centro financeiro atualizado com sucesso' });
    });
});

app.delete('/api/financial-centers/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.deleteFinancialCenter(id, req.user.id, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar centro financeiro' });
        }
        res.json({ message: 'Centro financeiro deletado com sucesso' });
    });
});

// Rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Rota para servir o login.html
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});