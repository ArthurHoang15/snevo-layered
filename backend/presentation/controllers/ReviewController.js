// 📝 Review Controller - Presentation Layer
// Delegates all business logic to ReviewService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class ReviewController extends BaseController {
    constructor({ reviewService }) {
        super();
        this.reviewService = reviewService;
    }

    // POST /api/reviews
    async createReview(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const { shoe_id } = req.body || {};
            const review = await this.reviewService.createReview(user.id, shoe_id, req.body);
            this.sendResponse(res, review, 'Review created successfully', HTTP_STATUS.CREATED);
        });
    }

    // GET /api/products/:shoeId/reviews
    async listProductReviews(req, res) {
        return this.handleRequest(req, res, async () => {
            const { shoeId } = req.params;
            const pagination = this.getPaginationParams(req);
            const result = await this.reviewService.listProductReviews(shoeId, pagination);
            this.sendPaginatedResponse(res, result, pagination, 'Reviews fetched');
        });
    }

    // GET /api/products/:shoeId/reviews/stats
    async getProductReviewStats(req, res) {
        return this.handleRequest(req, res, async () => {
            const { shoeId } = req.params;
            const stats = await this.reviewService.getProductReviewStats(shoeId);
            this.sendResponse(res, stats, 'Review stats fetched');
        });
    }

    // GET /api/products/:shoeId/reviews/me
    async getMyReviewForProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const { shoeId } = req.params;
            const review = await this.reviewService.getUserReviewForProduct(user.id, shoeId);
            this.sendResponse(res, review, review ? 'Review found' : 'No review found');
        });
    }

    // GET /api/reviews/my-reviews
    async listMyReviews(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const pagination = this.getPaginationParams(req);
            // Use reviewService's method directly since it already supports user reviews
            const result = await this.reviewService.listProductReviews(null, { ...pagination, userId: user.id });
            this.sendPaginatedResponse(res, result, pagination, 'My reviews fetched');
        });
    }

    // PUT /api/reviews/:id
    async updateReview(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const review = await this.reviewService.updateReview(user.id, req.params.id, req.body);
            this.sendResponse(res, review, 'Review updated successfully');
        });
    }

    // DELETE /api/reviews/:id
    async deleteReview(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.reviewService.deleteReview(user.id, req.params.id);
            this.sendResponse(res, result, 'Review deleted successfully');
        });
    }
}
