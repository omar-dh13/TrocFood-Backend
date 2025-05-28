const request = require("supertest");
const app = require("./app");
const mongoose = require("mongoose");
const User = require("./models/users");
const bcrypt = require("bcrypt");

describe("POST /users/signin", () => {
  const testUser = {
    email: "test@test.fr",
    password: "test123",
  };

  beforeAll(async () => {
    // Créer un utilisateur en base
    const hashedPassword = bcrypt.hashSync(testUser.password, 10);
    const user = new User({
      email: testUser.email,
      password: hashedPassword,
    });
    await user.save();
  });

  afterAll(async () => {
    // Nettoyer la base après le test
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
  });

  it("L'utilisateur se connecte correctement", async () => {
    const res = await request(app).post("/users/signin").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.statusCode).toBe(200); // OK
    expect(res.body.result).toBe(true);
  });

  it("erreur, mot de passe faux", async () => {
    const res = await request(app).post("/users/signin").send({
      email: testUser.email,
      password: "password",
    });
    expect(res.statusCode).toBe(401); // Unauthorized
    expect(res.body.result).toBe(false);
  });

  it("erreur, email faux", async () => {
    const res = await request(app).post("/users/signin").send({
      email: "mauvaismail@test.fr",
      password: "test123",
    });
    expect(res.statusCode).toBe(404); // Not found
    expect(res.body.result).toBe(false);
  });

  it("erreur, champ manquant (email)", async () => {
    const res = await request(app).post("/users/signin").send({
      password: testUser.password,
    });
    expect(res.statusCode).toBe(400); // Bad request
    expect(res.body.result).toBe(false);
  });
});
