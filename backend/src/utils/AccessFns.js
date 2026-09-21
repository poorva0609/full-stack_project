import  jwt  from "jsonwebtoken";
import { AccessTokenSchema, RefreshTokenSchema } from "./ValidationSchema.js";

export const salt = 10;

export const GenerateAccessToken = (data) => {
  const result = AccessTokenSchema.safeParse(data);

  if (!result.success) {
    return false;
  }

  return jwt.sign(
    {
      userId: result.data.id,
      role: result.data.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
};
export const GenerateRefreshToken = (data) => {
  const result = RefreshTokenSchema.safeParse(data);

  if (!result.success) {
    return false;
  }

  return jwt.sign(
    {
      userId: result.data.id,
      role: result.data.role,
      jti: result.data.jti,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};
