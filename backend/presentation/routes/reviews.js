// 📝 Review Routes - /api/reviews/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function reviewRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const reviewPath = pathname.replace('/api/reviews', '');

    try {
        // Authenticate write operations
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        // POST /api/reviews
        if ((reviewPath === '/' || reviewPath === '') && req.method === 'POST') {
            return controller.createReview(req, res);
        }

        // GET /api/reviews/my-reviews
        if (reviewPath === '/my-reviews' && req.method === 'GET') {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
            return controller.listMyReviews(req, res);
        }

        // PUT /api/reviews/:id
        if (reviewPath.match(/^\/\d+$/) && req.method === 'PUT') {
            req.params = { id: reviewPath.substring(1) };
            return controller.updateReview(req, res);
        }

        // DELETE /api/reviews/:id
        if (reviewPath.match(/^\/\d+$/) && req.method === 'DELETE') {
            req.params = { id: reviewPath.substring(1) };
            return controller.deleteReview(req, res);
        }

        sendError(res, 'Review endpoint not found', 404);
    } catch (error) {
        console.error('Review route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}

/**
 * Product-level review routes (nested under /api/products/:shoeId/reviews)
 */
export async function productReviewRoutes(req, res, controller, shoeId, subPath, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    req.params = { shoeId };

    try {
        // GET /api/products/:shoeId/reviews/stats
        if (subPath === '/stats' && req.method === 'GET') {
            return controller.getProductReviewStats(req, res);
        }

        // GET /api/products/:shoeId/reviews/me
        if (subPath === '/me' && req.method === 'GET') {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
            return controller.getMyReviewForProduct(req, res);
        }

        // GET /api/products/:shoeId/reviews
        if ((subPath === '/' || subPath === '') && req.method === 'GET') {
            return controller.listProductReviews(req, res);
        }

        sendError(res, 'Product review endpoint not found', 404);
    } catch (error) {
        console.error('Product review route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
