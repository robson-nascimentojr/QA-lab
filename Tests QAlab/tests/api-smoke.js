const assert = require('assert/strict');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
    const health = await getJson('/api/health');
    assert.equal(health.status, 'ok');
    assert.equal(typeof health.userCount, 'number');

    const reset = await postJson('/api/reset', {});
    assert.equal(reset.users.length, 3);

    const created = await postJson('/api/users', {
        fullName: 'Marina Teste Silva',
        email: `marina.${Date.now()}@example.com`,
        cpf: '935.411.347-80',
        phone: '(41) 95555-1212',
        role: 'qa-junior',
        password: 'Teste@123',
        contactPreference: 'email'
    }, 201);

    assert.ok(created.user.id);
    assert.equal(created.user.status, 'active');

    const users = await getJson('/api/users?search=Marina');
    assert.equal(users.users.length, 1);
    assert.equal(users.users[0].fullName, 'Marina Teste Silva');

    const patched = await patchJson(`/api/users/${created.user.id}/status`, { status: 'inactive' });
    assert.equal(patched.user.status, 'inactive');

    await deleteJson(`/api/users/${created.user.id}`);
    const afterDelete = await getJson('/api/users?search=Marina');
    assert.equal(afterDelete.users.length, 0);

    console.log('API smoke test passou.');
}

async function getJson(path) {
    return request(path, { method: 'GET' });
}

async function postJson(path, body, expectedStatus = 200) {
    return request(path, {
        method: 'POST',
        body: JSON.stringify(body)
    }, expectedStatus);
}

async function patchJson(path, body) {
    return request(path, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

async function deleteJson(path) {
    return request(path, { method: 'DELETE' });
}

async function request(path, options, expectedStatus = 200) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const payload = await response.json();
    assert.equal(response.status, expectedStatus, JSON.stringify(payload));
    return payload;
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
