import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { unitPhotoServices } from "../../src/modules/unit-photos/unit-photos.service";
import {
  deleteUnitPhoto,
  uploadUnitPhoto,
} from "../../src/modules/unit-photos/unit-photos.controller";

type FakeFile = { buffer: Buffer };

function response() {
  const result = {
    status: sinon.stub(),
    json: sinon.stub(),
  } as unknown as Response;
  (result.status as sinon.SinonStub).returns(result);
  return result;
}

function request(
  params: Record<string, string> = {},
  user = { id: "host-1", role: "HOST" },
  file?: FakeFile,
) {
  return { params, user, file } as unknown as Request;
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

describe("unit photo controller", () => {
  afterEach(() => sinon.restore());

  it("uploads a photo for the authenticated host", async () => {
    const photo = { id: "photo-1", url: "https://example.com/photo.jpg" };
    const service = sinon
      .stub(unitPhotoServices, "uploadUnitPhotoService")
      .resolves(photo as never);
    const result = response();
    const file = { buffer: Buffer.from("photo") };

    uploadUnitPhoto(
      request({ unitId: "unit-1" }, undefined, file),
      result,
      next(),
    );
    await flush();

    expect(service.calledWith("unit-1", "host-1", file.buffer)).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 201,
      message: "photo uploaded successfully",
      data: photo,
    });
  });

  it("deletes a photo for the authenticated host", async () => {
    const service = sinon
      .stub(unitPhotoServices, "deleteUnitPhotoService")
      .resolves(undefined);
    const result = response();

    deleteUnitPhoto(request({ photoId: "photo-1" }), result, next());
    await flush();

    expect(service.calledWith("photo-1", "host-1")).to.equal(true);
    expect(body(result)).to.deep.equal({
      status: 200,
      message: "photo deleted successfully",
    });
  });

  it("forwards missing upload data to next", async () => {
    const errorNext = sinon.stub();

    uploadUnitPhoto(request(), response(), errorNext);
    await flush();

    expect(errorNext.calledOnce).to.equal(true);
    expect(errorNext.firstCall.args[0]).to.have.property("statusCode", 400);
  });

  it("forwards photo service errors to next", async () => {
    const error = new Error("photo failed");
    const errorNext = sinon.stub();
    sinon.stub(unitPhotoServices, "deleteUnitPhotoService").rejects(error);

    deleteUnitPhoto(request({ photoId: "photo-1" }), response(), errorNext);
    await flush();

    expect(errorNext.calledOnceWithExactly(error)).to.equal(true);
  });
});
