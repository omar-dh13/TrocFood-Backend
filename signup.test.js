const request = require("supertest");
const app = require("./app");

describe("POST /users/signup", () => {
  //Création d'un utilisateur test
  it("users/signup nouvel utilisateur ok", async () => {
    const res = await request(app).post("/users/signup").send({
      email: "testsignup@test.fr",
      password: "signup123"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.token).toBeDefined();
    //TODO : une fois la route delete mise en place, penser à supprimer l'utilisateur test créé
  });

  // Champ d'email manquant
  it("users/signup email manquant", async () => {
    const res = await request(app).post("/users/signup").send({
      password: "signup123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  // Champ password manquant
  it("users/signup password manquant", async () => {
    const res = await request(app).post("/users/signup").send({
      email: "missingpassword@test.fr"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  // Format d'email rejeté par le test RegEx
  it("users/signup mail invalide", async () => {
    const res = await request(app).post("/users/signup").send({
      email: "invalidemail",
      password: "signup123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  // Utilisateur déjà enregistré
  it("users/signup email déjà en bdd", async () => {
    // Création du compte
    await request(app).post("/users/signup").send({
      email: "duplicate@test.fr",
      password: "signup123"
    });
    // Deuxième tentative de création du compte avec le même email
    const res = await request(app).post("/users/signup").send({
      email: "duplicate@test.fr",
      password: "signup123"
    });

    expect(res.statusCode).toBe(401); 
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
