import { expect } from "chai";
import { after, describe, it } from "mocha";
import prisma from "../../src/db/prisma";

describe("cities integration", function () {
  this.timeout(10000);

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates and persists a city related to its country", async () => {
    const country = await prisma.country.create({
      data: {
        name: "City Integration Country",
        code: "CIC",
      },
    });

    try {
      const city = await prisma.city.create({
        data: {
          name: "Integration City",
          countryId: country.id,
        },
      });

      try {
        expect(city.id).to.be.a("string").and.not.empty;
        expect(city.name).to.equal("Integration City");
        expect(city.countryId).to.equal(country.id);

        const persistedCity = await prisma.city.findUnique({
          where: { id: city.id },
          include: { country: true },
        });

        expect(persistedCity).to.not.equal(null);
        expect(persistedCity?.name).to.equal(city.name);
        expect(persistedCity?.countryId).to.equal(country.id);
        expect(persistedCity?.country).to.deep.equal(country);
      } finally {
        await prisma.city.delete({ where: { id: city.id } });
      }
    } finally {
      await prisma.country.delete({ where: { id: country.id } });
    }
  });

  it("rejects a duplicate city in one country but allows it in another", async () => {
    const firstCountry = await prisma.country.create({
      data: {
        name: "First City Integration Country",
        code: "FCI",
      },
    });
    const secondCountry = await prisma.country.create({
      data: {
        name: "Second City Integration Country",
        code: "SCI",
      },
    });

    const cityName = "Shared Integration City";
    const firstCity = await prisma.city.create({
      data: { name: cityName, countryId: firstCountry.id },
    });

    try {
      try {
        await prisma.city.create({
          data: { name: cityName, countryId: firstCountry.id },
        });
        expect.fail("The duplicate city should be rejected");
      } catch (error) {
        expect(error).to.have.property("code", "P2002");
      }

      const secondCity = await prisma.city.create({
        data: { name: cityName, countryId: secondCountry.id },
      });

      try {
        expect(secondCity.name).to.equal(cityName);
        expect(secondCity.countryId).to.equal(secondCountry.id);
      } finally {
        await prisma.city.delete({ where: { id: secondCity.id } });
      }
    } finally {
      await prisma.city.delete({ where: { id: firstCity.id } });
      await prisma.country.delete({ where: { id: firstCountry.id } });
      await prisma.country.delete({ where: { id: secondCountry.id } });
    }
  });
});
