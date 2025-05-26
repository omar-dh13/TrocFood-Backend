const request = require("supertest");
const app = require("./app");

it("users/signin", async () => {
  const res = await request(app).post("/users/signin").send({
    email: "supertest@test.fr",
    password: "test123",
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(true);
});
