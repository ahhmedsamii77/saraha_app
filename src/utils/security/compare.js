import bcrypt from "bcrypt"
export async function compare({plaintext , ciphertext}) {
  return bcrypt.compare(plaintext , ciphertext);
}