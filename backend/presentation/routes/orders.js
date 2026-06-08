// 🛒 Order Routes - /api/orders/*

import authMiddleware from '../middleware/auth.js';

export default async function orderRoutes(req, res, controller, pathname, sendError) {
    const orderPath = pathname.replace('/api/orders', '');

    // Authenticate all order routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // GET/POST /api/orders
        if (orderPath === '/' || orderPath === '') {
            if (req.method === 'GET') return controller.getOrders(req, res);
            if (req.method === 'POST') return controller.createOrder(req, res);
            return sendError(res, 'Method not allowed', 405);
        }

        // GET /api/orders/preview
        if (orderPath === '/preview' && req.method === 'GET') {
            return controller.previewOrder(req, res);
        }

        // GET /api/orders/all (Admin)
        if (orderPath === '/all' && req.method === 'GET') {
            return controller.getAdminOrders(req, res);
        }

        // GET /api/orders/:id
        if (orderPath.match(/^\/\d+$/) && req.method === 'GET') {
            req.params = { id: orderPath.substring(1) };
            return controller.getOrder(req, res);
        }

        // PUT /api/orders/:id/status
        if (orderPath.match(/^\/\d+\/status$/) && req.method === 'PUT') {
            req.params = { id: orderPath.replace('/status', '').replace('/', '') };
            return controller.updateOrderStatus(req, res);
        }

        // PUT /api/orders/:id/cancel
        if (orderPath.match(/^\/\d+\/cancel$/) && req.method === 'PUT') {
            req.params = { id: orderPath.replace('/cancel', '').replace('/', '') };
            return controller.cancelOrder(req, res);
        }

        // PUT /api/orders/:id/address
        if (orderPath.match(/^\/\d+\/address$/) && req.method === 'PUT') {
            req.params = { id: orderPath.replace('/address', '').replace('/', '') };
            return controller.updateOrderAddress(req, res);
        }

        // POST /api/orders/:id/reorder
        if (orderPath.match(/^\/\d+\/reorder$/) && req.method === 'POST') {
            req.params = { id: orderPath.replace('/reorder', '').replace('/', '') };
            return controller.reorderItems(req, res);
        }

        sendError(res, 'API endpoint not found', 404);
    } catch (error) {
        console.error('Order route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
