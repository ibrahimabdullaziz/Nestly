import { expect } from "chai";
import { after, afterEach, beforeEach, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import {
  cancelBookingService,
  confirmBookingService,
  createBookingService,
  rejectBookingService,
  updateBookingService,
} from "../../src/modules/bookings/bookings.service";

describe("booking lifecycle integration", function () {
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
        email: `lifecycle-host-${suffix}@example.com`,
        password: "hashed-password",
        firstName: "Lifecycle",
        lastName: "Host",
        role: "HOST",
      },
    });
    hostId = host.id;

    const guest = await prisma.user.create({
      data: {
        email: `lifecycle-guest-${suffix}@example.com`,
        password: "hashed-password",
        firstName: "Lifecycle",
        lastName: "Guest",
      },
    });
    guestId = guest.id;

    const country = await prisma.country.create({
      data: {
        name: `Lifecycle Country ${suffix}`,
        code: `LC${suffix}`,
      },
    });
    countryId = country.id;

    const city = await prisma.city.create({
      data: {
        name: `Lifecycle City ${suffix}`,
        countryId,
      },
    });
    cityId = city.id;

    const currency = await prisma.currency.create({
      data: {
        code: `LY${suffix}`,
        symbol: "$",
      },
    });
    currencyId = currency.id;

    const category = await prisma.unitCategory.create({
      data: { name: `Lifecycle Category ${suffix}` },
    });
    categoryId = category.id;

    const unit = await prisma.unit.create({
      data: {
        title: "Booking Lifecycle Unit",
        description: "A unit for lifecycle integration tests",
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

  it("creates a pending booking and persists confirmation", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-01"),
      new Date("2026-12-04"),
    );

    expect(booking.status).to.equal("PENDING");

    const confirmedBooking = await confirmBookingService(booking.id, hostId);
    expect(confirmedBooking.status).to.equal("CONFIRMED");

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.status).to.equal("CONFIRMED");
  });

  it("persists rejection of a pending booking", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-05"),
      new Date("2026-12-08"),
    );

    const rejectedBooking = await rejectBookingService(booking.id, hostId);
    expect(rejectedBooking.status).to.equal("REJECTED");

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.status).to.equal("REJECTED");
  });

  it("persists cancellation of a pending booking", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-09"),
      new Date("2026-12-12"),
    );

    const cancelledBooking = await cancelBookingService(booking.id, guestId);
    expect(cancelledBooking.status).to.equal("CANCELLED");

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.status).to.equal("CANCELLED");
  });

  it("persists updated dates for a pending booking", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-13"),
      new Date("2026-12-16"),
    );
    const updatedCheckIn = new Date("2026-12-17");
    const updatedCheckOut = new Date("2026-12-20");

    const updatedBooking = await updateBookingService(
      booking.id,
      guestId,
      [updatedCheckIn, updatedCheckOut],
    );

    expect(updatedBooking.checkIn).to.deep.equal(updatedCheckIn);
    expect(updatedBooking.checkOut).to.deep.equal(updatedCheckOut);

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.checkIn).to.deep.equal(updatedCheckIn);
    expect(persistedBooking?.checkOut).to.deep.equal(updatedCheckOut);
    expect(persistedBooking?.status).to.equal("PENDING");
  });

  it("does not cancel a confirmed booking", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-21"),
      new Date("2026-12-24"),
    );
    await confirmBookingService(booking.id, hostId);

    try {
      await cancelBookingService(booking.id, guestId);
      expect.fail("A confirmed booking should not be cancelled");
    } catch (error) {
      expect(error).to.have.property("statusCode", 400);
    }

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.status).to.equal("CONFIRMED");
  });

  it("does not update the dates of a confirmed booking", async () => {
    const booking = await createBookingService(
      guestId,
      unitId,
      new Date("2026-12-25"),
      new Date("2026-12-28"),
    );
    await confirmBookingService(booking.id, hostId);

    try {
      await updateBookingService(booking.id, guestId, [
        new Date("2026-12-29"),
        new Date("2027-01-01"),
      ]);
      expect.fail("A confirmed booking should not be updated");
    } catch (error) {
      expect(error).to.have.property("statusCode", 400);
    }

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(persistedBooking?.status).to.equal("CONFIRMED");
    expect(persistedBooking?.checkIn).to.deep.equal(new Date("2026-12-25"));
    expect(persistedBooking?.checkOut).to.deep.equal(new Date("2026-12-28"));
  });
});