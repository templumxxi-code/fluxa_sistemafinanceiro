const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = './fluxa.db';
const DATABASE_URL = process.env.DATABASE_URL;

class Database {
    constructor() {
        if (DATABASE_URL) {
            this.type = 'postgres';
            this.pool = new Pool({
                connectionString: DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            this.initPostgres();
        } else {
            this.type = 'sqlite';
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
                } else {
                    console.log('Conectado ao banco de dados SQLite.');
                    this.initSQLite();
                }
            });
        }
    }

    async initPostgres() {
        try {
            await this.pool.query('SELECT 1');
            console.log('Conectado ao PostgreSQL.');

            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_lifetime BOOLEAN DEFAULT FALSE
                )
            `);

            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS financial_data (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    type TEXT NOT NULL,
                    category TEXT,
                    amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT,
                    centro_id TEXT DEFAULT 'default',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS financial_centers (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    name TEXT NOT NULL,
                    type TEXT DEFAULT 'conta',
                    balance REAL DEFAULT 0,
                    description TEXT DEFAULT '',
                    orcamento REAL DEFAULT 0,
                    alerta_percentual REAL DEFAULT 90,
                    meta REAL DEFAULT 0,
                    banco TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await this.createAdminUser();
        } catch (err) {
            console.error('Erro ao inicializar PostgreSQL:', err);
        }
    }

    initSQLite() {
        const self = this;

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
                setTimeout(() => self.createAdminUser(), 100);
            }
        });

        this.db.run(`
            CREATE TABLE IF NOT EXISTS financial_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
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

        this.db.run(`
            CREATE TABLE IF NOT EXISTS financial_centers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT DEFAULT 'conta',
                balance REAL DEFAULT 0,
                description TEXT DEFAULT '',
                orcamento REAL DEFAULT 0,
                alerta_percentual REAL DEFAULT 90,
                meta REAL DEFAULT 0,
                banco TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela financial_centers:', err);
            }
        });
    }

    async createAdminUser() {
        const adminEmail = 'admin@fluxa.com';
        const adminPassword = 'AdminFluxa123';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);

        if (this.type === 'postgres') {
            try {
                const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
                if (existing.rowCount === 0) {
                    const res = await this.pool.query(`
                        INSERT INTO users (email, password, role, name, is_active, is_lifetime)
                        VALUES ($1, $2, 'admin', 'Administrador Fluxa', TRUE, TRUE)
                        RETURNING id
                    `, [adminEmail, hashedPassword]);
                    console.log('Usuário admin criado com ID:', res.rows[0].id);
                }
            } catch (err) {
                console.error('Erro ao criar admin no PostgreSQL:', err);
            }
        } else {
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
    }

    createUser(userData, callback) {
        const { email, password, name, role = 'user' } = userData;
        const hashedPassword = bcrypt.hashSync(password, 10);

        if (this.type === 'postgres') {
            this.pool.query(`
                INSERT INTO users (email, password, role, name)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [email, hashedPassword, role, name])
                .then((res) => callback(null, res.rows[0].id))
                .catch((err) => callback(err, null));
        } else {
            this.db.run(`
                INSERT INTO users (email, password, role, name)
                VALUES (?, ?, ?, ?)
            `, [email, hashedPassword, role, name], function(err) {
                callback(err, this ? this.lastID : null);
            });
        }
    }

    getUserByEmail(email, callback) {
        if (this.type === 'postgres') {
            this.pool.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email])
                .then((res) => callback(null, res.rows[0]))
                .catch(callback);
        } else {
            this.db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email], callback);
        }
    }

    getUserById(id, callback) {
        if (this.type === 'postgres') {
            this.pool.query(
                'SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users WHERE id = $1',
                [id]
            )
                .then((res) => callback(null, res.rows[0]))
                .catch(callback);
        } else {
            this.db.get('SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users WHERE id = ?', [id], callback);
        }
    }

    getAllUsers(callback) {
        if (this.type === 'postgres') {
            this.pool.query('SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users ORDER BY created_at DESC')
                .then((res) => callback(null, res.rows))
                .catch(callback);
        } else {
            this.db.all('SELECT id, email, role, name, created_at, is_active, is_lifetime FROM users ORDER BY created_at DESC', callback);
        }
    }

    updateUser(id, userData, callback) {
        const { name, role, is_active } = userData;
        if (this.type === 'postgres') {
            this.pool.query(
                'UPDATE users SET name = $1, role = $2, is_active = $3 WHERE id = $4',
                [name, role, is_active, id]
            )
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run('UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?', [name, role, is_active, id], callback);
        }
    }

    deleteUser(id, callback) {
        if (this.type === 'postgres') {
            this.pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id])
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id], callback);
        }
    }

    validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    }

    createFinancialData(userId, data, callback) {
        const { type, category, amount, date, description, centro_id = 'default' } = data;

        if (this.type === 'postgres') {
            this.pool.query(`
                INSERT INTO financial_data (user_id, type, category, amount, date, description, centro_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [userId, type, category, amount, date, description, centro_id])
                .then((res) => callback(null, res.rows[0].id))
                .catch((err) => callback(err, null));
        } else {
            this.db.run(`
                INSERT INTO financial_data (user_id, type, category, amount, date, description, centro_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, type, category, amount, date, description, centro_id], function(err) {
                callback(err, this ? this.lastID : null);
            });
        }
    }

    getFinancialData(userId, filters = {}, callback) {
        let query;
        let params = [userId];

        if (this.type === 'postgres') {
            query = 'SELECT * FROM financial_data WHERE user_id = $1';
            if (filters.type) {
                query += ' AND type = $' + (params.length + 1);
                params.push(filters.type);
            }
            if (filters.centro_id && filters.centro_id !== 'all') {
                query += ' AND centro_id = $' + (params.length + 1);
                params.push(filters.centro_id);
            }
            if (filters.dateFrom) {
                query += ' AND date >= $' + (params.length + 1);
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ' AND date <= $' + (params.length + 1);
                params.push(filters.dateTo);
            }
            query += ' ORDER BY date DESC, created_at DESC';

            this.pool.query(query, params)
                .then((res) => callback(null, res.rows))
                .catch(callback);
        } else {
            query = 'SELECT * FROM financial_data WHERE user_id = ?';
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
    }

    updateFinancialData(id, userId, data, callback) {
        const { type, category, amount, date, description, centro_id } = data;
        if (this.type === 'postgres') {
            this.pool.query(`
                UPDATE financial_data SET type = $1, category = $2, amount = $3, date = $4, description = $5, centro_id = $6
                WHERE id = $7 AND user_id = $8
            `, [type, category, amount, date, description, centro_id, id, userId])
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run(`
                UPDATE financial_data SET type = ?, category = ?, amount = ?, date = ?, description = ?, centro_id = ?
                WHERE id = ? AND user_id = ?
            `, [type, category, amount, date, description, centro_id, id, userId], callback);
        }
    }

    deleteFinancialData(id, userId, callback) {
        if (this.type === 'postgres') {
            this.pool.query('DELETE FROM financial_data WHERE id = $1 AND user_id = $2', [id, userId])
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run('DELETE FROM financial_data WHERE id = ? AND user_id = ?', [id, userId], callback);
        }
    }

    createFinancialCenter(userId, data, callback) {
        const {
            name,
            type = 'conta',
            balance = 0,
            description = '',
            orcamento = 0,
            alertaPercentual = 90,
            meta = 0
        } = data;
        if (this.type === 'postgres') {
            this.pool.query(`
                INSERT INTO financial_centers (user_id, name, type, balance, description, orcamento, alerta_percentual, meta)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [userId, name, type, balance, description, orcamento, alertaPercentual, meta])
                .then((res) => callback(null, res.rows[0].id))
                .catch((err) => callback(err, null));
        } else {
            this.db.run(`
                INSERT INTO financial_centers (user_id, name, type, balance, description, orcamento, alerta_percentual, meta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, name, type, balance, description, orcamento, alertaPercentual, meta], function(err) {
                callback(err, this ? this.lastID : null);
            });
        }
    }

    getFinancialCenters(userId, callback) {
        if (this.type === 'postgres') {
            this.pool.query('SELECT * FROM financial_centers WHERE user_id = $1 ORDER BY name', [userId])
                .then((res) => callback(null, res.rows))
                .catch(callback);
        } else {
            this.db.all('SELECT * FROM financial_centers WHERE user_id = ? ORDER BY name', [userId], callback);
        }
    }

    updateFinancialCenter(id, userId, data, callback) {
        const {
            name,
            type,
            balance,
            description = '',
            orcamento = 0,
            alertaPercentual = 90,
            meta = 0
        } = data;
        if (this.type === 'postgres') {
            this.pool.query(`
                UPDATE financial_centers SET name = $1, type = $2, balance = $3, description = $4, orcamento = $5, alerta_percentual = $6, meta = $7
                WHERE id = $8 AND user_id = $9
            `, [name, type, balance, description, orcamento, alertaPercentual, meta, id, userId])
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run(`
                UPDATE financial_centers SET name = ?, type = ?, balance = ?, description = ?, orcamento = ?, alerta_percentual = ?, meta = ?
                WHERE id = ? AND user_id = ?
            `, [name, type, balance, description, orcamento, alertaPercentual, meta, id, userId], callback);
        }
    }

    deleteFinancialCenter(id, userId, callback) {
        if (this.type === 'postgres') {
            this.pool.query('DELETE FROM financial_centers WHERE id = $1 AND user_id = $2', [id, userId])
                .then(() => callback(null))
                .catch(callback);
        } else {
            this.db.run('DELETE FROM financial_centers WHERE id = ? AND user_id = ?', [id, userId], callback);
        }
    }

    close() {
        if (this.type === 'postgres') {
            this.pool.end().catch((err) => console.error('Erro ao fechar conexão PostgreSQL:', err));
        } else {
            this.db.close((err) => {
                if (err) {
                    console.error('Erro ao fechar banco de dados:', err);
                } else {
                    console.log('Banco de dados fechado.');
                }
            });
        }
    }
}

module.exports = new Database();