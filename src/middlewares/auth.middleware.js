import { ApiError } from "../utils/ApiError.js";
import { asyncHAndler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";




export const verifyJWT = asyncHAndler(async(res, _, next) => {
 try {
   const Token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
   if (!Token) {
     throw new ApiError(401, "Unauthorized request")
   }
 
   const decodedToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET)
 
   // databse request findById
   const user =await User.findById(decodedToken?._id).select("-password, -refreshToken")
 
   if (!user) {
     throw new ApiError(401, "Invalid Access Token")
   }
 
   req.user = user
   next()

 } catch (error) {
   throw new ApiError(401, error?.message || "Invalid access token")
 }

})