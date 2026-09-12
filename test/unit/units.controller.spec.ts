import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { unitServices } from "../../src/modules/units/units.service";
import {
  activateUnit,
  createUnit,
  deactivateUnit,
  getUnitById,
  listMyUnits,
  listUnits,
  softDeleteUnit,
  updateUnit,
} from "../../src/modules/units/units.controller";

function response() {
  const status = sinon.stub();
  const result = { status, json: sinon.stub() } as unknown as Response;
  status.returns(result);
  return result;
}

function request(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user = { id: "host-1", role: "HOST" },
  query: Record<string, string> = {},
) {
  return { body, params, user, query } as unknown as Request;
}

function next() {
  return sinon.stub() as unknown as NextFunction;
}

function flush() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function body(result: Response) {
  return (result.json as sinon.SinonStub).firstCall.args[0];
}

describe("units controller", () => {
  afterEach(() => sinon.restore());

  it("creates a unit for the authenticated host", async () => {
    const unit = { id: "unit-1" };
    const service = sinon
      .stub(unitServices, "createUnitService")
      .resolves(unit as never);
    const result = response();
    const data = { title: "A home" };

    createUnit(request(data), result, next());
    await flush();

    expect(service.calledWith("host-1", data)).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 201,
      message: "unit created successfully",
      data: unit,
    });
  });

  it("updates a unit with its id and owner", async () => {
    const unit = { id: "unit-1" };
    const service = sinon
      .stub(unitServices, "updateUnitService")
      .resolves(unit as never);
    const result = response();
    const data = { title: "Updated home" };

    updateUnit(request(data, { id: "unit-1" }), result, next());
    await flush();

    expect(service.calledWith("unit-1", "host-1", data)).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 200,
      message: "unit updated successfully",
      data: unit,
    });
  });

  it("lists units with parsed query defaults", async () => {
    const units = [{ id: "unit-1" }];
    const service = sinon
      .stub(unitServices, "listUnitsService")
      .resolves(units as never);
    const result = response();

    listUnits(request({}, {}, undefined, { minPrice: "20" }), result, next());
    await flush();

    expect(service.calledWith({ minPrice: 20, page: 1, limit: 20 })).to.equal(
      true,
    );
    expect(body(result)).to.deep.equal({
      status: 200,
      message: "units listed successfully",
      data: units,
    });
  });

  it("fetches a unit by id", async () => {
    const unit = { id: "unit-1" };
    const service = sinon
      .stub(unitServices, "getUnitByIdService")
      .resolves(unit as never);
    const result = response();

    getUnitById(request({}, { id: "unit-1" }), result, next());
    await flush();

    expect(service.calledWith("unit-1")).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 200,
      message: "units fetched successfully",
      data: unit,
    });
  });

  it("lists the authenticated host's units", async () => {
    const units = [{ id: "unit-1" }];
    const service = sinon
      .stub(unitServices, "listMyUnitsService")
      .resolves(units as never);
    const result = response();

    listMyUnits(request(), result, next());
    await flush();

    expect(service.calledWith("host-1")).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 200,
      message: "units listed successfully",
      data: units,
    });
  });

  for (const testCase of [
    ["activates", activateUnit, "activateUnitService"],
    ["deactivates", deactivateUnit, "deactivateUnitService"],
    ["soft deletes", softDeleteUnit, "softDeleteUnitService"],
  ] as const) {
    it(`${testCase[0]} a unit for its owner`, async () => {
      const unit = { id: "unit-1" };
      const service = sinon
        .stub(unitServices, testCase[2])
        .resolves(unit as never);
      const result = response();

      testCase[1](request({}, { id: "unit-1" }), result, next());
      await flush();

      expect(service.calledWith("unit-1", "host-1")).to.equal(true);
      expect(body(result)).to.deep.equal({
        status: 200,
        message: "unit updated successfully",
        data: unit,
      });
    });
  }

  it("forwards invalid list query errors to next", async () => {
    const errorNext = sinon.stub();

    listUnits(
      request({}, {}, undefined, { limit: "0" }),
      response(),
      errorNext,
    );
    await flush();

    expect(errorNext.calledOnce).to.equal(true);
    expect(errorNext.firstCall.args[0]).to.have.property("statusCode", 400);
  });

  it("forwards service errors to next", async () => {
    const error = new Error("unit failed");
    const errorNext = sinon.stub();
    sinon.stub(unitServices, "getUnitByIdService").rejects(error);

    getUnitById(request({}, { id: "unit-1" }), response(), errorNext);
    await flush();

    expect(errorNext.calledOnceWithExactly(error)).to.equal(true);
  });
});
