// 👨‍💼 Profile Controller - Presentation Layer
// Delegates all business logic to ProfileService

import BaseController from './BaseController.js';

export default class ProfileController extends BaseController {
    constructor({ profileService }) {
        super();
        this.profileService = profileService;
    }

    // GET /api/auth/profile
    async getProfile(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const profile = await this.profileService.getProfile(user.id);
            this.sendResponse(res, profile, 'Profile fetched successfully');
        });
    }

    // PUT /api/auth/profile
    async updateProfile(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const updates = req.body || {};

            // Handle multipart avatar upload - map image_url to avatar_url
            if (updates.image_url) {
                updates.avatar_url = updates.image_url;
                delete updates.image_url;
                console.log('📤 Avatar uploaded from multipart, URL:', updates.avatar_url);
            }

            const profile = await this.profileService.updateProfile(user.id, updates);
            this.sendResponse(res, profile, 'Profile updated successfully');
        });
    }

    // DELETE /api/auth/profile
    async deleteProfile(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            await this.profileService.deleteProfile(user.id);
            this.sendResponse(res, null, 'Profile deleted successfully');
        });
    }
}
