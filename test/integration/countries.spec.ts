import { expect } from "chai";
import { after, describe, it } from "mocha";
import prisma from "../../src/db/prisma";

describe("countries integration", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("creates and persists a country", async () => {
    const countryData = {
      name: "Integration Test Country",
      code: "ITC",
    };

    const createdCountry = await prisma.country.create({ data: countryData });

    try {
      expect(createdCountry.id).to.be.a("string").and.not.empty;
      expect(createdCountry.name).to.equal(countryData.name);
      expect(createdCountry.code).to.equal(countryData.code);

      const persistedCountry = await prisma.country.findUnique({
        where: { id: createdCountry.id },
      });

      expect(persistedCountry).to.deep.equal(createdCountry);
    } finally {
      await prisma.country.delete({ where: { id: createdCountry.id } });
    }
  });

  it("rejects a duplicate country name and code", async () => {
    const countryData = {
      name: "Duplicate Integration Country",
      code: "DIC",
    };

    const createdCountry = await prisma.country.create({ data: countryData });

    try {
      try {
        await prisma.country.create({ data: countryData });
        expect.fail("The duplicate country should be rejected");
      } catch (error) {
        expect(error).to.have.property("code", "P2002");
      }
    } finally {
      await prisma.country.delete({ where: { id: createdCountry.id } });
    }
  });
});
