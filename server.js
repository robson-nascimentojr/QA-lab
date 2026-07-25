const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

const roleLabels = new Set(['qa-junior', 'qa-analyst', 'qa-automation', 'product']);
const statusLabels = new Set(['active', 'inactive']);

const seedUsers = [
    {
        id: 'usr_demo_alpha',
        fullName: 'Usuario Demo Alpha',
        email: 'usuario.demo.alpha@example.com',
        cpf: '234.567.890-92',
        phone: '(99) 90000-0001',
        role: 'qa-analyst',
        contactPreference: 'email',
        status: 'active',
        createdAt: '2026-05-18T13:20:00.000Z'
    },
    {
        id: 'usr_demo_beta',
        fullName: 'Usuario Demo Beta',
        email: 'usuario.demo.beta@example.com',
        cpf: '345.678.901-75',
        phone: '(99) 90000-0002',
        role: 'qa-automation',
        contactPreference: 'phone',
        status: 'active',
        createdAt: '2026-05-19T10:15:00.000Z'
    },
    {
        id: 'usr_demo_gamma',
        fullName: 'Usuario Demo Gamma',
        email: 'usuario.demo.gamma@example.com',
        cpf: '456.789.012-49',
        phone: '(99) 90000-0003',
        role: 'product',
        contactPreference: 'email',
        status: 'inactive',
        createdAt: '2026-05-20T08:30:00.000Z'
    }
];

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    try {
        await ensureDataFile();
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname.startsWith('/api/')) {
            await handleApi(req, res, url);
            return;
        }

        await serveStatic(res, url.pathname);
    } catch (error) {
        console.error(error);
        const statusCode = error.statusCode || 500;
        sendJson(res, statusCode, {
            message: statusCode === 500 ? 'Erro interno no servidor.' : error.message
        });
    }
});

server.listen(PORT, () => {
    console.log(`QA Lab rodando em http://localhost:${PORT}`);
});

async function handleApi(req, res, url) {
    if (req.method === 'GET' && url.pathname === '/api/health') {
        const users = await readUsers();
        sendJson(res, 200, {
            status: 'ok',
            userCount: users.length,
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/users') {
        const users = await readUsers();
        const result = filterAndSortUsers(users, url.searchParams);
        sendJson(res, 200, {
            users: result,
            meta: buildMeta(users, result.length)
        });
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/users') {
        const body = await parseJsonBody(req);
        const users = await readUsers();
        const validation = validateUserPayload(body, users);

        if (!validation.isValid) {
            sendJson(res, 422, {
                message: 'Dados invalidos.',
                details: validation.errors
            });
            return;
        }

        const user = {
            id: `usr_${crypto.randomUUID().slice(0, 8)}`,
            fullName: body.fullName.trim(),
            email: body.email.trim().toLowerCase(),
            cpf: body.cpf.trim(),
            phone: body.phone.trim(),
            role: body.role,
            contactPreference: body.contactPreference === 'phone' ? 'phone' : 'email',
            status: 'active',
            createdAt: new Date().toISOString()
        };

        users.push(user);
        await writeUsers(users);
        sendJson(res, 201, { user });
        return;
    }

    const statusMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
        const body = await parseJsonBody(req);
        const users = await readUsers();
        const user = users.find((item) => item.id === statusMatch[1]);

        if (!user) {
            sendJson(res, 404, { message: 'Usuario nao encontrado.' });
            return;
        }

        if (!statusLabels.has(body.status)) {
            sendJson(res, 422, { message: 'Status invalido.' });
            return;
        }

        user.status = body.status;
        await writeUsers(users);
        sendJson(res, 200, { user });
        return;
    }

    const deleteMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
        const users = await readUsers();
        const nextUsers = users.filter((item) => item.id !== deleteMatch[1]);

        if (nextUsers.length === users.length) {
            sendJson(res, 404, { message: 'Usuario nao encontrado.' });
            return;
        }

        await writeUsers(nextUsers);
        sendJson(res, 200, { message: 'Usuario removido.' });
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/reset') {
        await writeUsers(seedUsers);
        sendJson(res, 200, { users: seedUsers });
        return;
    }

    sendJson(res, 404, { message: 'Rota nao encontrada.' });
}

