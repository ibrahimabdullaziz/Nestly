import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";
import {
  bookingServiceDependencies,
  cancelBookingService,
  confirmBookingService,
  createBookingService,
  rejectBookingService,
  updateBookingService,
} from "../../src/modules/bookings/bookings.service";

const prisma = bookingServiceDependencies.prisma;
const unit = { pricePerNight: 100 };
const booking = {
  id: "booking-1",
  unitId: "unit-1",
  guestId: "guest-1",
  status: "PENDING",
};

function transaction() {
  return {
    $queryRaw: sinon.stub().resolves([{ id: "unit-1" }]),
    booking: {
      findFirst: sinon.stub().resolves(null),
      create: sinon.stub().resolves(booking),
      update: sinon.stub().resolves(booking),
    },
  };
}

function useTransaction(tx: ReturnType<typeof transaction>) {
  return sinon
    .stub(prisma, "$transaction")
    .callsFake(async (callback) => callback(tx));
}

describe("bookings service", () => {
  afterEach(() => sinon.restore());

  it("calculates the booking price by number of nights", async () => {
    sinon.stub(prisma.unit, "findUnique").resolves(unit);
    const tx = transaction();
    useTransaction(tx);

    const result = await createBookingService(
      "guest-1",
      "unit-1",
      new Date("2026-10-01"),
      new Date("2026-10-04"),
    );

    expect(tx.booking.create.firstCall.args[0].data).to.include({
      unitId: "unit-1",
      guestId: "guest-1",
      totalPrice: 300,
      status: "PENDING",
    });
    expect(result).to.equal(booking);
  });

  for (const [name, checkIn, checkOut] of [
    ["zero-night", "2026-10-01", "2026-10-01"],
    ["negative-night", "2026-10-03", "2026-10-01"],
    ["invalid", "not-a-date", "2026-10-03"],
  ] as const) {
    it(`rejects ${name} booking dates`, async () => {
      try {
        await createBookingService(
          "guest-1",
          "unit-1",
          new Date(checkIn),
          new Date(checkOut),
        );
        expect.fail("createBookingService should reject");
      } catch (error) {
        expect(error).to.have.property("statusCode", 400);
        expect(error).to.have.property("message", "Invalid booking dates");
      }
    });
  }

  it("rejects a booking when the unit does not exist", async () => {
    sinon.stub(prisma.unit, "findUnique").resolves(null);

    try {
      await createBookingService(
        "guest-1",
        "unit-1",
        new Date("2026-10-01"),
        new Date("2026-10-02"),
      );
      expect.fail("createBookingService should reject");
    } catch (error) {
      expect(error).to.have.property("statusCode", 404);
      expect(error).to.have.property("message", "Unit is not found!");
    }
  });

  for (const status of ["PENDING", "CONFIRMED"] as const) {
    it(`blocks availability for ${status.toLowerCase()} overlapping bookings`, async () => {
      sinon.stub(prisma.unit, "findUnique").resolves(unit);
      const tx = transaction();
      tx.booking.findFirst.resolves({ id: "existing", status });
      useTransaction(tx);

      try {
        await createBookingService(
          "guest-1",
          "unit-1",
          new Date("2026-10-02"),
          new Date("2026-10-04"),
        );
        expect.fail("createBookingService should reject");
      } catch (error) {
        expect(error).to.have.property("statusCode", 409);
        expect(tx.booking.create.called).to.equal(false);
      }
    });
  }

  for (const status of ["CANCELLED", "REJECTED"] as const) {
    it(`allows availability after a ${status.toLowerCase()} booking`, async () => {
      sinon.stub(prisma.unit, "findUnique").resolves(unit);
      const tx = transaction();
      useTransaction(tx);

      await createBookingService(
        "guest-1",
        "unit-1",
        new Date("2026-10-02"),
        new Date("2026-10-04"),
      );

      expect(tx.booking.findFirst.firstCall.args[0].where.status).to.deep.equal(
        {
          in: ["PENDING", "CONFIRMED"],
        },
      );
      expect(tx.booking.create.calledOnce).to.equal(true);
    });
  }

  it("allows exact boundary dates without overlap", async () => {
    sinon.stub(prisma.unit, "findUnique").resolves(unit);
    const tx = transaction();
    useTransaction(tx);

    await createBookingService(
      "guest-1",
      "unit-1",
      new Date("2026-10-04"),
      new Date("2026-10-06"),
    );

    const where = tx.booking.findFirst.firstCall.args[0].where;
    expect(where.checkIn).to.deep.equal({ lt: new Date("2026-10-06") });
    expect(where.checkOut).to.deep.equal({ gt: new Date("2026-10-04") });
  });

  it("updates only an owned pending booking", async () => {
    const findFirst = sinon.stub(prisma.booking, "findFirst").resolves(booking);
    sinon.stub(prisma.unit, "findUnique").resolves(unit);
    const tx = transaction();
    useTransaction(tx);

    await updateBookingService("booking-1", "guest-1", [
      new Date("2026-11-01"),
      new Date("2026-11-03"),
    ]);

    expect(
      findFirst.calledWith({ where: { id: "booking-1", guestId: "guest-1" } }),
    ).to.equal(true);
    expect(tx.booking.update.calledOnce).to.equal(true);
  });

  it("rejects updates for non-pending bookings", async () => {
    sinon
      .stub(prisma.booking, "findFirst")
      .resolves({ ...booking, status: "CONFIRMED" });

    try {
      await updateBookingService("booking-1", "guest-1", [
        new Date("2026-11-01"),
        new Date("2026-11-03"),
      ]);
      expect.fail("updateBookingService should reject");
    } catch (error) {
      expect(error).to.have.property("statusCode", 400);
    }
  });

  it("allows only the booking guest to cancel a pending booking", async () => {
    const findFirst = sinon.stub(prisma.booking, "findFirst").resolves(booking);
    const update = sinon
      .stub(prisma.booking, "update")
      .resolves({ ...booking, status: "CANCELLED" });

    await cancelBookingService("booking-1", "guest-1");

    expect(findFirst.calledWith({ where: { id: "booking-1" } })).to.equal(true);
    expect(
      update.calledWith({
        where: { id: "booking-1" },
        data: { status: "CANCELLED" },
      }),
    ).to.equal(true);
  });

  it("rejects cancellation by another guest or after confirmation", async () => {
    sinon.stub(prisma.booking, "findFirst").resolves(booking);

    try {
      await cancelBookingService("booking-1", "other-guest");
      expect.fail("cancelBookingService should reject");
    } catch (error) {
      expect(error).to.have.property("statusCode", 403);
    }

    sinon.restore();
    sinon
      .stub(prisma.booking, "findFirst")
      .resolves({ ...booking, status: "CONFIRMED" });
    try {
      await cancelBookingService("booking-1", "guest-1");
      expect.fail("cancelBookingService should reject");
    } catch (error) {
      expect(error).to.have.property("statusCode", 400);
    }
  });

  for (const [name, service, status] of [
    ["confirm", confirmBookingService, "CONFIRMED"],
    ["reject", rejectBookingService, "REJECTED"],
  ] as const) {
    it(`allows the unit host to ${name} a booking`, async () => {
      sinon
        .stub(prisma.booking, "findFirst")
        .resolves({ unit: { ownerId: "host-1" } });
      const update = sinon.stub(prisma.booking, "update").resolves(booking);

      await service("booking-1", "host-1");

      expect(
        update.calledWith({ where: { id: "booking-1" }, data: { status } }),
      ).to.equal(true);
    });

    it(`rejects ${name} by another host`, async () => {
      sinon
        .stub(prisma.booking, "findFirst")
        .resolves({ unit: { ownerId: "host-1" } });

      try {
        await service("booking-1", "other-host");
        expect.fail(`${name}BookingService should reject`);
      } catch (error) {
        expect(error).to.have.property("statusCode", 403);
      }
    });
  }

  it("surfaces transaction failures", async () => {
    sinon.stub(prisma.unit, "findUnique").resolves(unit);
    const error = new Error("transaction failed");
    sinon.stub(prisma, "$transaction").rejects(error);

    try {
      await createBookingService(
        "guest-1",
        "unit-1",
        new Date("2026-10-01"),
        new Date("2026-10-02"),
      );
      expect.fail("createBookingService should reject");
    } catch (actual) {
      expect(actual).to.equal(error);
    }
  });
});
