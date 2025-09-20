import bcrypt from "bcrypt";
export async function hash({plaintext}) {
  return bcrypt.hash(plaintext , Number(process.env.SALT_ROUNDS));
}