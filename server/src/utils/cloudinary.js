import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImageToCloudinary = async (file, quality = "auto") => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file input. Ensure 'file.buffer' is provided.");
  }

  const transformation = [
    { width: 1920, height: 1080, crop: "limit" },
    { quality: quality },
    { fetch_format: "auto" },
  ];

  const options = {
    resource_type: "auto",
    quality,
    transformation,
    data: file.buffer,
  };

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) {
          console.error("Failed to upload file to Cloudinary", error);
          return reject(error);
        }
        resolve(result);
      })
      .end(file.buffer);
  });
};

export const deleteFileFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes("/upload/")) {
      throw new Error("Invalid Cloudinary URL format");
    }

    const url = fileUrl.split("/");
    const publicId = url.pop().split(".")[0];

    const result = await cloudinary.uploader.destroy(publicId);

    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error.message);
    throw error;
  }
};

export const uploadKmlToCloudinary = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file input. Ensure 'file.buffer' is provided.");
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw", 
          folder: "projects",   
        },
        (error, result) => {
          if (error) {
            console.error("Failed to upload KML/KMZ file to Cloudinary", error);
            return reject(error);
          }
          resolve(result);
        }
      )
      .end(file.buffer);
  });
};


export const deleteKMLFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes("/upload/")) {
      throw new Error("Invalid Cloudinary URL format");
    }

    // Get the part after 'upload/'
    let afterUpload = fileUrl.split('/upload/')[1];

    // Remove the version part if exists
    const parts = afterUpload.split('/');
    if (parts[0].startsWith('v')) {
      parts.shift(); // remove 'v1745691552'
    }

    const publicId = parts.join('/'); // projects/vdunpubfhicrfq1idt62

    // Destroy file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error.message);
    throw error;
  }
};



