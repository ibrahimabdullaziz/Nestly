import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { reviewServices } from "../../src/modules/unit-reviews/unit-reviews.service";
import {
  createReview,
  getUnitReviews,
} from "../../src/modules/unit-reviews/unit-reviews.controller";
import { favoriteServices } from "../../src/modules/unit-favorites/unit-favorites.service";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "../../src/modules/unit-favorites/unit-favorites.controller";
import { countryServices } from "../../src/modules/countries/countries.service";
import {
  createCountry,
  getAllCountries,
} from "../../src/modules/countries/countries.controller";
import { cityServices } from "../../src/modules/cities/city.service";
import {
  createCity,
  getAllCities,
} from "../../src/modules/cities/city.controller";
import { currencyServices } from "../../src/modules/currencies/currency.service";
import {
  createCurrency,
  getAllCurrencies,
} from "../../src/modules/currencies/currency.controller";
import { categoryServices } from "../../src/modules/categories/category.service";
import {
  createCategory,
  getAllCategories,
} from "../../src/modules/categories/category.controller";

function response() {
  const result = {
    json: sinon.stub(),
    status: sinon.stub(),
  } as unknown as Response;
  (result.status as sinon.SinonStub).returns(result);
  return result;
}

function request(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user = { id: "guest-1", role: "GUEST" },
) {
  return { body, params, user } as unknown as Request;
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

describe("reviews, favorites, and catalog controllers", () => {
  afterEach(() => sinon.restore());

  it("creates and lists unit reviews", async () => {
    const review = { id: "review-1" };
    const create = sinon
      .stub(reviewServices, "createReviewService")
      .resolves(review as never);
    const createResult = response();
    createReview(
      request({ rating: 5, comment: "Great" }, { unitId: "unit-1" }),
      createResult,
      next(),
    );
    await flush();
    expect(create.calledWith("guest-1", "unit-1", 5, "Great")).to.equal(true);
    expect(body(createResult)).to.deep.equal({
      status: 200,
      message: "review created successfully",
      data: review,
    });

    const reviews = { reviews: [review], avgRating: { _avg: { rating: 5 } } };
    const get = sinon
      .stub(reviewServices, "getUnitReviewsService")
      .resolves(reviews as never);
    const getResult = response();
    getUnitReviews(request({}, { unitId: "unit-1" }), getResult, next());
    await flush();
    expect(get.calledWith("unit-1")).to.equal(true);
    expect(body(getResult)).to.deep.equal({
      status: 200,
      message: "reviews fetched successfully",
      data: reviews,
    });
  });

  it("adds, removes, and lists favorites", async () => {
    const favorite = { unitId: "unit-1" };
    const add = sinon
      .stub(favoriteServices, "addFavoriteService")
      .resolves(favorite as never);
    const addResult = response();
    addFavorite(request({}, { unitId: "unit-1" }), addResult, next());
    await flush();
    expect(add.calledWith("guest-1", "unit-1")).to.equal(true);
    expect(body(addResult)).to.deep.equal({
      status: 201,
      message: "favorite created successfully",
      data: favorite,
    });

    const remove = sinon
      .stub(favoriteServices, "removeFavoriteService")
      .resolves(favorite as never);
    const removeResult = response();
    removeFavorite(request({}, { unitId: "unit-1" }), removeResult, next());
    await flush();
    expect(remove.calledWith("guest-1", "unit-1")).to.equal(true);

    const list = sinon
      .stub(favoriteServices, "listFavoritesService")
      .resolves([favorite] as never);
    const listResult = response();
    listFavorites(request(), listResult, next());
    await flush();
    expect(list.calledWith("guest-1")).to.equal(true);
    expect(body(listResult).data).to.deep.equal([favorite]);
  });

  const catalogs = [
    [
      "countries",
      countryServices,
      getAllCountries,
      createCountry,
      "getAllCountriesService",
      "createCountryService",
    ],
    [
      "cities",
      cityServices,
      getAllCities,
      createCity,
      "getAllCitiesService",
      "createCityService",
    ],
    [
      "currencies",
      currencyServices,
      getAllCurrencies,
      createCurrency,
      "getAllCurrencyService",
      "createCurrencyService",
    ],
    [
      "categories",
      categoryServices,
      getAllCategories,
      createCategory,
      "getAllCategoriesService",
      "createCategoryService",
    ],
  ] as const;

  for (const [
    name,
    services,
    list,
    create,
    listMethod,
    createMethod,
  ] of catalogs) {
    it(`handles ${name} catalog responses and arguments`, async () => {
      const items = [{ id: `${name}-1` }];
      const serviceObject = services as unknown as Record<
        string,
        (...args: never[]) => Promise<unknown>
      >;
      const listService = sinon
        .stub(serviceObject, listMethod)
        .resolves(items as never);
      const listResult = response();
      list(request(), listResult, next());
      await flush();
      expect(listService.calledOnce).to.equal(true);
      expect(body(listResult).data).to.deep.equal(items);

      const createService = sinon
        .stub(serviceObject, createMethod)
        .resolves(items[0] as never);
      const createResult = response();
      const data = { name: `${name} item` };
      create(request(data), createResult, next());
      await flush();
      expect(createService.calledWith(data as never)).to.equal(true);
      expect(body(createResult).data).to.deep.equal(items[0]);
    });
  }

  it("forwards service errors consistently", async () => {
    const error = new Error("module failed");
    const errorNext = sinon.stub();
    sinon.stub(favoriteServices, "listFavoritesService").rejects(error);

    listFavorites(request(), response(), errorNext);
    await flush();

    expect(errorNext.calledOnceWithExactly(error)).to.equal(true);
  });
});
