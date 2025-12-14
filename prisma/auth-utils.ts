import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Secure password hashing using bcrypt
export async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verify(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
