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
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
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
  res.send(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JAK SANGGAR</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:linear-gradient(135deg,#020617,#0f172a 55%,#1d4ed8);color:white;display:flex;align-items:center;justify-content:center;padding:20px}.wrap{width:100%;max-width:980px;display:grid;grid-template-columns:1.1fr .9fr;gap:22px}.hero,.box{background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.15);border-radius:26px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.35)}h1{font-size:56px;line-height:.95;margin:18px 0}.blue{color:#38bdf8}.orange{color:#fb923c}p{color:#cbd5e1;line-height:1.6}.badge{display:inline-block;background:rgba(56,189,248,.15);color:#93c5fd;padding:9px 13px;border-radius:99px;font-weight:700}.tabs{display:grid;grid-template-columns:1fr 1fr;background:#020617;padding:6px;border-radius:16px;gap:6px}.tab{border:0;border-radius:12px;padding:12px;background:transparent;color:#cbd5e1;font-weight:800;cursor:pointer}.tab.active{background:#2563eb;color:white}label{display:block;margin:12px 0 7px;color:#cbd5e1;font-weight:700;font-size:13px}input,select{width:100%;border:1px solid rgba(255,255,255,.2);background:#020617;color:white;border-radius:14px;padding:14px}.btn{width:100%;margin-top:16px;border:0;border-radius:15px;padding:14px;background:linear-gradient(135deg,#2563eb,#fb923c);color:white;font-weight:900;cursor:pointer}.btn2{background:#0f172a;border:1px solid rgba(255,255,255,.18)}.msg{display:none;margin-top:14px;padding:12px;border-radius:12px}.ok{display:block;background:rgba(34,197,94,.15);color:#86efac}.err{display:block;background:rgba(239,68,68,.15);color:#fecaca}.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.card{background:#020617;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}.hidden{display:none}@media(max-width:850px){.wrap{grid-template-columns:1fr}h1{font-size:42px}.cards{grid-template-columns:1fr}}</style></head><body><main class="wrap"><section class="hero"><span class="badge">Server aktif</span><h1><span class="blue">JAK</span><br><span class="orange">SANGGAR</span></h1><p>Aplikasi awal login, register, dan dashboard. Versi ini berjalan langsung di server yang sama sehingga tidak perlu frontend terpisah dulu.</p><p>Endpoint: <b>/health</b>, <b>/register</b>, <b>/login</b></p></section><section class="box"><div id="auth"><div class="tabs"><button id="tabLogin" class="tab active" onclick="setMode('login')">Login</button><button id="tabRegister" class="tab" onclick="setMode('register')">Register</button></div><form id="form"><label>Username</label><input id="username" placeholder="admin" required><label>Password</label><input id="password" type="password" placeholder="minimal 6 karakter" required><div id="roleBox" class="hidden"><label>Role</label><select id="role"><option value="admin">Admin</option><option value="operator">Operator</option><option value="kurator">Kurator</option><option value="sanggar">Sanggar</option><option value="user">User</option></select></div><button id="submit" class="btn">Masuk</button></form><button class="btn btn2" onclick="cekServer()">Cek Server</button><div id="msg" class="msg"></div></div><div id="dash" class="hidden"><span class="badge">Login berhasil</span><h2>Dashboard JAK SANGGAR</h2><p id="welcome"></p><div class="cards"><div class="card"><b>Profil Sanggar</b><br>Data utama sanggar</div><div class="card"><b>AD/ART</b><br>Penyusunan dokumen</div><div class="card"><b>SK Pengurus</b><br>Struktur dan tupoksi</div><div class="card"><b>Kurasi</b><br>Tahapan validasi</div></div><button class="btn btn2" onclick="logout()">Keluar</button></div></section></main><script>let mode='login';const msg=document.getElementById('msg');function setMode(m){mode=m;document.getElementById('tabLogin').classList.toggle('active',m==='login');document.getElementById('tabRegister').classList.toggle('active',m==='register');document.getElementById('roleBox').classList.toggle('hidden',m!=='register');document.getElementById('submit').textContent=m==='login'?'Masuk':'Daftar Akun';msg.className='msg';msg.textContent=''}function show(t,ok){msg.textContent=t;msg.className='msg '+(ok?'ok':'err')}async function cekServer(){try{const r=await fetch('/health');const d=await r.json();show('Server normal: '+d.app+' port '+d.port,true)}catch(e){show('Server tidak dapat dihubungi',false)}}document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();const body={username:username.value.trim(),password:password.value};if(mode==='register')body.role=role.value;try{const r=await fetch('/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)return show(d.message||'Gagal',false);if(mode==='register'){show('Akun berhasil dibuat. Silakan login.',true);setMode('login');return}localStorage.setItem('jak_token',d.token);localStorage.setItem('jak_user',JSON.stringify(d.user));openDash(d.user)}catch(err){show('Server tidak dapat dihubungi. Cek VPS, port 3000, atau PM2.',false)}});function openDash(user){document.getElementById('auth').classList.add('hidden');document.getElementById('dash').classList.remove('hidden');document.getElementById('welcome').textContent='Selamat datang, '+user.username+' | Role: '+user.role}function logout(){localStorage.removeItem('jak_token');localStorage.removeItem('jak_user');location.reload()}const saved=localStorage.getItem('jak_user');if(saved)openDash(JSON.parse(saved));</script></body></html>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Jak Sanggar', port: Number(PORT), time: new Date().toISOString() });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });
    const users = loadUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ message: 'Username sudah terdaftar' });
    users.push({ username, password: await bcrypt.hash(password, 10), role: req.body.role || 'user', createdAt: new Date().toISOString() });
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
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User belum terdaftar. Silakan register terlebih dahulu.' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Password salah' });
    const token = jwt.sign({ username: user.username, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ message: 'Login berhasil', token, user: { username: user.username, role: user.role || 'user' } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server gagal memproses login' });
  }
});

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan', path: req.originalUrl }));

app.listen(PORT, '0.0.0.0', () => console.log(`Jak Sanggar server running on http://0.0.0.0:${PORT}`));
