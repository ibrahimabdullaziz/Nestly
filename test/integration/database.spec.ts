import { expect } from "chai";
import { after, describe, it } from "mocha";
import prisma from "../../src/db/prisma";

describe("test database", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("connects through the real Prisma client", async () => {
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`
      SELECT 1 AS connected
    `;

    expect(result).to.deep.equal([{ connected: 1 }]);
  });
});
