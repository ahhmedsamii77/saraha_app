import CryptoJS from "crypto-js"
export function decryption({ciphertext , secretkey}) {
  return CryptoJS.AES.decrypt(ciphertext, secretkey).toString(CryptoJS.enc.Utf8);
}