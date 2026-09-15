import { expect } from "chai";
import { after, afterEach, beforeEach, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import {
  createReviewService,
  getUnitReviewsService,
} from "../../src/modules/unit-reviews/unit-reviews.service";
import {
  addFavoriteService,
  listFavoritesService,
  removeFavoriteService,
} from "../../src/modules/unit-favorites/unit-favorites.service";
import {
  cleanupUnitFixture,
  createTestCategory,
  createTestCity,
  createTestCountry,
  createTestCurrency,
  createTestUnit,
  createTestUser,
} from "./helpers/test-data";

describe("reviews and favorites integration", function () {
  this.timeout(30000);

  let hostId: string;
  let firstGuestId: string;
  let secondGuestId: string;
  let countryId: string;
  let cityId: string;
  let currencyId: string;
  let categoryId: string;
  let unitId: string;

  beforeEach(async () => {
    const suffix = Date.now();
    const host = await createTestUser({
      emailPrefix: `catalog-host-${suffix}`,
      firstName: "Catalog",
      lastName: "Host",
      role: "HOST",
    });
    hostId = host.id;
    const firstGuest = await createTestUser({
      emailPrefix: `catalog-first-guest-${suffix}`,
      firstName: "First",
      lastName: "Guest",
    });
    firstGuestId = firstGuest.id;
    const secondGuest = await createTestUser({
      emailPrefix: `catalog-second-guest-${suffix}`,
      firstName: "Second",
      lastName: "Guest",
    });
    secondGuestId = secondGuest.id;
    const country = await createTestCountry(`Catalog-${suffix}`);
    countryId = country.id;
    const city = await createTestCity(`Catalog City ${suffix}`, countryId);
    cityId = city.id;
    const currency = await createTestCurrency(`CF${suffix}`);
    currencyId = currency.id;
    const category = await createTestCategory(`Catalog Category ${suffix}`);
    categoryId = category.id;
    const unit = await createTestUnit({
      title: "Reviews Favorites Unit",
      description: "A unit for reviews and favorites integration tests",
      pricePerNight: 100,
      maxGuests: 2,
      isActive: true,
      ownerId: hostId,
      cityId,
      currencyId,
      categoryId,
    });
    unitId = unit.id;
  });

  afterEach(async () => {
    await cleanupUnitFixture({
      unitId,
      cityId,
      countryId,
      currencyId,
      categoryId,
      userIds: [secondGuestId, firstGuestId, hostId],
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates and persists a review after a completed booking", async () => {
    await prisma.booking.create({
      data: {
        unitId,
        guestId: firstGuestId,
        checkIn: new Date("2027-01-01"),
        checkOut: new Date("2027-01-04"),
        totalPrice: 300,
        status: "COMPLETED",
      },
    });

    const review = await createReviewService(
      firstGuestId,
      unitId,
      5,
      "Excellent stay",
    );

    const persistedReview = await prisma.unitReview.findUnique({
      where: { id: review.id },
    });

    expect(persistedReview).to.not.equal(null);
    expect(persistedReview?.unitId).to.equal(unitId);
    expect(persistedReview?.guestId).to.equal(firstGuestId);
    expect(persistedReview?.rating).to.equal(5);
    expect(persistedReview?.comment).to.equal("Excellent stay");
  });

  it("rejects a duplicate review but allows a different guest to review", async () => {
    await prisma.booking.createMany({
      data: [firstGuestId, secondGuestId].map((guestId) => ({
        unitId,
        guestId,
        checkIn: new Date("2027-01-05"),
        checkOut: new Date("2027-01-08"),
        totalPrice: 300,
        status: "COMPLETED" as const,
      })),
    });

    const firstReview = await createReviewService(
      firstGuestId,
      unitId,
      4,
      "Good stay",
    );

    try {
      await createReviewService(firstGuestId, unitId, 3, "Second review");
      expect.fail("The duplicate review should be rejected");
    } catch (error) {
      expect(error).to.have.property("code", "P2002");
    }

    const secondReview = await createReviewService(
      secondGuestId,
      unitId,
      5,
      "Great stay",
    );

    const reviews = await prisma.unitReview.findMany({
      where: { unitId },
    });

    expect(reviews).to.have.length(2);
    expect(reviews.map(({ id }) => id)).to.have.members([
      firstReview.id,
      secondReview.id,
    ]);
  });

  it("retrieves persisted reviews with the review service", async () => {
    await prisma.booking.create({
      data: {
        unitId,
        guestId: firstGuestId,
        checkIn: new Date("2027-01-09"),
        checkOut: new Date("2027-01-12"),
        totalPrice: 300,
        status: "COMPLETED",
      },
    });

    await createReviewService(firstGuestId, unitId, 4, "Solid stay");

    const result = await getUnitReviewsService(unitId);

    expect(result.reviews).to.have.length(1);
    expect(result.reviews[0].unitId).to.equal(unitId);
    expect(result.avgRating._avg.rating).to.equal(4);
  });

  it("creates, retrieves, and removes a favorite", async () => {
    const favorite = await addFavoriteService(firstGuestId, unitId);
    const listedFavorites = await listFavoritesService(firstGuestId);

    expect(favorite.userId).to.equal(firstGuestId);
    expect(favorite.unitId).to.equal(unitId);
    expect(listedFavorites).to.have.length(1);
    expect(listedFavorites[0].id).to.equal(favorite.id);
    expect(listedFavorites[0].unit.id).to.equal(unitId);

    await removeFavoriteService(firstGuestId, unitId);

    const persistedFavorite = await prisma.unitFavorite.findUnique({
      where: { unitId_userId: { unitId, userId: firstGuestId } },
    });
    expect(persistedFavorite).to.equal(null);
  });

  it("rejects a duplicate favorite but allows a different user to favorite the unit", async () => {
    const firstFavorite = await addFavoriteService(firstGuestId, unitId);

    try {
      await addFavoriteService(firstGuestId, unitId);
      expect.fail("The duplicate favorite should be rejected");
    } catch (error) {
      expect(error).to.have.property("code", "P2002");
    }

    const secondFavorite = await addFavoriteService(secondGuestId, unitId);
    const persistedFavorites = await prisma.unitFavorite.findMany({
      where: { unitId },
    });

    expect(persistedFavorites).to.have.length(2);
    expect(persistedFavorites.map(({ id }) => id)).to.have.members([
      firstFavorite.id,
      secondFavorite.id,
    ]);
  });
});
