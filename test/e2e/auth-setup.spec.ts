import { expect } from "chai";
import { after, afterEach, before, describe, it } from "mocha";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma";
import { authServiceDependencies } from "../../src/modules/auth/auth.service";
import {
  createTestAdmin,
  loginTestUser,
  promoteUserToHost,
  registerTestUser,
  type RegisteredUser,
} from "./helpers/auth";

describe("E2E authentication setup", function () {
  this.timeout(30000);

  const originalGenerateOtp = authServiceDependencies.generateOtp;
  const originalSendMail = authServiceDependencies.sendMail;
  const createdUserIds: string[] = [];

  before(() => {
    authServiceDependencies.generateOtp = async () => "123456";
    authServiceDependencies.sendMail = async () => undefined;
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds.splice(0) } },
      });
    }
  });

  after(async () => {
    authServiceDependencies.generateOtp = originalGenerateOtp;
    authServiceDependencies.sendMail = originalSendMail;
    await prisma.$disconnect();
  });

  async function verifyToken(user: RegisteredUser, expectedRole: string) {
    const loggedIn = await loginTestUser(request(app), user);
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loggedIn.accessToken}`);

    expect(response.status).to.equal(200);
    expect(response.body.data).to.deep.equal({
      id: user.id,
      role: expectedRole,
    });

    return loggedIn.accessToken;
  }

  it("creates an Admin fixture and authenticates it through HTTP", async () => {
    const admin = await createTestAdmin();
    createdUserIds.push(admin.id);

    const accessToken = await verifyToken(admin, "ADMIN");

    expect(accessToken).to.be.a("string").and.not.empty;
  });

  it("authenticates both the Host and Guest through HTTP", async () => {
    const host = await registerTestUser(request(app), "host");
    createdUserIds.push(host.id);
    await promoteUserToHost(host.id);

    const guest = await registerTestUser(request(app), "guest");
    createdUserIds.push(guest.id);

    const hostAccessToken = await verifyToken(host, "HOST");
    const guestAccessToken = await verifyToken(guest, "GUEST");

    expect(hostAccessToken).to.be.a("string").and.not.empty;
    expect(guestAccessToken).to.be.a("string").and.not.empty;
  });
});
