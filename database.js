const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = './fluxa.db';

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err.message);
            } else {
                console.log('Conectado ao banco de dados SQLite.');
                this.init();
            }
        });
    }

    init() {
        const self = this;
        // Criar tabela de usuários
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                is_lifetime BOOLEAN DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela users:', err);
            } else {
                console.log('Tabela users criada/verificada');
                // Delay to ensure table is ready
                setTimeout(() => self.createAdminUser(), 100);
            }
        });

        // Criar tabela de dados financeiros
        this.db.run(`
            CREATE TABLE IF NOT EXISTS financial_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL, -- 'receita', 'despesa', 'investimento'
                category TEXT,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                description TEXT,
                centro_id TEXT DEFAULT 'default',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela financial_data:', err);
            }
        });

        // Criar tabela de centros financeiros
        this.db.run(`
            CREATE TABLE IF NOT EXISTS financial_centers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT DEFAULT 'conta',
                balance REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela financial_centers:', err);
            }
        });
    }

    createAdminUser() {
        const adminEmail = 'admin@fluxa.com';
        const adminPassword = 'AdminFluxa123';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);

        this.db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
            if (err) {
                console.error('Erro ao verificar admin:', err);
                return;
            }
            if (!row) {
                this.db.run(`
                    INSERT INTO users (email, password, role, name, is_active, is_lifetime)
                    VALUES (?, ?, 'admin', 'Administrador Fluxa', 1, 1)
                `, [adminEmail, hashedPassword], function(err) {
                    if (err) {
                        console.error('Erro ao criar admin:', err);
                    } else {
                        console.log('Usuário admin criado com ID:', this.lastID);
                    }
                });
            }
        });
    }

    // Métodos para usuários
    createUser(userData, callback) {
        const { email, password, name, role = 'user' } = userData;
        const hashedPassword = bcrypt.hashSync(password, 10);

        this.db.run(`
            INSERT INTO users (email, password, role, name)
            VALUES (?, ?, ?, ?)
        `, [email, hashedPassword, role, name], function(err) {
            callback(err, this ? this.lastID : null);
        });
    }

    getUserByEmail(email, callback) {
        this.db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email], callback);
    }

    getUserById(id, callback) {
        this.db.get('SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users WHERE id = ?', [id], callback);
    }

    getAllUsers(callback) {
        this.db.all('SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users ORDER BY created_at DESC', callback);
    }

    updateUser(id, userData, callback) {
        const { name, role, is_active } = userData;
        this.db.run(`
            UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?
        `, [name, role, is_active, id], callback);
    }

    deleteUser(id, callback) {
        this.db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id], callback);
    }

    validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    }

    // Métodos para dados financeiros
    createFinancialData(userId, data, callback) {
        const { type, category, amount, date, description, centro_id = 'default' } = data;
        this.db.run(`
            INSERT INTO financial_data (user_id, type, category, amount, date, description, centro_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, type, category, amount, date, description, centro_id], function(err) {
            callback(err, this ? this.lastID : null);
        });
    }

    getFinancialData(userId, filters = {}, callback) {
        let query = 'SELECT * FROM financial_data WHERE user_id = ?';
        let params = [userId];

        if (filters.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.centro_id && filters.centro_id !== 'all') {
            query += ' AND centro_id = ?';
            params.push(filters.centro_id);
        }

        if (filters.dateFrom) {
            query += ' AND date >= ?';
            params.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            query += ' AND date <= ?';
            params.push(filters.dateTo);
        }

        query += ' ORDER BY date DESC, created_at DESC';

        this.db.all(query, params, callback);
    }

    updateFinancialData(id, userId, data, callback) {
        const { type, category, amount, date, description, centro_id } = data;
        this.db.run(`
            UPDATE financial_data SET type = ?, category = ?, amount = ?, date = ?, description = ?, centro_id = ?
            WHERE id = ? AND user_id = ?
        `, [type, category, amount, date, description, centro_id, id, userId], callback);
    }

    deleteFinancialData(id, userId, callback) {
        this.db.run('DELETE FROM financial_data WHERE id = ? AND user_id = ?', [id, userId], callback);
    }

    // Métodos para centros financeiros
    createFinancialCenter(userId, data, callback) {
        const { name, type = 'conta', balance = 0 } = data;
        this.db.run(`
            INSERT INTO financial_centers (user_id, name, type, balance)
            VALUES (?, ?, ?, ?)
        `, [userId, name, type, balance], function(err) {
            callback(err, this ? this.lastID : null);
        });
    }

    getFinancialCenters(userId, callback) {
        this.db.all('SELECT * FROM financial_centers WHERE user_id = ? ORDER BY name', [userId], callback);
    }

    updateFinancialCenter(id, userId, data, callback) {
        const { name, type, balance } = data;
        this.db.run(`
            UPDATE financial_centers SET name = ?, type = ?, balance = ?
            WHERE id = ? AND user_id = ?
        `, [name, type, balance, id, userId], callback);
    }

    deleteFinancialCenter(id, userId, callback) {
        this.db.run('DELETE FROM financial_centers WHERE id = ? AND user_id = ?', [id, userId], callback);
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Erro ao fechar banco de dados:', err);
            } else {
                console.log('Banco de dados fechado.');
            }
        });
    }
}

module.exports = new Database();