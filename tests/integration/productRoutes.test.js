jest.mock("../../src/config/redis", () => {
  const RedisMock = require("ioredis-mock");
  return new RedisMock();
});

const request = require("supertest");
const http = require("http");
const Database = require("../../src/config/database");

let app;
let server;

beforeAll(async () => {
  await Database.init(); // initialize DB first

  // Now import app and routes AFTER DB init
  app = require("../../src/app");
  const productRoutes = require("../../src/routes/productRoutes");
  app.use("/api/products", productRoutes);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(resolve));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await Database.close();
});

describe("Product API", () => {
  it("should return products from DB first time and cache next", async () => {
    const res1 = await request(server).get("/api/products?limit=2");
    expect(res1.status).toBe(200);
    expect(res1.body.meta.cached).toBe(false);

    const res2 = await request(server).get("/api/products?limit=2");
    expect(res2.status).toBe(200);
    expect(res2.body.meta.cached).toBe(true);
  });

  it("should return product by ID", async () => {
    const res = await request(server).get("/api/products/121211");
    expect(res.status).toBe(404);
  });
});
