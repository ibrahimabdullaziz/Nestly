import { expect } from "chai";
import { after, afterEach, beforeEach, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import { createBookingService } from "../../src/modules/bookings/bookings.service";
import {
  cleanupUnitFixture,
  createTestCategory,
  createTestCity,
  createTestCountry,
  createTestCurrency,
  createTestUnit,
  createTestUser,
} from "./helpers/test-data";

describe("booking transaction integration", function () {
  this.timeout(10000);

  let hostId: string;
  let guestId: string;
  let countryId: string;
  let cityId: string;
  let currencyId: string;
  let categoryId: string;
  let unitId: string;

  beforeEach(async () => {
    const suffix = Date.now();
    const host = await createTestUser({
      emailPrefix: `transaction-host-${suffix}`,
      firstName: "Transaction",
      lastName: "Host",
      role: "HOST",
    });
    hostId = host.id;
    const guest = await createTestUser({
      emailPrefix: `transaction-guest-${suffix}`,
      firstName: "Transaction",
      lastName: "Guest",
    });
    guestId = guest.id;
    const country = await createTestCountry(`Transaction-${suffix}`);
    countryId = country.id;
    const city = await createTestCity(`Transaction City ${suffix}`, countryId);
    cityId = city.id;
    const currency = await createTestCurrency(`TR${suffix}`);
    currencyId = currency.id;
    const category = await createTestCategory(`Transaction Category ${suffix}`);
    categoryId = category.id;
    const unit = await createTestUnit({
      title: "Booking Transaction Unit",
      description: "A unit for transaction integration tests",
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
      userIds: [guestId, hostId],
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("persists a successful booking with the expected transaction result", async () => {
    const checkIn = new Date("2026-11-01");
    const checkOut = new Date("2026-11-04");

    const booking = await createBookingService(
      guestId,
      unitId,
      checkIn,
      checkOut,
    );

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(persistedBooking).to.not.equal(null);
    expect(persistedBooking?.unitId).to.equal(unitId);
    expect(persistedBooking?.guestId).to.equal(guestId);
    expect(persistedBooking?.checkIn).to.deep.equal(checkIn);
    expect(persistedBooking?.checkOut).to.deep.equal(checkOut);
    expect(Number(persistedBooking?.totalPrice)).to.equal(300);
    expect(persistedBooking?.status).to.equal("PENDING");
  });

  it("does not persist a new booking when the transaction fails on overlap", async () => {
    const existingBooking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-11-10"),
      new Date("2026-11-14"),
    );

    try {
      await createBookingService(
        guestId,
        unitId,
        new Date("2026-11-12"),
        new Date("2026-11-16"),
      );
      expect.fail("The overlapping booking should fail inside the transaction");
    } catch (error) {
      expect(error).to.have.property("statusCode", 409);
    }

    const persistedBookings = await prisma.booking.findMany({
      where: { unitId },
    });

    expect(persistedBookings).to.have.length(1);
    expect(persistedBookings[0].id).to.equal(existingBooking.id);
    expect(persistedBookings[0].checkIn).to.deep.equal(new Date("2026-11-10"));
    expect(persistedBookings[0].checkOut).to.deep.equal(new Date("2026-11-14"));
  });
});
