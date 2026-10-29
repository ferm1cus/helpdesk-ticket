const { validateRegister, validateTicket } = require('../backend/middleware/validate');
const { TRANSITIONS } = require('../backend/services/ticketService');

// Runs a middleware chain with a fake request; returns the first error passed to next(), if any.
function run(chain, body) {
  for (const mw of chain) {
    let err;
    mw({ body }, {}, (e) => { err = e; });
    if (err) return err;
  }
  return undefined;
}

describe('Input validation', () => {
  test('rejects an invalid email format', () => {
    const err = run(validateRegister, { name: 'A', email: 'not-an-email', password: 'Password1' });
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/email/i);
  });
  test('rejects a password shorter than 8 characters', () => {
    expect(run(validateRegister, { name: 'A', email: 'a@b.com', password: 'short' }).status).toBe(400);
  });
  test('rejects an unknown ticket priority', () => {
    const err = run(validateTicket, { title: 'T', description: 'D', priority: 'Urgent!!', category: 'Hardware' });
    expect(err.status).toBe(400);
  });
  test('accepts a valid ticket', () => {
    expect(run(validateTicket, { title: 'T', description: 'D', priority: 'High', category: 'Network' })).toBeUndefined();
  });
});

describe('Workflow rules', () => {
  test('Open can only move to In Progress; Closed is final', () => {
    expect(TRANSITIONS['Open']).toEqual(['In Progress']);
    expect(TRANSITIONS['Open']).not.toContain('Resolved');
    expect(TRANSITIONS['Closed']).toEqual([]);
  });
});
