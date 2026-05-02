const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const users = [];
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key'; // Change this to a secure key in production

app.use(bodyParser.json());

// Home page / status check
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
                .card { max-width: 720px; margin: 40px auto; background: #111827; border-radius: 18px; padding: 28px; box-shadow: 0 12px 30px rgba(0,0,0,.3); }
                h1 { margin-top: 0; color: #38bdf8; }
                code { background: #020617; padding: 4px 8px; border-radius: 8px; }
                .ok { color: #22c55e; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Jak Sanggar</h1>
                <p class="ok">Server aktif dan berhasil berjalan.</p>
                <p>API tersedia:</p>
                <p><code>POST /register</code></p>
                <p><code>POST /login</code></p>
                <p><code>GET /health</code></p>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'Jak Sanggar', port: PORT });
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(409).json({ message: 'Username sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered' });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const user = users.find(user => user.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
