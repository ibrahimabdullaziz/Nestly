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

describe("E2E booking setup", function () {
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

  it("creates a booking through the Guest HTTP API", async () => {
    let adminId: string | undefined;
    let hostId: string | undefined;
    let guestId: string | undefined;
    let countryId: string | undefined;
    let cityId: string | undefined;
    let currencyId: string | undefined;
    let categoryId: string | undefined;
    let unitId: string | undefined;
    let bookingId: string | undefined;

    try {
      const admin = await createTestAdmin();
      adminId = admin.id;

      const host = await registerTestUser(request(app), "booking-host");
      hostId = host.id;
      await promoteUserToHost(host.id);

      const guest = await registerTestUser(request(app), "booking-guest");
      guestId = guest.id;

      const { accessToken: adminAccessToken } = await loginTestUser(
        request(app),
        admin,
      );
      const { accessToken: hostAccessToken } = await loginTestUser(
        request(app),
        host,
      );
      const { accessToken: guestAccessToken } = await loginTestUser(
        request(app),
        guest,
      );
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const countryResponse = await request(app)
        .post("/api/countries")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Booking Country ${suffix}`,
          code: `EBC${suffix}`,
        });
      expect(countryResponse.status).to.equal(200);
      countryId = countryResponse.body.data.id;

      const cityResponse = await request(app)
        .post("/api/cities")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Booking City ${suffix}`,
          countryId,
        });
      expect(cityResponse.status).to.equal(200);
      cityId = cityResponse.body.data.id;

      const currencyResponse = await request(app)
        .post("/api/currencies")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          code: `EBC${suffix}`,
          symbol: "$",
        });
      expect(currencyResponse.status).to.equal(200);
      currencyId = currencyResponse.body.data.id;

      const categoryResponse = await request(app)
        .post("/api/unit-categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Booking Category ${suffix}`,
        });
      expect(categoryResponse.status).to.equal(200);
      categoryId = categoryResponse.body.data.id;

      const unitResponse = await request(app)
        .post("/api/units")
        .set("Authorization", `Bearer ${hostAccessToken}`)
        .send({
          title: "E2E Booking Unit",
          description: "Unit created for E2E booking setup",
          pricePerNight: 150,
          maxGuests: 2,
          cityId,
          currencyId,
          categoryId,
        });
      expect(unitResponse.status).to.equal(201);
      unitId = unitResponse.body.data.id;

      const activateResponse = await request(app)
        .patch(`/api/units/${unitId}/activate`)
        .set("Authorization", `Bearer ${hostAccessToken}`);
      expect(activateResponse.status).to.equal(200);
      expect(activateResponse.body.data.isActive).to.equal(true);

      const checkIn = "2027-04-01T00:00:00.000Z";
      const checkOut = "2027-04-04T00:00:00.000Z";
      const bookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${guestAccessToken}`)
        .send({ unitId, checkIn, checkOut });

      expect(bookingResponse.status).to.equal(201);
      expect(bookingResponse.body.data.id).to.be.a("string").and.not.empty;
      expect(bookingResponse.body.data.unitId).to.equal(unitId);
      expect(bookingResponse.body.data.guestId).to.equal(guestId);
      expect(
        new Date(bookingResponse.body.data.checkIn).toISOString(),
      ).to.equal(checkIn);
      expect(
        new Date(bookingResponse.body.data.checkOut).toISOString(),
      ).to.equal(checkOut);
      expect(bookingResponse.body.data.status).to.equal("PENDING");
      bookingId = bookingResponse.body.data.id;

      const persistedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      expect(persistedBooking?.id).to.equal(bookingId);
      expect(persistedBooking?.unitId).to.equal(unitId);
      expect(persistedBooking?.guestId).to.equal(guestId);
      expect(persistedBooking?.checkIn.toISOString()).to.equal(checkIn);
      expect(persistedBooking?.checkOut.toISOString()).to.equal(checkOut);
      expect(persistedBooking?.status).to.equal("PENDING");
    } finally {
      if (bookingId) {
        await prisma.booking.delete({ where: { id: bookingId } });
      }
      if (unitId) {
        await prisma.unit.delete({ where: { id: unitId } });
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
      if (guestId) {
        await prisma.user.delete({ where: { id: guestId } });
      }
      if (hostId) {
        await prisma.user.delete({ where: { id: hostId } });
      }
      if (adminId) {
        await prisma.user.delete({ where: { id: adminId } });
      }
    }
  });
});
