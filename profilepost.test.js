const request = require("supertest");
const app = require("./app");

it("POST /users/profile", async () => {
  const res = await request(app)
    .post("/users/profile")
    .send({
      token: "oZV1vscgRpaFav2Sun_QpMSbLV1Ayht3",
      email: "emily.ivessons@gmail.com",
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
});
