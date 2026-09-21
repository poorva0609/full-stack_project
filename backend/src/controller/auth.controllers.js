import bcrypt from "bcrypt";
import crypto from "crypto";
import { registerSchema , loginSchema } from "../utils/ValidationSchema.js";
 import {prismaClient} from "../prismaClient/Client.js";
import {AppError} from "../utils/AppError.js";
import { GenerateAccessToken, GenerateRefreshToken, salt } from "../utils/AccessFns.js";



export const register = async (req, res, next) => {
  try {
    // 1. Validate request
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        "Invalid registration data",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { name, email, password , role } = result.data;

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Generate unique refresh-token ID
    const jti = crypto.randomUUID();

    // 4. Create user
    const user = await prismaClient.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        role: true,
        name:true,
        email:true
      },
    });
    const ATokenData = {
      id : user.id,
      role: user.role
    }
    const RTokenData = {
      id : user.id,
      role: user.role,
      jti: jti
    }
    // 5. Generate access token
    const accessToken = GenerateAccessToken(ATokenData);

    // 6. Generate refresh token
    const refreshToken = GenerateRefreshToken(RTokenData)

    if(!accessToken || !refreshToken){
      return new AppError(
        "Something Went Wrong (Tokens)",
        500,
        "INTERNAL_SERVER_ERR"
      )
    }
    // 7. Hash refresh token before storing
    const tokenHash = await bcrypt.hash(refreshToken, salt);
    // 8. Store refresh-token record
    await prismaClient.refreshToken.create({
      data: {
        userId: user.id,
        jti,
        tokenHash,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    // 9. Access token cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 16 * 60 * 1000,
      path: "/",
    });

    // 10. Refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,

      // ONLY sent to refresh endpoint
      path: "/api/v1/auth",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data : user
    });
  } catch (error) {
    console.error("Error in register controller:", error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        "Invalid login data",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { email, password } = result.data;

    const existingUser = await prismaClient.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        passwordHash: true,
      }
    });

    if (!existingUser) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const comparePassword = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );

    if (!comparePassword) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const accessToken = GenerateAccessToken({
      id: existingUser.id,
      role: existingUser.role,
    });
    const jti = crypto.randomUUID();

    const refreshToken = GenerateRefreshToken({
      id: existingUser.id,
      role: existingUser.role,
      jti,
    });

    const tokenHash = await bcrypt.hash(
      refreshToken,
      salt
    );

    await prismaClient.refreshToken.create({
      data: {
        userId: existingUser.id,
        jti,
        tokenHash,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 16 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth",
    });

    return res.status(201).json({
      success: true,
      message: "Login successful",
      data:{
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      }
    });

  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { password } = req.body;
    
    // 1. Check authentication
    if (!userId) {
      throw new AppError(
        "Authorization Error",
        401,
        "UNAUTHORIZED"
      );
    }

    // 2. Validate new password
    if (!password) {
      throw new AppError(
        "Password is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // 3. Find user
    const user = await prismaClient.user.findUnique({
      where: {
       id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new AppError(
        "Invalid token or credentials",
        401,
        "UNAUTHORIZED"
      );
    }

    // 4. Hash new password
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Update password + revoke all refresh sessions
    await prismaClient.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash,
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });

    // 6. Remove authentication cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const logout = async(req , res , next) => {
  try{
    const {userId , jti} = req.user

    if(!userId || !jti){
      throw new AppError(
        "Invalid Token or Credentials",
        403,
        "INVALID_TOKEN_CREDENTIALS"
      )
    }

    const user = await prismaClient.user.findUnique({
      where:{
        id : userId
      },
      select: {
        id: true,
      }
    })

    if(!user){
      throw new AppError(
        "User not Found",
        404,
        "USER_NOT_FOUND"
      )
    }

    await prismaClient.refreshToken.update({
      where:{
        jti
      },
      data:{
        revokedAt: new Date(),
      }
    })

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully"
    })
  }
  catch(error){
    next(error)
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { jti, userId, role } = req.user;

    if (!jti || !userId || !role) {
      throw new AppError(
        "Invalid refresh token data",
        401,
        "INVALID_REFRESH_TOKEN"
      );
    }

    const session = await prismaClient.refreshToken.findUnique({
      where: { jti },
      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true
      }
    });

    if (!session) {
      throw new AppError(
        "Refresh session not found",
        401,
        "INVALID_REFRESH_SESSION"
      );
    }

    if (session.revokedAt !== null) {
      throw new AppError(
        "Refresh session has been revoked",
        401,
        "REFRESH_TOKEN_REVOKED"
      );
    }

    if (session.expiresAt <= new Date()) {
      throw new AppError(
        "Refresh session expired",
        401,
        "REFRESH_SESSION_EXPIRED"
      );
    }

    if (session.userId !== userId) {
      throw new AppError(
        "Invalid refresh session",
        401,
        "INVALID_REFRESH_SESSION"
      );
    }
    const newAccessToken = GenerateAccessToken({
      id: session.userId,
      role
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 16 * 60 * 1000,
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully"
    });

  } catch (error) {
    next(error);
  }
};