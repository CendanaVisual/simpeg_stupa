import { v2 as cloudinary } from 'cloudinary';

// Inisialisasi Cloudinary SDK dengan kredensial SIPEG STUPA
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'kk5ip5eb',
  api_key: process.env.CLOUDINARY_API_KEY || '587154839764425',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'pPqZ18ud9drcW8jhywAh5aGyMug',
  secure: true,
});

export default cloudinary;

/**
 * Upload gambar selfie absensi atau dokumen pendukung dari Base64 string ke Cloudinary
 * @param base64Data Data URI string (e.g. data:image/jpeg;base64,...)
 * @param folder Nama sub-folder di Cloudinary (default: sipeg_stupa/absensi)
 * @returns Secure URL string dari file yang terupload
 */
export async function uploadToCloudinary(
  base64Data: string,
  folder: string = 'sipeg_stupa/absensi'
): Promise<string> {
  try {
    const uploadRes = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, crop: 'limit' }, // kompresi efisien hemat bandwidth
        { quality: 'auto:good' }
      ]
    });
    return uploadRes.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Gagal mengunggah foto ke Cloudinary: ' + (error as any).message);
  }
}
