import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { bookingServices } from "../../src/modules/bookings/bookings.service";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  getGuestBookings,
  getHostBookings,
  rejectBooking,
  updateBooking,
} from "../../src/modules/bookings/bookings.controller";

function createResponse() {
  const status = sinon.stub();
  const response = { status, json: sinon.stub() } as unknown as Response;
  status.returns(response);
  return response;
}

function createRequest(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user = { id: "guest-1", role: "GUEST" },
) {
  return { body, params, user } as unknown as Request;
}

function nextStub() {
  return sinon.stub() as unknown as NextFunction;
}

function flushController() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function responseBody(response: Response) {
  return (response.json as sinon.SinonStub).firstCall.args[0];
}

describe("booking controller", () => {
  afterEach(() => sinon.restore());

  it("creates a booking with the guest and date arguments", async () => {
    const booking = { id: "booking-1" };
    const service = sinon
      .stub(bookingServices, "createBookingService")
      .resolves(booking as never);
    const response = createResponse();

    createBooking(
      createRequest({
        unitId: "unit-1",
        checkIn: "2026-10-01",
        checkOut: "2026-10-03",
      }),
      response,
      nextStub(),
    );
    await flushController();

    expect(service.calledOnce).to.equal(true);
    expect(service.firstCall.args.slice(0, 2)).to.deep.equal([
      "guest-1",
      "unit-1",
    ]);
    expect(service.firstCall.args[2]).to.deep.equal(new Date("2026-10-01"));
    expect(service.firstCall.args[3]).to.deep.equal(new Date("2026-10-03"));
    expect((response.status as sinon.SinonStub).calledWith(201)).to.equal(true);
    expect(responseBody(response)).to.deep.equal({
      status: 201,
      message: "booking created successfully",
      data: booking,
    });
  });

  it("updates a booking", async () => {
    const booking = { id: "booking-1" };
    const service = sinon
      .stub(bookingServices, "updateBookingService")
      .resolves(booking as never);
    const response = createResponse();

    updateBooking(
      createRequest(
        { checkIn: "2026-10-04", checkOut: "2026-10-06" },
        { id: "booking-1" },
      ),
      response,
      nextStub(),
    );
    await flushController();

    expect(service.firstCall.args.slice(0, 2)).to.deep.equal([
      "booking-1",
      "guest-1",
    ]);
    expect(service.firstCall.args[2]).to.deep.equal([
      new Date("2026-10-04"),
      new Date("2026-10-06"),
    ]);
    expect((response.status as sinon.SinonStub).calledWith(200)).to.equal(true);
    expect(responseBody(response)).to.deep.equal({
      status: 200,
      message: "booking updated successfully",
      data: booking,
    });
  });

  for (const testCase of [
    [
      "cancels",
      cancelBooking,
      "cancelBookingService",
      "booking canceled successfully",
    ],
    [
      "confirms",
      confirmBooking,
      "confirmBookingService",
      "booking confirmed successfully",
    ],
    [
      "rejects",
      rejectBooking,
      "rejectBookingService",
      "booking rejected successfully",
    ],
  ] as const) {
    it(`${testCase[0]} a booking`, async () => {
      const booking = { id: "booking-1" };
      const service = sinon
        .stub(bookingServices, testCase[2])
        .resolves(booking as never);
      const response = createResponse();
      const user =
        testCase[2] === "cancelBookingService"
          ? { id: "guest-1", role: "GUEST" }
          : { id: "host-1", role: "HOST" };

      testCase[1](
        createRequest({}, { id: "booking-1" }, user),
        response,
        nextStub(),
      );
      await flushController();

      expect(service.calledWith("booking-1", user.id)).to.equal(true);
      expect((response.status as sinon.SinonStub).calledWith(200)).to.equal(
        true,
      );
      expect(responseBody(response)).to.deep.equal({
        status: 200,
        message: testCase[3],
        data: booking,
      });
    });
  }

  it("gets the guest bookings", async () => {
    const bookings = [{ id: "booking-1" }];
    const service = sinon
      .stub(bookingServices, "getGuestBookingsService")
      .resolves(bookings as never);
    const response = createResponse();

    getGuestBookings(createRequest(), response, nextStub());
    await flushController();

    expect(service.calledWith("guest-1")).to.equal(true);
    expect(responseBody(response)).to.deep.equal({
      status: 200,
      message: "guest bookings retrieved successfully",
      data: bookings,
    });
  });

  it("gets the host bookings", async () => {
    const bookings = [{ id: "booking-1" }];
    const service = sinon
      .stub(bookingServices, "getHostBookingsService")
      .resolves(bookings as never);
    const response = createResponse();

    getHostBookings(
      createRequest({}, {}, { id: "host-1", role: "HOST" }),
      response,
      nextStub(),
    );
    await flushController();

    expect(service.calledWith("host-1")).to.equal(true);
    expect(responseBody(response)).to.deep.equal({
      status: 200,
      message: "host bookings retrieved successfully",
      data: bookings,
    });
  });

  it("forwards a booking service error to next", async () => {
    const error = new Error("booking failed");
    const next = sinon.stub();
    sinon.stub(bookingServices, "cancelBookingService").rejects(error);

    cancelBooking(
      createRequest({}, { id: "booking-1" }),
      createResponse(),
      next,
    );
    await flushController();

    expect(next.calledOnceWithExactly(error)).to.equal(true);
  });

  it("forwards missing required create fields to next", async () => {
    const next = sinon.stub();

    createBooking(createRequest({ unitId: "unit-1" }), createResponse(), next);
    await flushController();

    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args[0]).to.have.property("statusCode", 400);
    expect(next.firstCall.args[0]).to.have.property(
      "message",
      "unitId, checkIn, and checkOut are required",
    );
  });
});
