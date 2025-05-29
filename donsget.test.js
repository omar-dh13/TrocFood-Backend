const request = require('supertest');
const app = require('./app');
const Don = require('./models/dons');

describe('GET /dons', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner 200 avec un tableau de dons', async () => {
    const res = await request(app).get('/dons');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(Array.isArray(res.body.dons)).toBe(true);
  });

  it('devrait retourner les dons avec distance quand les coordonnées sont fournies', async () => {
    const res = await request(app).get('/dons?latitude=48.8566&longitude=2.3522');
    
    expect(res.statusCode).toBe(200);
    if (res.body.dons.length > 0) {
      expect(res.body.dons[0]).toHaveProperty('distance');
    }
  });

  it('devrait gérer les coordonnées invalides', async () => {
    const res = await request(app).get('/dons?latitude=invalid&longitude=2.3522');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
  });

  it('devrait gérer les erreurs de base de données', async () => {
    const originalFind = Don.find;
    Don.find = jest.fn(() => { throw new Error('DB Error'); });

    const res = await request(app).get('/dons');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.result).toBe(false);

    Don.find = originalFind;
  });
});
