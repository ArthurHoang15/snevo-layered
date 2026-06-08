// 🔐 Auth Routes - /api/auth/*

import authMiddleware from '../middleware/auth.js';
import { createAvatarUploadMiddleware } from '../middleware/upload.js';

export default async function authRoutes(req, res, controllers, pathname, sendError) {
    const authPath = pathname.replace('/api/auth', '');

    // Authenticate all auth routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // /api/auth/profile
        if (authPath === '/profile') {
            if (req.method === 'GET') {
                return controllers.profileController.getProfile(req, res);
            }
            if (req.method === 'PUT') {
                const contentType = req.headers['content-type'] || '';
                if (contentType.includes('multipart/form-data')) {
                    const avatarMiddleware = createAvatarUploadMiddleware(req.user.id);
                    try {
                        await new Promise((resolve, reject) => {
                            avatarMiddleware.handleUpload(req, res, async () => {
                                try {
                                    req.body = req.body || {};
                                    await controllers.profileController.updateProfile(req, res);
                                    resolve();
                                } catch (err) {
                                    reject(err);
                                }
                            });
                        });
                    } catch (error) {
                        console.error('Avatar upload error:', error);
                        if (!res.headersSent) sendError(res, error.message || 'Avatar upload failed', 400);
                    }
                } else {
                    return controllers.profileController.updateProfile(req, res);
                }
                return;
            }
            return sendError(res, 'Method not allowed', 405);
        }

        // /api/auth/addresses
        if (authPath === '/addresses' || authPath === '/addresses/') {
            if (req.method === 'GET') return controllers.addressController.getAddresses(req, res);
            if (req.method === 'POST') return controllers.addressController.createAddress(req, res);
            return sendError(res, 'Method not allowed', 405);
        }

        // /api/auth/addresses/:id
        if (authPath.match(/^\/addresses\/\d+$/)) {
            const id = authPath.replace('/addresses/', '');
            req.params = { id };

            if (req.method === 'GET') return controllers.addressController.getAddress(req, res);
            if (req.method === 'PUT') return controllers.addressController.updateAddress(req, res);
            if (req.method === 'DELETE') return controllers.addressController.deleteAddress(req, res);
            return sendError(res, 'Method not allowed', 405);
        }

        sendError(res, 'Auth endpoint not found', 404);
    } catch (error) {
        console.error('Auth route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
