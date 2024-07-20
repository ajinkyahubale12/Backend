import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto"
    });
    // console.log("file uploaded on cloudinary", response.url);
    fs.unlinkSync(localfilePath)
    return response;

  } catch (error) {
    fs.unlinkSync(localfilePath); // Remove the locally saved file as the upload operation failed
    return null;
  }
};

export { uploadOnCloudinary };
