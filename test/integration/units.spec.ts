import { expect } from "chai";
import { after, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import {
  createUnitService,
  listUnitsService,
  softDeleteUnitService,
} from "../../src/modules/units/units.service";
import {
  cleanupUnitFixture,
  createTestCategory,
  createTestCity,
  createTestCountry,
  createTestCurrency,
  createTestUnit,
  createTestUser,
} from "./helpers/test-data";

describe("units integration", function () {
  this.timeout(10000);

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates and persists a unit with its required relations", async () => {
    const suffix = Date.now();
    const user = await createTestUser({
      emailPrefix: `unit-persistence-${suffix}`,
      firstName: "Unit",
      lastName: "Owner",
      role: "HOST",
    });
    const country = await createTestCountry(`Unit-Persistence-${suffix}`);
    const city = await createTestCity(
      `Unit Persistence City ${suffix}`,
      country.id,
    );
    const currency = await createTestCurrency(`UP${suffix}`);
    const category = await createTestCategory(
      `Unit Persistence Category ${suffix}`,
    );

    const unit = await createUnitService(user.id, {
      title: "Integration Unit",
      description: "A unit created by an integration test",
      pricePerNight: 150,
      maxGuests: 4,
      cityId: city.id,
      currencyId: currency.id,
      categoryId: category.id,
    });

    try {
      expect(unit.id).to.be.a("string").and.not.empty;
      expect(unit.ownerId).to.equal(user.id);
      expect(unit.cityId).to.equal(city.id);
      expect(unit.currencyId).to.equal(currency.id);
      expect(unit.categoryId).to.equal(category.id);
      expect(unit.isActive).to.equal(false);
      expect(unit.deletedAt).to.equal(null);

      const persistedUnit = await prisma.unit.findUnique({
        where: { id: unit.id },
      });

      expect(persistedUnit).to.deep.equal(unit);
    } finally {
      await cleanupUnitFixture({
        unitId: unit.id,
        cityId: city.id,
        countryId: country.id,
        currencyId: currency.id,
        categoryId: category.id,
        userIds: [user.id],
      });
    }
  });

  it("excludes soft-deleted units but returns active non-deleted units", async () => {
    const suffix = Date.now();
    const user = await createTestUser({
      emailPrefix: `unit-active-${suffix}`,
      firstName: "Active",
      lastName: "Owner",
      role: "HOST",
    });
    const country = await createTestCountry(`Unit-Active-${suffix}`);
    const city = await createTestCity(`Unit Active City ${suffix}`, country.id);
    const currency = await createTestCurrency(`UA${suffix}`);
    const category = await createTestCategory(`Unit Active Category ${suffix}`);
    const units = await prisma.unit.createManyAndReturn({
      data: [
        {
          title: "Visible Integration Unit",
          description: "This unit remains visible",
          pricePerNight: 200,
          maxGuests: 2,
          isActive: true,
          ownerId: user.id,
          cityId: city.id,
          currencyId: currency.id,
          categoryId: category.id,
        },
        {
          title: "Deleted Integration Unit",
          description: "This unit is soft deleted",
          pricePerNight: 250,
          maxGuests: 2,
          isActive: true,
          ownerId: user.id,
          cityId: city.id,
          currencyId: currency.id,
          categoryId: category.id,
        },
      ],
    });

    try {
      const deletedUnit = await softDeleteUnitService(units[1].id, user.id);
      expect(deletedUnit.deletedAt).to.not.equal(null);

      const activeUnits = await listUnitsService({
        cityId: city.id,
        categoryId: category.id,
        page: 1,
        limit: 20,
      });

      expect(activeUnits.map(({ id }) => id)).to.deep.equal([units[0].id]);

      const persistedDeletedUnit = await prisma.unit.findUnique({
        where: { id: units[1].id },
      });
      expect(persistedDeletedUnit?.deletedAt).to.not.equal(null);
    } finally {
      await cleanupUnitFixture({
        unitId: units[0].id,
        additionalUnitIds: units.slice(1).map(({ id }) => id),
        cityId: city.id,
        countryId: country.id,
        currencyId: currency.id,
        categoryId: category.id,
        userIds: [user.id],
      });
    }
  });

  it("filters units by price and paginates the results", async () => {
    const suffix = Date.now();
    const user = await createTestUser({
      emailPrefix: `unit-pagination-${suffix}`,
      firstName: "Pagination",
      lastName: "Owner",
      role: "HOST",
    });
    const country = await createTestCountry(`Unit-Pagination-${suffix}`);
    const city = await createTestCity(
      `Unit Pagination City ${suffix}`,
      country.id,
    );
    const currency = await createTestCurrency(`UG${suffix}`);
    const category = await createTestCategory(
      `Unit Pagination Category ${suffix}`,
    );
    const units = await prisma.unit.createManyAndReturn({
      data: [100, 150, 200].map((pricePerNight) => ({
        title: `Pagination Unit ${pricePerNight}`,
        description: "A pagination integration unit",
        pricePerNight,
        maxGuests: 2,
        isActive: true,
        ownerId: user.id,
        cityId: city.id,
        currencyId: currency.id,
        categoryId: category.id,
      })),
    });

    try {
      const filteredUnits = await listUnitsService({
        cityId: city.id,
        categoryId: category.id,
        minPrice: 150,
        maxPrice: 200,
        page: 1,
        limit: 20,
      });

      expect(filteredUnits).to.have.length(2);
      expect(filteredUnits.every((unit) => unit.pricePerNight >= 150)).to.equal(
        true,
      );
      expect(filteredUnits.every((unit) => unit.pricePerNight <= 200)).to.equal(
        true,
      );

      const firstPage = await listUnitsService({
        cityId: city.id,
        categoryId: category.id,
        page: 1,
        limit: 2,
      });
      const secondPage = await listUnitsService({
        cityId: city.id,
        categoryId: category.id,
        page: 2,
        limit: 2,
      });

      expect(firstPage).to.have.length(2);
      expect(secondPage).to.have.length(1);
      expect(firstPage.map(({ id }) => id)).to.not.include(secondPage[0].id);
      expect([...firstPage, ...secondPage].map(({ id }) => id)).to.have.members(
        units.map(({ id }) => id),
      );
    } finally {
      await cleanupUnitFixture({
        unitId: units[0].id,
        additionalUnitIds: units.slice(1).map(({ id }) => id),
        cityId: city.id,
        countryId: country.id,
        currencyId: currency.id,
        categoryId: category.id,
        userIds: [user.id],
      });
    }
  });
});
