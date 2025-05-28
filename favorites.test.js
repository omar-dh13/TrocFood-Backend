const request = require('supertest');
const app = require('./app');

describe('GET /favorites/:userId - Récupération des favoris', () => {
  
  // Test principal - cas nominal
  it('devrait retourner les favoris quand l\'utilisateur existe', async () => {
    // Remplacez par un ID d'utilisateur qui existe vraiment dans votre DB
    const userId = "683072a01a73f21e5f6462ef"; 
    
    const response = await request(app)
      .get(`/favorites/${userId}`)
      .expect(200);

    expect(response.body.result).toBe(true);
    expect(response.body.favorites).toBeDefined();
    expect(Array.isArray(response.body.favorites)).toBe(true);
  });

  // Test d'erreur - utilisateur inexistant
  it('devrait retourner 404 quand l\'utilisateur n\'existe pas', async () => {
    const fakeId = "60d5ec49e8b2f83d4c8e4f99";
    
    const response = await request(app)
      .get(`/favorites/${fakeId}`)
      .expect(404);

    expect(response.body.result).toBe(false);
    expect(response.body.message).toBe('User not found');
  });

  // Test d'erreur - ID invalide
  it('devrait retourner 500 quand l\'ID est mal formaté', async () => {
    const invalidId = "invalid-id";
    
    const response = await request(app)
      .get(`/favorites/${invalidId}`)
      .expect(500);

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBeDefined();
  });
});