function filterAndSortUsers(users, searchParams) {
    const search = String(searchParams.get('search') || '').trim().toLowerCase();
    const status = String(searchParams.get('status') || 'all');
    const role = String(searchParams.get('role') || 'all');
    const sortBy = String(searchParams.get('sortBy') || 'createdAt');
    const order = String(searchParams.get('order') || 'desc');

    const filtered = users.filter((user) => {
        const matchesSearch = !search || [
            user.fullName,
            user.email,
            user.cpf,
            user.phone
        ].some((value) => String(value).toLowerCase().includes(search));
        const matchesStatus = status === 'all' || user.status === status;
        const matchesRole = role === 'all' || user.role === role;
        return matchesSearch && matchesStatus && matchesRole;
    });

    return filtered.sort((a, b) => {
        const first = String(a[sortBy] || '').toLowerCase();
        const second = String(b[sortBy] || '').toLowerCase();
        const comparison = first.localeCompare(second);
        return order === 'asc' ? comparison : comparison * -1;
    });
}

function buildMeta(allUsers, visibleCount) {
    return {
        total: allUsers.length,
        visible: visibleCount,
        active: allUsers.filter((user) => user.status === 'active').length,
        inactive: allUsers.filter((user) => user.status === 'inactive').length
    };
}

function validateUserPayload(payload, users) {
    const errors = {};
    const fullName = String(payload.fullName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const cpf = String(payload.cpf || '').trim();
    const phone = String(payload.phone || '').trim();
    const password = String(payload.password || '');

    if (!fullName) errors.fullName = 'Informe o nome completo.';
    else if (fullName.split(/\s+/).length < 2) errors.fullName = 'Inclua nome e sobrenome.';

    if (!email) errors.email = 'Informe o e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail valido.';
    else if (users.some((user) => user.email === email)) errors.email = 'E-mail ja cadastrado.';

    if (!cpf) errors.cpf = 'Informe o CPF.';
    else if (!isValidCpf(cpf)) errors.cpf = 'CPF invalido.';
    else if (users.some((user) => onlyDigits(user.cpf) === onlyDigits(cpf))) errors.cpf = 'CPF ja cadastrado.';

    if (!phone) errors.phone = 'Informe o telefone.';
    else if (onlyDigits(phone).length < 10) errors.phone = 'Telefone incompleto.';

    if (!roleLabels.has(payload.role)) errors.role = 'Selecione um perfil valido.';

    if (getPasswordScore(password) < 4) {
        errors.password = 'Use 8+ caracteres com letra maiuscula, numero e simbolo.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

async function serveStatic(res, pathname) {
    const safePath = pathname === '/' ? '/index.html' : pathname;
    const requestedPath = path.normalize(decodeURIComponent(safePath)).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, requestedPath);

    if (!filePath.startsWith(ROOT)) {
        sendJson(res, 403, { message: 'Acesso negado.' });
        return;
    }

    try {
        const content = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream'
        });
        res.end(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            sendJson(res, 404, { message: 'Arquivo nao encontrado.' });
            return;
        }
        throw error;
    }
}

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await writeUsers(seedUsers);
    }
}

async function readUsers() {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
}

async function writeUsers(users) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

async function parseJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length === 0) return {};

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        const error = new Error('JSON invalido.');
        error.statusCode = 400;
        throw error;
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });
    res.end(JSON.stringify(payload));
}

function onlyDigits(value) {
    return String(value).replace(/\D/g, '');
}

function isValidCpf(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10) firstDigit = 0;
    if (firstDigit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10) secondDigit = 0;
    return secondDigit === Number(cpf[10]);
}

function getPasswordScore(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}
