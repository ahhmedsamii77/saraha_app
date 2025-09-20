import CryptoJS from "crypto-js"
export async function encryption({plaintext , secretkey}) {
  return CryptoJS.AES.encrypt(plaintext , secretkey).toString();
}