const request = require('supertest');
const app = require('../backend/app');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const login = async (email, password) =>
  (await request(app).post('/api/auth/login').send({ email, password })).body.token;
const ticket = { title: 'Laptop will not boot', description: 'Black screen on startup', priority: 'High', category: 'Hardware' };

let admin, agent, agentId, emp, emp2;

beforeAll(async () => {
  admin = await login('admin@helpdesk.com', 'Admin@123');
  await request(app).post('/api/users').set(auth(admin))
    .send({ name: 'Agent One', email: 'agent1@test.com', password: 'Password1', role: 'agent' });
  agent = await login('agent1@test.com', 'Password1');
  agentId = (await request(app).get('/api/auth/me').set(auth(agent))).body.user.id;
  emp = (await request(app).post('/api/auth/register').send({ name: 'Emp', email: 'emp@test.com', password: 'Password1' })).body.token;
  emp2 = (await request(app).post('/api/auth/register').send({ name: 'Emp2', email: 'emp2@test.com', password: 'Password1' })).body.token;
});

describe('Authentication', () => {
  test('valid login returns a token', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'emp@test.com', password: 'Password1' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
  });
  test('rejects duplicate email', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'X', email: 'emp@test.com', password: 'Password1' });
    expect(r.status).toBe(409);
  });
  test('rejects short password', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'X', email: 'new@test.com', password: 'short' });
    expect(r.status).toBe(400);
  });
  test('rejects wrong password', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'emp@test.com', password: 'WrongPass1' });
    expect(r.status).toBe(401);
  });
  test('requires a token for protected routes', async () => {
    expect((await request(app).get('/api/tickets')).status).toBe(401);
  });
});

describe('Tickets and RBAC', () => {
  let id;
  test('employee creates a ticket (status Open)', async () => {
    const r = await request(app).post('/api/tickets').set(auth(emp)).send(ticket);
    expect(r.status).toBe(201);
    expect(r.body.ticket.status).toBe('Open');
    id = r.body.ticket.id;
  });
  test('validation rejects invalid priority', async () => {
    const r = await request(app).post('/api/tickets').set(auth(emp)).send({ ...ticket, priority: 'Urgent!!' });
    expect(r.status).toBe(400);
  });
  test("employee cannot see another employee's ticket", async () => {
    expect((await request(app).get(`/api/tickets/${id}`).set(auth(emp2))).status).toBe(404);
    expect((await request(app).get('/api/tickets').set(auth(emp2))).body.total).toBe(0);
  });
  test('employee cannot assign tickets or view audit log', async () => {
    expect((await request(app).patch(`/api/tickets/${id}/assign`).set(auth(emp)).send({})).status).toBe(403);
    expect((await request(app).get('/api/audit').set(auth(emp))).status).toBe(403);
  });
  test('workflow rejects invalid jump Open -> Resolved', async () => {
    const r = await request(app).patch(`/api/tickets/${id}/status`).set(auth(agent)).send({ status: 'Resolved' });
    expect(r.status).toBe(409);
  });
  test('agent works the ticket through the workflow', async () => {
    let r = await request(app).patch(`/api/tickets/${id}/status`).set(auth(agent)).send({ status: 'In Progress' });
    expect(r.status).toBe(200);
    expect(r.body.ticket.assigned_to).toBe(agentId);
    r = await request(app).post(`/api/tickets/${id}/comments`).set(auth(agent)).send({ body: 'Replacing the battery' });
    expect(r.status).toBe(201);
    r = await request(app).patch(`/api/tickets/${id}/status`).set(auth(agent)).send({ status: 'Resolved' });
    expect(r.body.ticket.status).toBe('Resolved');
  });
  test('employee can close a resolved ticket but not reopen it', async () => {
    expect((await request(app).patch(`/api/tickets/${id}/status`).set(auth(emp)).send({ status: 'In Progress' })).status).toBe(403);
    const r = await request(app).patch(`/api/tickets/${id}/status`).set(auth(emp)).send({ status: 'Closed' });
    expect(r.body.ticket.status).toBe('Closed');
  });
  test('closed tickets reject comments', async () => {
    expect((await request(app).post(`/api/tickets/${id}/comments`).set(auth(emp)).send({ body: 'hi' })).status).toBe(409);
  });
  test('admin assigns tickets and sees audit log', async () => {
    const t = (await request(app).post('/api/tickets').set(auth(emp)).send(ticket)).body.ticket;
    const r = await request(app).patch(`/api/tickets/${t.id}/assign`).set(auth(admin)).send({ assigneeId: agentId });
    expect(r.body.ticket.assigned_to).toBe(agentId);
    const log = await request(app).get('/api/audit').set(auth(admin));
    expect(log.status).toBe(200);
    expect(log.body.total).toBeGreaterThan(0);
  });
  test('supports filtering and pagination', async () => {
    const r = await request(app).get('/api/tickets?status=Open&limit=1&page=1').set(auth(agent));
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeLessThanOrEqual(1);
    expect(r.body.data.every((t) => t.status === 'Open')).toBe(true);
  });
});
