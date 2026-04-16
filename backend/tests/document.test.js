const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");

let mongoServer;
let token;
let viewerToken;

jest.setTimeout(60000);

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const response = await request(app).post("/api/auth/login").send({
    email: "owner@test.com",
    name: "Owner",
  });

  token = response.body.token;

  const viewerResponse = await request(app).post("/api/auth/login").send({
    email: "viewer@test.com",
    name: "Viewer",
  });
  viewerToken = viewerResponse.body.token;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Document API", () => {
  it("creates and fetches my documents", async () => {
    const createResponse = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My First Doc" });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.title).toBe("My First Doc");

    const listResponse = await request(app)
      .get("/api/documents/my")
      .set("Authorization", `Bearer ${token}`);

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBe(1);
    expect(listResponse.body[0].title).toBe("My First Doc");
  });

  it("enforces viewer role and supports revoke", async () => {
    const createResponse = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Share Control Doc" });

    const docId = createResponse.body._id;

    const shareResponse = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "viewer@test.com", role: "viewer" });

    expect(shareResponse.statusCode).toBe(200);

    const updateAsViewer = await request(app)
      .put(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ content: "<p>Should fail</p>" });

    expect(updateAsViewer.statusCode).toBe(403);

    const ownerDoc = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`);

    const sharedEntry = ownerDoc.body.sharedWith.find(
      (entry) => entry.userId.email === "viewer@test.com",
    );

    const revokeResponse = await request(app)
      .delete(`/api/documents/${docId}/shares/${sharedEntry.userId._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(revokeResponse.statusCode).toBe(200);

    const accessAfterRevoke = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(accessAfterRevoke.statusCode).toBe(403);
  });
});
