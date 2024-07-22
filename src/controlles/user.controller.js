import { asyncHAndler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt from "jsonwebtoken"
import { json } from "express";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
  try {
    const user =await User.findById(userId)
    const accessToken = generateAccessToken()
    const refreshToken = generateRefreshToken()

    // refreshtoken is save to the  databse

    user.refreshToken = refreshToken
    user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "something went wrong while generating refresh and access tokens")
  }
}

const registerUser = asyncHAndler( async(req,res) => {

const {fullname, username, email,password} = req.body
console.log("email", email)

if (
   [fullname, email, username, password].some((field) =>
    field?.trim() === "")
) {
  throw new ApiError(400, "all fields are required")
}

const existedUSer = await User.findOne({
  $or: [{username}, {email}]
})

if (existedUSer) {
  throw new ApiError(409, "User with email or username already exists")
}

const avatarPath =  req.files?.avatar[0]?.path;
const coverImagePath = req.files?.coverImage[0]?.path

if (!avatarPath) {
  throw new ApiError(400, "Avatar file is required")
}

const avatar =await uploadOnCloudinary(avatarPath)
const coverImage = await uploadOnCloudinary(coverImagePath)

if (!avatar) {
  throw new ApiError(401, "Failed to upload avatar file")
}

const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase()

})

const createdUser = await User.findById(user_id).select(
  "-password -refreshToken"
)

if (!createdUser) {
  throw new ApiError(500, "something went wrong")
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "user registered successfully")
)

})

const loginUser = asyncHAndler(async (req, res) => {
  // req body -> data
  // username and email
  // find th user
  // password check
  // generate access and refresh token
  // send cookies

    const {email, password,username} = req.body
    console.log(email)
    
    // username and email
    if (!username && !email) {
      throw new ApiError(400,"username or email is required")
    }

    // findone = first document is return in mongodb

   const user = await User.findOne({
      $or: [{username}, {email}]
    })

    if ((!user)) {
      throw new ApiError(404, "user not defined")
    }

    // password check
   const isPasswordValid = await user.isPasswordCorrect(password)

   if ((!isPasswordValid)) {
    throw new ApiError(401, "invalid credentials")
  }

  // access and refresh token
  const {accessToken,refreshToken} =await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user_id).select("-password -refreshToken")

  // cookies
  const options = {
    httpOnly: true, // bydefault modified in frontend server mo
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json (
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "user logged in successfully"
    )
  )

})

const logoutUser = asyncHAndler(async(req,res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    {
       // mongodb operator
       $set: {
        refreshToken: 1
       }
    },
    {
      new: true    // return response new updated value
    }
  )

  const options = {
    httpOnly: true, // bydefault modified in frontend server mo
    secure: true
  }
  
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
    new ApiResponse(
      200,
      {},
      "User logged Out"
    )
   )

})

const refreshAccessToken = asyncHAndler(async(req,res) => {
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

 
 if (!incomingRefreshToken) {
  throw new ApiError(401, "unauthorized request")
 }

try {
  const decodedToken =jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  
  const user = await User.findById(decodedToken?._id)
  
  if (!user) {
    throw new ApiError(401, "invalid refresh token")
  }
  
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "refresh token is expired")
  }
  
  const options = {
    httpOnly: true,
    secure: true
  }
  
  const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newrefreshToken, options)
  .json(
    new ApiResponse(
      200,
      {accessToken, refreshToken: newrefreshToken},
      "Access token refreshed"
    )
  )
} catch (error) {
  throw new ApiError(401, error?.message || "invalid refresh Token")
}

})

const changeCurrentPassword = asyncHAndler(async(req,res) => {
  const {oldPassword, newPAssword} = req.body

const user = await User.findById(req.user?._id)
const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

if (!isPasswordCorrect) {
  throw new ApiError(400, "invalid old password")
}

user.password = newPAssword
await user.save({ validateBeforeSave: false})

return res
.status(200
.json( new ApiResponse(200, {}, "password changed successfully"))
)

})

const getCurrentUser = asyncHAndler(async(req,res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetailes = asyncHAndler(async(req, res) => {
  const {fullname, email} = req.body

  if (!fullname || !email) {
    throw new ApiError(400, "all fields are required")
  }

  const user = await User.findByIdAndUpdate (
    req.user?._id,
    {
      // mongodb operator
      $set: {
        fullname: fullname,
        email: email
      }
    },
    {new: true}   // return update value
  ).select("-password")

  return res
  .status(200)
  .json(200, user, "account details updated successfully")
})

const updateUserAvatar = asyncHAndler(async(req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // mongodb operator
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "avatar image updated successfullly")
  )

})

const updateUserCoverImage = asyncHAndler(async(req,res) => {
  const coverLocalPath = req.file?.path

  if (!coverLocalPath) {
    throw new ApiError(400, "coverimage is missing")
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath)

  if (!coverImage) {
    throw new ApiError(400, "error while uploading on coverimage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // mongodb operator
      $set: {
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "cover image updated successfullly")
  )

})

const getUserChannelProfile = asyncHAndler(async(req,res) => {
  const {usernamere} = req.params

  if (!usernamere?.trim()) {
    throw new ApiError(400,"username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: usernamere?.toLowerCase
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0],"user channel fetched successfully")
  )

})

const getWatchHistory = asyncHAndler(async(req,res) => {
   const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
   ])

   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user[0].getWatchHistory,
      "watch history fetched successfully"
    )
   )

})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetailes, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }
