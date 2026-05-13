const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'ganti_secret_key_ini_di_env';
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, '[]', 'utf8');
        }
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch (error) {
        console.error('Gagal membaca users.json:', error);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`
        <!doctype html>
        <html lang="id">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Jak Sanggar</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 32px; }
                .card { max-width: 760px; margin: 40px auto; background: #111827; border-radius: 18px; padding: 28px; box-shadow: 0 12px 30px rgba(0,0,0,.3); }
                h1 { margin-top: 0; color: #38bdf8; }
                code { background: #020617; padding: 4px 8px; border-radius: 8px; }
                .ok { color: #22c55e; font-weight: bold; }
                .warn { color: #fbbf24; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Jak Sanggar</h1>
                <p class="ok">Server aktif dan berhasil berjalan.</p>
                <p>Endpoint tersedia:</p>
                <p><code>GET /health</code></p>
                <p><code>POST /register</code></p>
                <p><code>POST /login</code></p>
                <p class="warn">Catatan: akun disimpan di file users.json agar tidak hilang saat server restart.</p>
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'Jak Sanggar',
        port: Number(PORT),
        time: new Date().toISOString()
    });
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password wajib diisi' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter' });
        }

        const users = loadUsers();
        const existingUser = users.find(user => user.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ message: 'Username sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({
            username,
            password: hashedPassword,
            role: req.body.role || 'user',
            createdAt: new Date().toISOString()
        });
        saveUsers(users);

        res.status(201).json({ message: 'User berhasil didaftarkan' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server gagal memproses register' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password wajib diisi' });
        }

        const users = loadUsers();
        const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
        if (!user) {
            return res.status(404).json({ message: 'User belum terdaftar. Silakan register terlebih dahulu.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Password salah' });
        }

        const token = jwt.sign(
            { username: user.username, role: user.role || 'user' },
            SECRET_KEY,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                username: user.username,
                role: user.role || 'user'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server gagal memproses login' });
    }
});

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan', path: req.originalUrl });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jak Sanggar server running on http://0.0.0.0:${PORT}`);
});
