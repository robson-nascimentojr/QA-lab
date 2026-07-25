const API_BASE = '/api';

const roleLabels = {
    'qa-junior': 'QA Junior',
    'qa-analyst': 'QA Analyst',
    'qa-automation': 'QA Automation',
    product: 'Product Owner'
};

const state = {
    users: [],
    filters: {
        search: '',
        status: 'all',
        role: 'all',
        sort: 'createdAt:desc'
    }
};

const form = document.getElementById('userForm');
const fields = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    cpf: document.getElementById('cpf'),
    phone: document.getElementById('phone'),
    role: document.getElementById('role'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    terms: document.getElementById('terms')
};

const ui = {
    apiStatus: document.querySelector('.api-status'),
    apiStatusLabel: document.getElementById('apiStatusLabel'),
    apiStatusDetail: document.getElementById('apiStatusDetail'),
    submitButton: document.getElementById('submitButton'),
    formStatus: document.getElementById('formStatus'),
    resetFormButton: document.getElementById('resetFormButton'),
    resetDataButton: document.getElementById('resetDataButton'),
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    roleFilter: document.getElementById('roleFilter'),
    sortSelect: document.getElementById('sortSelect'),
    usersTableBody: document.getElementById('usersTableBody'),
    emptyState: document.getElementById('emptyState'),
    totalUsers: document.getElementById('totalUsers'),
    activeUsers: document.getElementById('activeUsers'),
    inactiveUsers: document.getElementById('inactiveUsers'),
    strengthBar: document.getElementById('strengthBar'),
    strengthLabel: document.getElementById('strengthLabel'),
    toast: document.getElementById('toast')
};

const errors = {
    fullName: document.getElementById('fullNameError'),
    email: document.getElementById('emailError'),
    cpf: document.getElementById('cpfError'),
    phone: document.getElementById('phoneError'),
    role: document.getElementById('roleError'),
    password: document.getElementById('passwordError'),
    confirmPassword: document.getElementById('confirmPasswordError'),
    terms: document.getElementById('termsError')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
    bindEvents();
    checkHealth();
    loadUsers();
}

function bindEvents() {
    form.addEventListener('submit', handleSubmit);
    ui.resetFormButton.addEventListener('click', resetForm);
    ui.resetDataButton.addEventListener('click', resetData);
    ui.searchInput.addEventListener('input', debounce(() => {
        state.filters.search = ui.searchInput.value.trim();
        loadUsers();
    }, 250));
    ui.statusFilter.addEventListener('change', () => {
        state.filters.status = ui.statusFilter.value;
        loadUsers();
    });
    ui.roleFilter.addEventListener('change', () => {
        state.filters.role = ui.roleFilter.value;
        loadUsers();
    });
    ui.sortSelect.addEventListener('change', () => {
        state.filters.sort = ui.sortSelect.value;
        loadUsers();
    });

    fields.cpf.addEventListener('input', () => {
        fields.cpf.value = formatCpf(fields.cpf.value);
        validateField('cpf');
    });
    fields.phone.addEventListener('input', () => {
        fields.phone.value = formatPhone(fields.phone.value);
        validateField('phone');
    });
    fields.password.addEventListener('input', () => {
        updatePasswordStrength(fields.password.value);
        validateField('password');
        validateField('confirmPassword');
    });

    Object.entries(fields).forEach(([name, field]) => {
        const eventName = field.type === 'checkbox' ? 'change' : 'blur';
        field.addEventListener(eventName, () => validateField(name));
    });
}

async function checkHealth() {
    try {
        const health = await request('/health');
        ui.apiStatus.dataset.status = 'online';
        ui.apiStatusLabel.textContent = 'API online';
        ui.apiStatusDetail.textContent = `${health.userCount} usuarios na base`;
    } catch (error) {
        ui.apiStatus.dataset.status = 'offline';
        ui.apiStatusLabel.textContent = 'API offline';
        ui.apiStatusDetail.textContent = 'Rode npm start para integrar';
        showToast('Nao foi possivel conectar na API local.', 'error');
    }
}

