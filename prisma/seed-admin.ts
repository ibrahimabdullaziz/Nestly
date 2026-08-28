import bcrypt from "bcryptjs";
import PrismaClient from "../src/db/prisma";
import config from "../src/config/env";

const adminSeed = async () => {
  const prisma = PrismaClient;

  const user = await prisma.user.findUnique({
    where: { email: config.adminEmail },
  });
  if (user) {
    console.log(" the admin is already bootstrapped");
  } else {
    const admin = await prisma.user.create({
      data: {
        email: config.adminEmail,
        password: await bcrypt.hash(config.adminPassword, 10),
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      },
    });

    console.log({
      status: 200,
      message: "user created successfully!",
      data: admin,
    });
  }

  return prisma.$disconnect();
};

adminSeed();
