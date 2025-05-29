const request = require("supertest");
const app = require("./app");
const User = require("./models/users");
const uid2 = require("uid2");

describe("POST /users/profile", () => {
  const userTest = {
    email: "test.test@gmail.com",
    password: "test1",
    token: uid2(32),
  };

  beforeAll(async () => {
    const newUserTest = new User(userTest);
    await newUserTest.save();
  });

  afterAll(async () => {
    await User.deleteOne({ email: userTest.email });
  });

  it("POST /users/profile SUCCESS", async () => {
    const res = await request(app)
      .post("/users/profile")
      .send({
        token: userTest.token,
        email: userTest.email,
        userName: "MiCaCy",
        firstName: "Emily",
        lastName: "Ivessons",
        phone: "0631721738",
        birthday: "1995-06-07T17:36:00.000Z",
        address: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [2.290084, 49.897443],
          },
          properties: {
            label: "8 Boulevard du Port 80000 Amiens",
            score: 0.49159121588068583,
            housenumber: "8",
            id: "80021_6590_00008",
            type: "housenumber",
            name: "8 Boulevard du Port",
            postcode: "80000",
            citycode: "80021",
            x: 648952.58,
            y: 6977867.25,
            city: "Amiens",
            context: "80, Somme, Hauts-de-France",
            importance: 0.6706612694243868,
            street: "Boulevard du Port",
          },
        },
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.user).toBeDefined();
  });

  it("POST /users/profile FAILURE - Missing fields", async () => {
    const res = await request(app).post("/users/profile").send({
      token: userTest.token,
      email: userTest.email,
      userName: "MiCaCy",
      firstName: "Emily",
      lastName: "Ivessons",
      phone: "0631721738",
      birthday: "1995-06-07T17:36:00.000Z",
      address: null,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Missing or empty fields");
  });

  it("POST /users/profile FAILURE - Invalid email format", async () => {
    const res = await request(app)
      .post("/users/profile")
      .send({
        token: userTest.token,
        email: "emily.Gmail", // email incorrect
        userName: "MiCaCy",
        firstName: "Emily",
        lastName: "Ivessons",
        phone: "0631721738",
        birthday: "1995-06-07T17:36:00.000Z",
        address: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [2.290084, 49.897443],
          },
          properties: {
            label: "8 Boulevard du Port 80000 Amiens",
            score: 0.49159121588068583,
            housenumber: "8",
            id: "80021_6590_00008",
            type: "housenumber",
            name: "8 Boulevard du Port",
            postcode: "80000",
            citycode: "80021",
            x: 648952.58,
            y: 6977867.25,
            city: "Amiens",
            context: "80, Somme, Hauts-de-France",
            importance: 0.6706612694243868,
            street: "Boulevard du Port",
          },
        },
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Invalid email format");
  });

  it("POST /users/profile FAILURE - Invalid phone number format", async () => {
    const res = await request(app)
      .post("/users/profile")
      .send({
        token: userTest.token,
        email: userTest.email,
        userName: "MiCaCy",
        firstName: "Emily",
        lastName: "Ivessons",
        phone: "06317", // numéro de téléphone incorrect
        birthday: "1995-06-07T17:36:00.000Z",
        address: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [2.290084, 49.897443],
          },
          properties: {
            label: "8 Boulevard du Port 80000 Amiens",
            score: 0.49159121588068583,
            housenumber: "8",
            id: "80021_6590_00008",
            type: "housenumber",
            name: "8 Boulevard du Port",
            postcode: "80000",
            citycode: "80021",
            x: 648952.58,
            y: 6977867.25,
            city: "Amiens",
            context: "80, Somme, Hauts-de-France",
            importance: 0.6706612694243868,
            street: "Boulevard du Port",
          },
        },
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Invalid phone number format");
  });

  it("POST /users/profile FAILURE - user not found", async () => {
    const res = await request(app)
      .post("/users/profile")
      .send({
        token: "mauvais_token",
        email: userTest.email,
        userName: "MiCaCy",
        firstName: "Emily",
        lastName: "Ivessons",
        phone: "0631721738",
        birthday: "1995-06-07T17:36:00.000Z",
        address: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [2.290084, 49.897443],
          },
          properties: {
            label: "8 Boulevard du Port 80000 Amiens",
            score: 0.49159121588068583,
            housenumber: "8",
            id: "80021_6590_00008",
            type: "housenumber",
            name: "8 Boulevard du Port",
            postcode: "80000",
            citycode: "80021",
            x: 648952.58,
            y: 6977867.25,
            city: "Amiens",
            context: "80, Somme, Hauts-de-France",
            importance: 0.6706612694243868,
            street: "Boulevard du Port",
          },
        },
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("User not found");
  });
});
