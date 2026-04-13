const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {string} folder - Cloudinary folder name (default: 'appointments')
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (file, folder = 'appointments') => {
    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        
        try {
            fs.unlinkSync(file.path);
        } catch (err) {
            console.log('⚠️ Could not delete local file:', err.message);
        }

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            fileName: file.originalname,
            fileSize: result.bytes,
            format: result.format,
            uploadDate: new Date()
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of Multer file objects
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadMultipleToCloudinary = async (files, folder = 'appointments') => {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    return Promise.all(uploadPromises);
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { success: true, result };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get Cloudinary configuration status
 */
const isCloudinaryConfigured = () => {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
};

module.exports = {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    deleteFromCloudinary,
    isCloudinaryConfigured
};