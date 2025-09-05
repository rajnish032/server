import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.ImageKIT_PUB_KEY,
  privateKey: process.env.ImageKIT_PRIVATE_KEY,
  urlEndpoint: process.env.ImageKIT_END_POINT,
});

export const uploadImage = async (file, fileName) => {
  return await imagekit.upload({
    file,
    fileName,
  });
};

export const deleteImage = async (fileId) => {
  return await imagekit.deleteFile(fileId);
};
