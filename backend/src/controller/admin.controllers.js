import { prismaClient } from "../prismaClient/Client.js"
import { AppError } from "../utils/AppError.js"


export const getUsers = async(req , res , next) => {
    try{
       const {role} = req.user

       if(role != "ADMIN"){
          throw new AppError(
            "you are not allowed to access the data",
            403,
            "USER_UNAUTHORIZED"
           )
       }

       const users = await prismaClient.user.findMany({
        where:{
            role : "USER"
        },
        select:{
            id : true,
            name: true,
            email: true,
            role: true
        }
       }) 

       if(!users){
        throw new AppError(
            "no users found",
            404,
            "NO_USERS_FOUND"
        )
       }

       return res.status(200).json({
        success: true,
        message: "users fetched",
        data: users
       })
    }
    catch(error){
        next(error)
    }
}

export const deleteUser = async(req , res , next) => {
     try{
        const {role} = req.user

       if(role != "ADMIN"){
          throw new AppError(
            "you are not allowed to access the data",
            403,
            "USER_UNAUTHORIZED"
           )
        }
        const { id } = req.params
        const userId = Number(id);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new AppError(
                "Invalid user id",
                400,
                "INVALID_USER_ID"
            );
        }

        const deletedUser = await prismaClient.user.delete({
             where :{
                id:userId
                }
        })

        if(!deletedUser){
            throw new AppError(
                "user not deleted",
                404,
                "user_not_deleted"
            )
        }
        return res.status(200).json({
            success: true,
            message: "user deleted successfully"

        })
    }
    catch(error){
        next(error)
    }
}


export const getUser = async(req , res , next) => {
     try{
        
       const {role} = req.user

       if(role != "ADMIN"){
          throw new AppError(
            "you are not allowed to access the data",
            403,
            "USER_UNAUTHORIZED"
           )
        }

         const {id} = req.params
        const userId = Number(id);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new AppError(
                "Invalid user id",
                400,
                "INVALID_USER_ID"
            );
        }

        const user = await prismaClient.user.findUnique({
            where:{
                id : userId
            },
            select:{
                name: true,
                email: true,
                id: true,
                role: true
            }
        })

        if(!user){
            throw new AppError(
                "user not found",
                 404,
                "USER_NOT_FOUND"
            )
        }

        return res.status(200).json({
            success: true,
            message: "user fetched",
            data : user
        })
     }
    catch(error){
        next(error)
    }
}
