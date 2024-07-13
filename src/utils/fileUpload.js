import { v2 as fileupload } from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath) => {
   try {
    if(!localfilepath) return null
    // upload file on cloudinary
    const response =await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto"
    })
    console.log("file uploaded on cloudinary", response.url)
    return response

   } catch (error) {
    fs.unlinkSync(localfilepath) // remove the locally saved file as the upload operation failed
    return null;
   }
}


export { uploadOnCloudinary}