import { expect } from "chai";
import { after, describe, it } from "mocha";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma";
import {
  createTestAdmin,
  loginTestUser,
} from "./helpers/auth";

describe("E2E catalog setup", function () {
  this.timeout(30000);

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates the required catalog records through the Admin HTTP API", async () => {
    const admin = await createTestAdmin();
    let countryId: string | undefined;
    let cityId: string | undefined;
    let currencyId: string | undefined;
    let categoryId: string | undefined;

    try {
      const { accessToken } = await loginTestUser(request(app), admin);
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const countryResponse = await request(app)
        .post("/api/countries")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: `E2E Country ${suffix}`,
          code: `E2E${suffix}`,
        });

      expect(countryResponse.status).to.equal(200);
      expect(countryResponse.body.data.id).to.be.a("string").and.not.empty;
      countryId = countryResponse.body.data.id;

      const cityResponse = await request(app)
        .post("/api/cities")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: `E2E City ${suffix}`,
          countryId,
        });

      expect(cityResponse.status).to.equal(200);
      expect(cityResponse.body.data.id).to.be.a("string").and.not.empty;
      expect(cityResponse.body.data.countryId).to.equal(countryId);
      cityId = cityResponse.body.data.id;

      const currencyResponse = await request(app)
        .post("/api/currencies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          code: `CUR${suffix}`,
          symbol: "$",
        });

      expect(currencyResponse.status).to.equal(200);
      expect(currencyResponse.body.data.id).to.be.a("string").and.not.empty;
      currencyId = currencyResponse.body.data.id;

      const categoryResponse = await request(app)
        .post("/api/unit-categories")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: `E2E Category ${suffix}`,
        });

      expect(categoryResponse.status).to.equal(200);
      expect(categoryResponse.body.data.id).to.be.a("string").and.not.empty;
      categoryId = categoryResponse.body.data.id;

      const [country, city, currency, category] = await Promise.all([
        prisma.country.findUnique({ where: { id: countryId } }),
        prisma.city.findUnique({ where: { id: cityId } }),
        prisma.currency.findUnique({ where: { id: currencyId } }),
        prisma.unitCategory.findUnique({ where: { id: categoryId } }),
      ]);

      expect(country?.id).to.equal(countryId);
      expect(city?.id).to.equal(cityId);
      expect(city?.countryId).to.equal(countryId);
      expect(currency?.id).to.equal(currencyId);
      expect(category?.id).to.equal(categoryId);
    } finally {
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
      await prisma.user.delete({ where: { id: admin.id } });
    }
  });
});