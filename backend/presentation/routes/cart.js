// 🛒 Cart Routes - /api/cart/*

import authMiddleware from '../middleware/auth.js';

export default async function cartRoutes(req, res, controller, pathname, sendError) {
    const cartPath = pathname.replace('/api/cart', '');

    // Authenticate all cart routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // GET /api/cart
        if ((cartPath === '/' || cartPath === '') && req.method === 'GET') {
            return controller.getCart(req, res);
        }

        // GET /api/cart/summary
        if (cartPath === '/summary' && req.method === 'GET') {
            return controller.getSummary(req, res);
        }

        // POST /api/cart
        if ((cartPath === '/' || cartPath === '') && req.method === 'POST') {
            return controller.addToCart(req, res);
        }

        // DELETE /api/cart (clear)
        if ((cartPath === '/' || cartPath === '') && req.method === 'DELETE') {
            return controller.clearCart(req, res);
        }

        // PUT /api/cart/:cartId
        if (cartPath.match(/^\/\d+$/) && req.method === 'PUT') {
            req.params = { cartId: cartPath.substring(1) };
            return controller.updateCartItem(req, res);
        }

        // DELETE /api/cart/:cartId
        if (cartPath.match(/^\/\d+$/) && req.method === 'DELETE') {
            req.params = { cartId: cartPath.substring(1) };
            return controller.removeCartItem(req, res);
        }

        sendError(res, 'Cart endpoint not found', 404);
    } catch (error) {
        console.error('Cart route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
