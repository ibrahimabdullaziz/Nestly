import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";

export const createUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  try {
    const { password } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
    return user;
  } catch (err) {
    throw new ApiError(
      500,
      "Sorry, Something gets wrong during creation process",
    );
  }
};

export const findByEmail = (email: string): Promise<User | null> => {
  const user = prisma.user.findFirst({ where: { email: email } });
  return user;
};

export const findById = (id: string): Promise<User | null> => {
  const user = prisma.user.findUnique({ where: { id: id } });
  return user;
};
