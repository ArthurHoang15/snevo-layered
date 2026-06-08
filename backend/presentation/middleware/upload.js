// 📤 File Upload Middleware - Presentation Layer
// Handles multipart/form-data parsing and Supabase Storage uploads

import { Readable } from 'stream';
import busboy from 'busboy';
import mimeTypes from 'mime-types';
import sharp from 'sharp';
import createSupabaseConfig from '../../infrastructure/database/supabase.js';
import { ValidationError } from '../../infrastructure/errors/ErrorClasses.js';

const supabaseConfig = createSupabaseConfig();

class UploadMiddleware {
    constructor(options = {}) {
        const defaultOptions = {
            maxFileSize: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/avif'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
            storageBucket: 'product-images',
            storagePath: 'products',
            imageQuality: 90,
            maxWidth: 2048,
            maxHeight: 2048
        };

        this.config = { ...defaultOptions, ...options };
    }

    /**
     * Buffer entire request stream
     */
    async bufferRequestStream(req) {
        return new Promise((resolve, reject) => {
            const chunks = [];

            req.on('data', chunk => {
                chunks.push(chunk);
            });

            req.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });

            req.on('error', error => {
                reject(error);
            });
        });
    }

    /**
     * Parse multipart/form-data from buffer
     */
    async parseMultipartData(buffer, headers) {
        return new Promise((resolve, reject) => {
            const bb = busboy({ headers });
            const files = [];
            const fields = {};

            bb.on('file', (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                const chunks = [];

                file.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                file.on('end', () => {
                    const fileBuffer = Buffer.concat(chunks);
                    files.push({
                        fieldname,
                        filename,
                        encoding,
                        mimeType,
                        buffer: fileBuffer,
                        size: fileBuffer.length
                    });
                });
            });

            bb.on('field', (fieldname, value) => {
                fields[fieldname] = value;
            });

            bb.on('finish', () => {
                const convertedFields = this.convertFieldTypes(fields);
                resolve({ files, fields: convertedFields });
            });

            bb.on('error', (err) => {
                console.error('❌ Busboy error:', err);
                reject(err);
            });

            const stream = Readable.from(buffer);
            stream.pipe(bb);
        });
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        if (file.size > this.config.maxFileSize) {
            throw new ValidationError(
                `File too large. Maximum size is ${this.config.maxFileSize / 1024 / 1024}MB`
            );
        }

        if (!this.config.allowedMimeTypes.includes(file.mimeType)) {
            throw new ValidationError(
                `Invalid file type. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`
            );
        }

        const ext = mimeTypes.extension(file.mimeType);
        if (!this.config.allowedExtensions.includes(`.${ext}`)) {
            throw new ValidationError(
                `Invalid file extension. Allowed: ${this.config.allowedExtensions.join(', ')}`
            );
        }

        return true;
    }

    /**
     * Optimize image with sharp
     */
    async optimizeImage(buffer) {
        try {
            return await sharp(buffer)
                .resize(this.config.maxWidth, this.config.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: this.config.imageQuality })
                .toBuffer();
        } catch (error) {
            throw new ValidationError('Failed to process image: ' + error.message);
        }
    }

    /**
     * Upload file to Supabase Storage
     */
    async uploadToSupabase(file) {
        try {
            this.validateFile(file);
            const filePath = this.generateStoragePath(file.filename);
            const optimizedBuffer = await this.optimizeImage(file.buffer);

            const { data, error } = await supabaseConfig.getAdminClient().storage
                .from(this.config.storageBucket)
                .upload(filePath, optimizedBuffer, {
                    contentType: file.mimeType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new Error(`Upload failed: ${error.message}`);
            }

            const { data: publicUrlData } = supabaseConfig.getAdminClient().storage
                .from(this.config.storageBucket)
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;

        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Delete file from Supabase Storage
     */
    async deleteFromSupabase(imageUrl) {
        try {
            const urlParts = imageUrl.split('/storage/v1/object/public/product-images/');
            if (urlParts.length < 2) {
                throw new Error('Invalid image URL format');
            }

            const filePath = urlParts[1];
            const { error } = await supabaseConfig.getAdminClient().storage
                .from(this.config.storageBucket)
                .remove([filePath]);

            if (error) {
                console.error('Supabase delete error:', error);
                throw new Error('Failed to delete file: ' + error.message);
            }

            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    }

    /**
     * Main middleware function for product routes
     */
    async handleUpload(req, res, next) {
        try {
            const contentType = req.headers['content-type'] || '';

            if (!contentType.includes('multipart/form-data')) {
                return await next();
            }

            const buffer = await this.bufferRequestStream(req);
            const { files, fields } = await this.parseMultipartData(buffer, req.headers);

            req.body = fields;

            if (files.length > 0) {
                const file = files[0];
                const imageUrl = await this.uploadToSupabase(file);
                req.body.image_url = imageUrl;
            }

            await next();

        } catch (error) {
            console.error('❌ Upload middleware error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message || 'Upload failed'
            }));
        }
    }

    /**
     * Convert string fields to proper types
     */
    convertFieldTypes(fields) {
        const converted = { ...fields };
        const integerFields = ['category_id', 'stock', 'quantity', 'variant_id'];
        const floatFields = ['base_price', 'price'];

        integerFields.forEach(field => {
            if (converted[field] !== undefined && converted[field] !== '') {
                converted[field] = parseInt(converted[field], 10);
            }
        });

        floatFields.forEach(field => {
            if (converted[field] !== undefined && converted[field] !== '') {
                converted[field] = parseFloat(converted[field]);
            }
        });

        return converted;
    }

    /**
     * Generate storage file path
     */
    generateStoragePath(filename) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = filename.split('.').pop();
        const fileName = `${timestamp}_${randomStr}.${ext}`;

        if (this.config.userId) {
            return `${this.config.storagePath}/${this.config.userId}/${fileName}`;
        }

        return `${this.config.storagePath}/${fileName}`;
    }
}

// Export default instance
const uploadMiddleware = new UploadMiddleware();
export default uploadMiddleware;

// Export factory functions for different upload types
export function createProductUploadMiddleware() {
    return new UploadMiddleware({
        storageBucket: 'product-images',
        storagePath: 'products',
        maxFileSize: 5 * 1024 * 1024
    });
}

export function createAvatarUploadMiddleware(userId) {
    return new UploadMiddleware({
        storageBucket: 'avatars',
        storagePath: 'avatars',
        userId: userId,
        maxFileSize: 5 * 1024 * 1024
    });
}