async function loadUsers() {
    setListLoading(true);
    try {
        const params = new URLSearchParams();
        if (state.filters.search) params.set('search', state.filters.search);
        if (state.filters.status !== 'all') params.set('status', state.filters.status);
        if (state.filters.role !== 'all') params.set('role', state.filters.role);
        const [sortBy, order] = state.filters.sort.split(':');
        params.set('sortBy', sortBy);
        params.set('order', order);

        const response = await request(`/users?${params.toString()}`);
        state.users = response.users;
        renderUsers(response.users);
        renderMetrics(response.meta);
        checkHealth();
    } catch (error) {
        showToast(error.message || 'Erro ao carregar usuarios.', 'error');
        renderUsers([]);
        renderMetrics({ total: 0, active: 0, inactive: 0 });
    } finally {
        setListLoading(false);
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    clearServerStatus();

    const validation = validateForm();
    if (!validation.isValid) {
        showToast('Revise os campos destacados.', 'error');
        return;
    }

    setFormLoading(true);
    try {
        const payload = buildPayload();
        await request('/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Usuario cadastrado com sucesso.', 'success');
        ui.formStatus.textContent = 'Cadastro salvo.';
        resetForm();
        await loadUsers();
    } catch (error) {
        applyServerErrors(error);
    } finally {
        setFormLoading(false);
    }
}

async function toggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
        await request(`/users/${user.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus })
        });
        showToast('Status atualizado.', 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message || 'Nao foi possivel atualizar o status.', 'error');
    }
}

async function deleteUser(user) {
    const confirmed = window.confirm(`Remover ${user.fullName}?`);
    if (!confirmed) return;

    try {
        await request(`/users/${user.id}`, { method: 'DELETE' });
        showToast('Usuario removido.', 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message || 'Nao foi possivel remover usuario.', 'error');
    }
}

async function resetData() {
    const confirmed = window.confirm('Resetar a massa de dados inicial?');
    if (!confirmed) return;

    try {
        await request('/reset', { method: 'POST' });
        showToast('Massa de dados restaurada.', 'success');
        await loadUsers();
    } catch (error) {
        showToast(error.message || 'Nao foi possivel resetar a massa.', 'error');
    }
}

function validateForm() {
    const invalidFields = Object.keys(fields).filter((name) => !validateField(name));
    return {
        isValid: invalidFields.length === 0,
        invalidFields
    };
}

function validateField(name) {
    const value = getFieldValue(name);
    let message = '';

    if (name === 'fullName') {
        if (!value) message = 'Informe o nome completo.';
        else if (value.trim().split(/\s+/).length < 2) message = 'Inclua nome e sobrenome.';
        else if (value.length < 5) message = 'Use pelo menos 5 caracteres.';
    }

    if (name === 'email') {
        if (!value) message = 'Informe o e-mail.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Informe um e-mail valido.';
    }

    if (name === 'cpf') {
        if (!value) message = 'Informe o CPF.';
        else if (!isValidCpf(value)) message = 'CPF invalido.';
    }

    if (name === 'phone') {
        if (!value) message = 'Informe o telefone.';
        else if (onlyDigits(value).length < 10) message = 'Telefone incompleto.';
    }

    if (name === 'role') {
        if (!value) message = 'Selecione um perfil.';
    }

    if (name === 'password') {
        const strength = getPasswordStrength(value);
        if (!value) message = 'Informe a senha.';
        else if (strength.score < 4) message = 'Use 8+ caracteres com letra, numero e simbolo.';
    }

    if (name === 'confirmPassword') {
        if (!value) message = 'Confirme a senha.';
        else if (value !== fields.password.value) message = 'As senhas nao coincidem.';
    }

    if (name === 'terms') {
        if (!fields.terms.checked) message = 'Confirme o uso dos dados ficticios.';
    }

    setFieldError(name, message);
    return !message;
}

function getFieldValue(name) {
    if (fields[name].type === 'checkbox') return fields[name].checked;
    return fields[name].value.trim();
}

function setFieldError(name, message) {
    const field = fields[name];
    if (field.type !== 'checkbox') field.classList.toggle('is-invalid', Boolean(message));
    errors[name].textContent = message;
}

function clearErrors() {
    Object.keys(errors).forEach((name) => setFieldError(name, ''));
}

function clearServerStatus() {
    ui.formStatus.textContent = '';
}

function applyServerErrors(error) {
    if (error.details && typeof error.details === 'object') {
        Object.entries(error.details).forEach(([name, message]) => {
            if (errors[name]) setFieldError(name, message);
        });
        showToast('A API recusou alguns dados.', 'error');
        return;
    }
    showToast(error.message || 'Erro ao salvar cadastro.', 'error');
}

function buildPayload() {
    const selectedContact = form.querySelector('input[name="contactPreference"]:checked');
    return {
        fullName: fields.fullName.value.trim(),
        email: fields.email.value.trim().toLowerCase(),
        cpf: fields.cpf.value.trim(),
        phone: fields.phone.value.trim(),
        role: fields.role.value,
        password: fields.password.value,
        contactPreference: selectedContact ? selectedContact.value : 'email'
    };
}

function resetForm() {
    form.reset();
    clearErrors();
    updatePasswordStrength('');
    ui.formStatus.textContent = '';
}

function renderUsers(users) {
    ui.usersTableBody.innerHTML = '';
    ui.emptyState.classList.toggle('hidden', users.length > 0);

    users.forEach((user) => {
        const row = document.createElement('tr');
        row.dataset.testid = `user-row-${user.id}`;

        row.innerHTML = `
            <td>
                <span class="user-name">${escapeHtml(user.fullName)}</span>
                <span class="user-meta">${escapeHtml(user.email)} | ${escapeHtml(user.cpf)}</span>
            </td>
            <td>${roleLabels[user.role] || user.role}</td>
            <td><span class="badge ${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
            <td>
                <span class="user-name">${escapeHtml(user.phone)}</span>
                <span class="user-meta">${user.contactPreference === 'phone' ? 'Prefere telefone' : 'Prefere e-mail'}</span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="table-action" type="button" data-action="toggle">${user.status === 'active' ? 'Inativar' : 'Ativar'}</button>
                    <button class="table-action danger" type="button" data-action="delete">Excluir</button>
                </div>
            </td>
        `;

        row.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleStatus(user));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteUser(user));
        ui.usersTableBody.appendChild(row);
    });
}

function renderMetrics(meta) {
    ui.totalUsers.textContent = meta.total;
    ui.activeUsers.textContent = meta.active;
    ui.inactiveUsers.textContent = meta.inactive;
}

function setFormLoading(isLoading) {
    ui.submitButton.disabled = isLoading;
    ui.submitButton.textContent = isLoading ? 'Salvando...' : 'Cadastrar';
    ui.formStatus.textContent = isLoading ? 'Enviando para a API...' : ui.formStatus.textContent;
}

function setListLoading(isLoading) {
    ui.resetDataButton.disabled = isLoading;
}

function updatePasswordStrength(password) {
    const strength = getPasswordStrength(password);
    const width = strength.score === 0 ? 0 : Math.min(100, strength.score * 25);
    ui.strengthBar.style.width = `${width}%`;
    ui.strengthBar.dataset.level = strength.level;
    ui.strengthLabel.textContent = `Forca da senha: ${strength.label}`;
}

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) return { score: 0, level: 'weak', label: 'vazia' };
    if (score <= 2) return { score, level: 'weak', label: 'fraca' };
    if (score === 3) return { score, level: 'medium', label: 'media' };
    return { score, level: 'strong', label: 'forte' };
}

function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
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

function onlyDigits(value) {
    return String(value).replace(/\D/g, '');
}

function debounce(callback, wait) {
    let timeoutId;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => callback(...args), wait);
    };
}

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(data?.message || 'Erro inesperado na API.');
        error.details = data?.details;
        error.status = response.status;
        throw error;
    }

    return data;
}

function showToast(message, type = 'success') {
    ui.toast.textContent = message;
    ui.toast.className = `toast ${type}`;
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        ui.toast.classList.add('hidden');
    }, 3600);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
