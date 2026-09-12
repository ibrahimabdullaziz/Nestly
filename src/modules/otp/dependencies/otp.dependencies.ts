import prisma from "../../../db/prisma";

export const otpServiceDependencies: any = {
  prisma: {
    otp: {
      upsert: (args: any) => prisma.otp.upsert(args),
      findFirst: (args: any) => prisma.otp.findFirst(args),
      update: (args: any) => prisma.otp.update(args),
    },
  },
  now: () => new Date(),
  random: () => Math.random(),
};
