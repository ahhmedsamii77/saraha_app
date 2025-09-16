import bcrypt from "bcrypt"
export function compare({plaintext , ciphertext}) {
  return bcrypt.compareSync(plaintext , ciphertext);
}