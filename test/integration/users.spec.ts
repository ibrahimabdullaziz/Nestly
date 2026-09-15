import bcrypt from "bcryptjs";
import { expect } from "chai";
import { after, describe, it } from "mocha";
import prisma from "../../src/db/prisma";
import { createUser, findByEmail } from "../../src/modules/users/users.service";

describe("users integration", function () {
  this.timeout(10000);

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates and persists a user with a hashed password", async () => {
    const email = `user-persistence-${Date.now()}@example.com`;
    const plainPassword = "password123";

    const createdUser = await createUser({
      email,
      password: plainPassword,
      firstName: "Integration",
      lastName: "User",
    });

    try {
      expect(createdUser.id).to.be.a("string").and.not.empty;
      expect(createdUser.email).to.equal(email);
      expect(createdUser.role).to.equal("GUEST");
      expect(createdUser.isVerified).to.equal(false);
      expect(createdUser.password).to.not.equal(plainPassword);
      expect(
        await bcrypt.compare(plainPassword, createdUser.password),
      ).to.equal(true);

      const persistedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(persistedUser).to.deep.equal(createdUser);
    } finally {
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it("rejects a duplicate email with Prisma P2002", async () => {
    const email = `user-duplicate-${Date.now()}@example.com`;
    const userData = {
      email,
      password: "hashed-password",
      firstName: "Duplicate",
      lastName: "User",
    };

    const createdUser = await prisma.user.create({ data: userData });

    try {
      try {
        await prisma.user.create({ data: userData });
        expect.fail("The duplicate email should be rejected");
      } catch (error) {
        expect(error).to.have.property("code", "P2002");
      }
    } finally {
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it("finds a user by email and persists an update", async () => {
    const email = `user-update-${Date.now()}@example.com`;
    const createdUser = await prisma.user.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Before",
        lastName: "Update",
      },
    });

    try {
      const foundUser = await findByEmail(email);

      expect(foundUser).to.deep.equal(createdUser);

      const updatedUser = await prisma.user.update({
        where: { id: createdUser.id },
        data: { firstName: "After", isVerified: true },
      });

      expect(updatedUser.firstName).to.equal("After");
      expect(updatedUser.isVerified).to.equal(true);

      const persistedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(persistedUser?.firstName).to.equal("After");
      expect(persistedUser?.isVerified).to.equal(true);
    } finally {
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });
});
