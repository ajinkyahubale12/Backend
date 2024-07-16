import { asyncHAndler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHAndler( async(req,res) => {

const {fullname, username, email,password} = req.body
console.log("email", email)

if (
   [fullname, email, username, password].some((field) =>
    field?.trim() === "")
) {
  throw new ApiError(400, "all fields are required")
}

const existedUSer = User.findOne({
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
  throw new ApiError(400, "Avatar file is required")
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

export { registerUser }