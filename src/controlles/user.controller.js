import { asyncHAndler } from "../utils/asyncHandler.js";

const registerUser = asyncHAndler( async(req,res) => {
  res.status(200).json({
    message: "Ajinkya Hubale"
  })
})

export { registerUser }