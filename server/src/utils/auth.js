import jwt from "jsonwebtoken";

export function createSession({ object }) {
  const token = jwt.sign(object, process.env.AUTH_SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
}
