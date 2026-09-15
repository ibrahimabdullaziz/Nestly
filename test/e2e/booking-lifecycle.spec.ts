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

describe("E2E booking lifecycle", function () {
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

  it("confirms, rejects, and protects bookings through HTTP", async () => {
    let adminId: string | undefined;
    let hostId: string | undefined;
    let secondHostId: string | undefined;
    let guestId: string | undefined;
    let otherGuestId: string | undefined;
    let countryId: string | undefined;
    let cityId: string | undefined;
    let currencyId: string | undefined;
    let categoryId: string | undefined;
    let unitId: string | undefined;
    const bookingIds: string[] = [];

    try {
      const admin = await createTestAdmin();
      adminId = admin.id;

      const host = await registerTestUser(request(app), "lifecycle-host");
      hostId = host.id;
      await promoteUserToHost(host.id);

      const secondHost = await registerTestUser(
        request(app),
        "lifecycle-second-host",
      );
      secondHostId = secondHost.id;
      await promoteUserToHost(secondHost.id);

      const guest = await registerTestUser(request(app), "lifecycle-guest");
      guestId = guest.id;

      const otherGuest = await registerTestUser(
        request(app),
        "lifecycle-other-guest",
      );
      otherGuestId = otherGuest.id;

      const { accessToken: adminAccessToken } = await loginTestUser(
        request(app),
        admin,
      );
      const { accessToken: hostAccessToken } = await loginTestUser(
        request(app),
        host,
      );
      const { accessToken: secondHostAccessToken } = await loginTestUser(
        request(app),
        secondHost,
      );
      const { accessToken: guestAccessToken } = await loginTestUser(
        request(app),
        guest,
      );
      const { accessToken: otherGuestAccessToken } = await loginTestUser(
        request(app),
        otherGuest,
      );
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const countryResponse = await request(app)
        .post("/api/countries")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Lifecycle Country ${suffix}`,
          code: `ELC${suffix}`,
        });
      expect(countryResponse.status).to.equal(200);
      countryId = countryResponse.body.data.id;

      const cityResponse = await request(app)
        .post("/api/cities")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Lifecycle City ${suffix}`,
          countryId,
        });
      expect(cityResponse.status).to.equal(200);
      cityId = cityResponse.body.data.id;

      const currencyResponse = await request(app)
        .post("/api/currencies")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          code: `ELC${suffix}`,
          symbol: "$",
        });
      expect(currencyResponse.status).to.equal(200);
      currencyId = currencyResponse.body.data.id;

      const categoryResponse = await request(app)
        .post("/api/unit-categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({
          name: `E2E Lifecycle Category ${suffix}`,
        });
      expect(categoryResponse.status).to.equal(200);
      categoryId = categoryResponse.body.data.id;

      const unitResponse = await request(app)
        .post("/api/units")
        .set("Authorization", `Bearer ${hostAccessToken}`)
        .send({
          title: "E2E Lifecycle Unit",
          description: "Unit created for E2E lifecycle tests",
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

      const firstBookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${guestAccessToken}`)
        .send({
          unitId,
          checkIn: "2027-05-01T00:00:00.000Z",
          checkOut: "2027-05-04T00:00:00.000Z",
        });
      expect(firstBookingResponse.status).to.equal(201);
      const firstBookingId = firstBookingResponse.body.data.id as string;
      bookingIds.push(firstBookingId);

      const guestConfirmResponse = await request(app)
        .patch(`/api/bookings/${firstBookingId}/confirm`)
        .set("Authorization", `Bearer ${guestAccessToken}`);
      expect(guestConfirmResponse.status).to.equal(403);

      const pendingBooking = await prisma.booking.findUnique({
        where: { id: firstBookingId },
      });
      expect(pendingBooking?.status).to.equal("PENDING");

      const overlappingCheckIn = "2027-05-02T00:00:00.000Z";
      const overlappingCheckOut = "2027-05-06T00:00:00.000Z";
      const bookingsBeforeOverlap = await prisma.booking.count({
        where: { unitId },
      });

      const overlappingBookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${guestAccessToken}`)
        .send({
          unitId,
          checkIn: overlappingCheckIn,
          checkOut: overlappingCheckOut,
        });

      expect(overlappingBookingResponse.status).to.equal(409);
      expect(overlappingBookingResponse.body.message).to.equal(
        "Unit not available for these dates",
      );

      const bookingsAfterOverlap = await prisma.booking.count({
        where: { unitId },
      });
      expect(bookingsAfterOverlap).to.equal(bookingsBeforeOverlap);

      const unchangedAfterOverlap = await prisma.booking.findUnique({
        where: { id: firstBookingId },
      });
      expect(unchangedAfterOverlap?.id).to.equal(firstBookingId);
      expect(unchangedAfterOverlap?.unitId).to.equal(unitId);
      expect(unchangedAfterOverlap?.guestId).to.equal(guestId);
      expect(unchangedAfterOverlap?.checkIn.toISOString()).to.equal(
        "2027-05-01T00:00:00.000Z",
      );
      expect(unchangedAfterOverlap?.checkOut.toISOString()).to.equal(
        "2027-05-04T00:00:00.000Z",
      );
      expect(unchangedAfterOverlap?.status).to.equal("PENDING");

      const forbiddenUnitTitle = `Guest Forbidden Unit ${suffix}`;
      const unitsBeforeGuestCreate = await prisma.unit.count({
        where: { cityId, title: forbiddenUnitTitle },
      });
      const guestUnitResponse = await request(app)
        .post("/api/units")
        .set("Authorization", `Bearer ${guestAccessToken}`)
        .send({
          title: forbiddenUnitTitle,
          description: "This Unit must not be created",
          pricePerNight: 100,
          maxGuests: 2,
          cityId,
          currencyId,
          categoryId,
        });
      expect(guestUnitResponse.status).to.equal(403);

      const unitsAfterGuestCreate = await prisma.unit.count({
        where: { cityId, title: forbiddenUnitTitle },
      });
      expect(unitsAfterGuestCreate).to.equal(unitsBeforeGuestCreate);

      const hostBookingCheckIn = "2027-06-01T00:00:00.000Z";
      const hostBookingCheckOut = "2027-06-04T00:00:00.000Z";
      const bookingsBeforeHostCreate = await prisma.booking.count({
        where: {
          unitId,
          checkIn: new Date(hostBookingCheckIn),
          checkOut: new Date(hostBookingCheckOut),
        },
      });
      const hostBookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${hostAccessToken}`)
        .send({
          unitId,
          checkIn: hostBookingCheckIn,
          checkOut: hostBookingCheckOut,
        });
      expect(hostBookingResponse.status).to.equal(403);

      const bookingsAfterHostCreate = await prisma.booking.count({
        where: {
          unitId,
          checkIn: new Date(hostBookingCheckIn),
          checkOut: new Date(hostBookingCheckOut),
        },
      });
      expect(bookingsAfterHostCreate).to.equal(bookingsBeforeHostCreate);

      const confirmResponse = await request(app)
        .patch(`/api/bookings/${firstBookingId}/confirm`)
        .set("Authorization", `Bearer ${hostAccessToken}`);
      expect(confirmResponse.status).to.equal(200);
      expect(confirmResponse.body.data.id).to.equal(firstBookingId);
      expect(confirmResponse.body.data.status).to.equal("CONFIRMED");
      expect(confirmResponse.body.data.guestId).to.equal(guestId);
      expect(confirmResponse.body.data.unitId).to.equal(unitId);

      const confirmedBooking = await prisma.booking.findUnique({
        where: { id: firstBookingId },
      });
      expect(confirmedBooking?.status).to.equal("CONFIRMED");
      expect(confirmedBooking?.guestId).to.equal(guestId);
      expect(confirmedBooking?.unitId).to.equal(unitId);

      const secondHostRecord = await prisma.user.findUnique({
        where: { id: secondHost.id },
      });
      expect(secondHostRecord?.role).to.equal("HOST");
      expect(
        await prisma.unit.count({
          where: { id: unitId, ownerId: secondHost.id },
        }),
      ).to.equal(0);

      const wrongHostConfirmResponse = await request(app)
        .patch(`/api/bookings/${firstBookingId}/confirm`)
        .set("Authorization", `Bearer ${secondHostAccessToken}`);
      expect(wrongHostConfirmResponse.status).to.equal(403);

      const unchangedBooking = await prisma.booking.findUnique({
        where: { id: firstBookingId },
      });
      expect(unchangedBooking?.status).to.equal("CONFIRMED");

      const secondBookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${guestAccessToken}`)
        .send({
          unitId,
          checkIn: "2027-05-10T00:00:00.000Z",
          checkOut: "2027-05-13T00:00:00.000Z",
        });
      expect(secondBookingResponse.status).to.equal(201);
      const secondBookingId = secondBookingResponse.body.data.id as string;
      bookingIds.push(secondBookingId);

      const rejectResponse = await request(app)
        .patch(`/api/bookings/${secondBookingId}/reject`)
        .set("Authorization", `Bearer ${hostAccessToken}`);
      expect(rejectResponse.status).to.equal(200);
      expect(rejectResponse.body.data.id).to.equal(secondBookingId);
      expect(rejectResponse.body.data.status).to.equal("REJECTED");

      const rejectedBooking = await prisma.booking.findUnique({
        where: { id: secondBookingId },
      });
      expect(rejectedBooking?.status).to.equal("REJECTED");
      expect(rejectedBooking?.guestId).to.equal(guestId);
      expect(rejectedBooking?.unitId).to.equal(unitId);

      const otherGuestBookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${otherGuestAccessToken}`)
        .send({
          unitId,
          checkIn: "2027-05-20T00:00:00.000Z",
          checkOut: "2027-05-23T00:00:00.000Z",
        });
      expect(otherGuestBookingResponse.status).to.equal(201);
      const otherGuestBookingId = otherGuestBookingResponse.body.data
        .id as string;
      bookingIds.push(otherGuestBookingId);

      const bookingsResponse = await request(app)
        .get("/api/bookings/mine")
        .set("Authorization", `Bearer ${guestAccessToken}`);

      expect(bookingsResponse.status).to.equal(200);
      expect(bookingsResponse.body.data).to.be.an("array");

      const ownBookings = bookingsResponse.body.data as Array<{
        id: string;
        unitId: string;
        guestId: string;
        status: string;
      }>;
      const returnedConfirmedBooking = ownBookings.find(
        (booking) => booking.id === firstBookingId,
      );
      const returnedRejectedBooking = ownBookings.find(
        (booking) => booking.id === secondBookingId,
      );

      expect(returnedConfirmedBooking).to.deep.include({
        id: firstBookingId,
        unitId,
        guestId,
        status: "CONFIRMED",
      });
      expect(returnedRejectedBooking).to.deep.include({
        id: secondBookingId,
        unitId,
        guestId,
        status: "REJECTED",
      });
      expect(
        ownBookings.every((booking) => booking.guestId === guestId),
      ).to.equal(true);
      expect(
        ownBookings.some((booking) => booking.id === otherGuestBookingId),
      ).to.equal(false);

      const persistedReadBooking = await prisma.booking.findUnique({
        where: { id: firstBookingId },
      });
      expect(persistedReadBooking?.status).to.equal("CONFIRMED");
      expect(persistedReadBooking?.unitId).to.equal(unitId);
      expect(persistedReadBooking?.guestId).to.equal(guestId);
    } finally {
      for (const bookingId of bookingIds) {
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
      if (otherGuestId) {
        await prisma.user.delete({ where: { id: otherGuestId } });
      }
      if (hostId) {
        await prisma.user.delete({ where: { id: hostId } });
      }
      if (secondHostId) {
        await prisma.user.delete({ where: { id: secondHostId } });
      }
      if (adminId) {
        await prisma.user.delete({ where: { id: adminId } });
      }
    }
  });
});
