import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError(
        "Authentication required",
        401,
        "TOKEN_NOT_FOUND"
      );
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    req.user = decodedToken;

    next();

  } catch (error) {
    next(error);
  }
};

export const authenticateRefreshToken = (req, res, next) => {
  try {

    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError(
        "Refresh token not found",
        401,
        "REFRESH_TOKEN_NOT_FOUND"
      );
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    req.user = decodedToken;

    next();

  } catch (error) {
    next(error);
  }
};

