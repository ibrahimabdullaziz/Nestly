import { expect } from "chai";
import { after, before, describe, it } from "mocha";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma";
import { authServiceDependencies } from "../../src/modules/auth/auth.service";
import {
  createTestAdmin,
  loginTestUser,
  promoteUserToHost,
  registerTestUser,
} from "./helpers/auth";

describe("E2E active Unit setup", function () {
  this.timeout(30000);

  const originalGenerateOtp = authServiceDependencies.generateOtp;
  const originalSendMail = authServiceDependencies.sendMail;

  before(() => {
    authServiceDependencies.generateOtp = async () => "123456";
    authServiceDependencies.sendMail = async () => undefined;
  });

  after(async () => {
    authServiceDependencies.generateOtp = originalGenerateOtp;
    authServiceDependencies.sendMail = originalSendMail;
    await prisma.$disconnect();
  });

  it("creates and activates a Unit through the Host HTTP API", async () => {
    const admin = await createTestAdmin();
    const host = await registerTestUser(request(app), "unit-host");
    await promoteUserToHost(host.id);

    const createdUnitIds: string[] = [];
    let countryId: string | undefined;
    let cityId: string | undefined;
    let currencyId: string | undefined;
    let categoryId: string | undefined;

    try {
      const { accessToken: adminAccessToken } = await loginTestUser(
        request(app),
        admin,
      );
      const { accessToken: hostAccessToken } = await loginTestUser(
        request(app),
        host,
      );
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const countryResponse = await request(app)
        .post("/api/countries")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Unit Country ${suffix}`,
          code: `EUC${suffix}`,
        });

      expect(countryResponse.status).to.equal(200);
      countryId = countryResponse.body.data.id;

      const cityResponse = await request(app)
        .post("/api/cities")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Unit City ${suffix}`,
          countryId,
        });

      expect(cityResponse.status).to.equal(200);
      cityId = cityResponse.body.data.id;

      const currencyResponse = await request(app)
        .post("/api/currencies")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          code: `EUC${suffix}`,
          symbol: "$",
        });

      expect(currencyResponse.status).to.equal(200);
      currencyId = currencyResponse.body.data.id;

      const categoryResponse = await request(app)
        .post("/api/unit-categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Unit Category ${suffix}`,
        });

      expect(categoryResponse.status).to.equal(200);
      categoryId = categoryResponse.body.data.id;

      const unitResponse = await request(app)
        .post("/api/units")
        .set("Authorization", `Bearer ${hostAccessToken}`)
        .send({
          title: "E2E Test Unit",
          description: "Unit created by E2E test",
          pricePerNight: 150,
          maxGuests: 2,
          cityId,
          currencyId,
          categoryId,
        });

      expect(unitResponse.status).to.equal(201);
      expect(unitResponse.body.data.id).to.be.a("string").and.not.empty;
      expect(unitResponse.body.data.ownerId).to.equal(host.id);
      expect(unitResponse.body.data.cityId).to.equal(cityId);
      expect(unitResponse.body.data.currencyId).to.equal(currencyId);
      expect(unitResponse.body.data.categoryId).to.equal(categoryId);
      expect(unitResponse.body.data.isActive).to.equal(false);

      const unitId = unitResponse.body.data.id as string;
      createdUnitIds.push(unitId);

      const activateResponse = await request(app)
        .patch(`/api/units/${unitId}/activate`)
        .set("Authorization", `Bearer ${hostAccessToken}`);

      expect(activateResponse.status).to.equal(200);
      expect(activateResponse.body.data.id).to.equal(unitId);
      expect(activateResponse.body.data.isActive).to.equal(true);
      expect(activateResponse.body.data.deletedAt).to.equal(null);

      const persistedUnit = await prisma.unit.findUnique({
        where: { id: unitId },
      });

      expect(persistedUnit?.ownerId).to.equal(host.id);
      expect(persistedUnit?.cityId).to.equal(cityId);
      expect(persistedUnit?.currencyId).to.equal(currencyId);
      expect(persistedUnit?.categoryId).to.equal(categoryId);
      expect(persistedUnit?.isActive).to.equal(true);
      expect(persistedUnit?.deletedAt).to.equal(null);
    } finally {
      if (createdUnitIds.length > 0) {
        await prisma.unit.deleteMany({
          where: { id: { in: createdUnitIds } },
        });
      }
      if (cityId) {
        await prisma.city.delete({ where: { id: cityId } });
      }
      if (countryId) {
        await prisma.country.delete({ where: { id: countryId } });
      }
      if (currencyId) {
        await prisma.currency.delete({ where: { id: currencyId } });
      }
      if (categoryId) {
        await prisma.unitCategory.delete({ where: { id: categoryId } });
      }
      await prisma.user.delete({ where: { id: host.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    }
  });
});
