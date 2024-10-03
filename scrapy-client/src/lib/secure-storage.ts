import CryptoJS from "crypto-js";

const SECRET_KEY =
  import.meta.env.VITE_STORAGE_SECRET_KEY || "default-super-secret-key";

export const secureStorage = {
  setItem: (key: string, value: string) => {
    const encryptedValue = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(key, encryptedValue);
  },

  getItem: (key: string): string | null => {
    const encryptedValue = localStorage.getItem(key);
    if (encryptedValue) {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
      return decryptedBytes.toString(CryptoJS.enc.Utf8);
    }
    return null;
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};
