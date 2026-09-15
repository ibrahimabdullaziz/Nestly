import { expect } from "chai";
import { after, afterEach, beforeEach, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import { createBookingService } from "../../src/modules/bookings/bookings.service";

describe("booking availability integration", function () {
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

    const host = await prisma.user.create({
      data: {
        email: `booking-host-${suffix}@example.com`,
        password: "hashed-password",
        firstName: "Booking",
        lastName: "Host",
        role: "HOST",
      },
    });
    hostId = host.id;

    const guest = await prisma.user.create({
      data: {
        email: `booking-guest-${suffix}@example.com`,
        password: "hashed-password",
        firstName: "Booking",
        lastName: "Guest",
      },
    });
    guestId = guest.id;

    const country = await prisma.country.create({
      data: {
        name: `Booking Country ${suffix}`,
        code: `BC${suffix}`,
      },
    });
    countryId = country.id;

    const city = await prisma.city.create({
      data: {
        name: `Booking City ${suffix}`,
        countryId,
      },
    });
    cityId = city.id;

    const currency = await prisma.currency.create({
      data: {
        code: `BK${suffix}`,
        symbol: "$",
      },
    });
    currencyId = currency.id;

    const category = await prisma.unitCategory.create({
      data: { name: `Booking Category ${suffix}` },
    });
    categoryId = category.id;

    const unit = await prisma.unit.create({
      data: {
        title: "Booking Availability Unit",
        description: "A unit for availability integration tests",
        pricePerNight: 100,
        maxGuests: 2,
        isActive: true,
        ownerId: hostId,
        cityId,
        currencyId,
        categoryId,
      },
    });
    unitId = unit.id;
  });

  afterEach(async () => {
    await prisma.booking.deleteMany({ where: { unitId } });
    await prisma.unit.delete({ where: { id: unitId } });
    await prisma.city.delete({ where: { id: cityId } });
    await prisma.country.delete({ where: { id: countryId } });
    await prisma.currency.delete({ where: { id: currencyId } });
    await prisma.unitCategory.delete({ where: { id: categoryId } });
    await prisma.user.delete({ where: { id: guestId } });
    await prisma.user.delete({ where: { id: hostId } });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("allows a requested range completely before an existing booking", async () => {
    const existingBooking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-10"),
      new Date("2026-10-14"),
    );

    const requestedBooking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-01"),
      new Date("2026-10-05"),
    );

    const persistedBookings = await prisma.booking.findMany({
      where: { unitId },
    });

    expect(existingBooking.id).to.be.a("string");
    expect(requestedBooking.id).to.be.a("string");
    expect(persistedBookings).to.have.length(2);
  });

  it("allows a requested range completely after an existing booking", async () => {
    await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-10"),
      new Date("2026-10-14"),
    );

    const requestedBooking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-15"),
      new Date("2026-10-19"),
    );

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: requestedBooking.id },
    });

    expect(persistedBooking?.checkIn).to.deep.equal(new Date("2026-10-15"));
    expect(persistedBooking?.checkOut).to.deep.equal(new Date("2026-10-19"));
  });

  for (const [name, checkIn, checkOut] of [
    ["starts before and overlaps", "2026-10-05", "2026-10-11"],
    ["starts during", "2026-10-12", "2026-10-16"],
    ["completely contains", "2026-10-08", "2026-10-16"],
    ["exactly matches", "2026-10-10", "2026-10-14"],
  ] as const) {
    it(`rejects a requested range that ${name} an existing booking`, async () => {
      const existingBooking = await createBookingService(
        guestId,
        unitId,
        new Date("2026-10-10"),
        new Date("2026-10-14"),
      );

      try {
        await createBookingService(
          guestId,
          unitId,
          new Date(checkIn),
          new Date(checkOut),
        );
        expect.fail("The overlapping booking should be rejected");
      } catch (error) {
        expect(error).to.have.property("statusCode", 409);
      }

      const persistedBookings = await prisma.booking.findMany({
        where: { unitId },
      });

      expect(persistedBookings.map(({ id }) => id)).to.deep.equal([
        existingBooking.id,
      ]);
    });
  }

  it("allows a back-to-back booking when check-in equals existing check-out", async () => {
    await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-10"),
      new Date("2026-10-14"),
    );

    const backToBackBooking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-10-14"),
      new Date("2026-10-18"),
    );

    const persistedBookings = await prisma.booking.findMany({
      where: { unitId },
    });

    expect(backToBackBooking.id).to.be.a("string");
    expect(persistedBookings).to.have.length(2);
  });
});