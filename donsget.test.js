const request = require('supertest');
const app = require('./app');

it('GET /dons', async () => {
  const res = await request(app).get('/dons');
  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(true);
  expect(Array.isArray(res.body.dons)).toBe(true);
});
