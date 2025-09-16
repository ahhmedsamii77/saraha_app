import bcrypt from "bcrypt";
export function hash({plaintext}) {
  return bcrypt.hashSync(plaintext , Number(process.env.SALT_ROUNDS));
}