import { prismaClient } from "../prismaClient/Client.js"
import { AppError } from "../utils/AppError.js"


export const getProfile = async(req , res , next) => {
    try {

        console.time("DB");

  const result = await prismaClient.$queryRaw`SELECT 1`;

  console.timeEnd("DB");

  console.log(result);
        const { userId } = req.user
        if(!userId){
            throw new AppError(
                "Authorization Error",
                401,
                "UNAUTHORIZED"
            )
        }

        const user = await prismaClient.user.findUnique({
            where:{
                id : userId
            },
            select:{
                 id: true,
                name: true,
                email: true,
                role: true
            }
        })

        if(!user){
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            )
        }

        return res.status(200).json({
            success: true,
            message: "user data fetched successfully!",
            data: user
            
        })
    } catch (error) {
        next(error)
    }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;
    if (!userId) {
      throw new AppError(
        "Authorization Error",  
      401,
        "UNAUTHORIZED"
      );
    }

    if(!name || name.trim() === ""){
      throw new AppError(
        "Name is required",
        400,
        "BAD_REQUEST"
      )
    }
    const updatedUser = await prismaClient.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "user updated successfully!",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
