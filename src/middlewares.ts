import fs from "fs";
import jwt from "jsonwebtoken";
const jwtsecret = "jwtsecret";

export const authorize = (token: string) => {
  const appRoot = process.cwd();
  const publicKey = fs.readFileSync(appRoot + "\\public.pem");
  try {
    if (token) {
      return jwt.verify(token, publicKey);
    }
    return null;
  } catch (err) {
    return null;
  }
};
