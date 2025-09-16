import CryptoJS from "crypto-js"
export function encryption({plaintext , secretkey}) {
  return CryptoJS.AES.encrypt(plaintext , secretkey).toString();
}