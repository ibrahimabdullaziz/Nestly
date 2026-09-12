export type AuthUserRecord = {
  id: string;
  email: string;
  password: string;
  role: string;
  [key: string]: unknown;
};

export type AuthPrisma = {
  user: {
    findFirst: (args: unknown) => Promise<AuthUserRecord | null>;
    update: (args: unknown) => Promise<AuthUserRecord | null>;
  };
};
