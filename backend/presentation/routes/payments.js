// 💳 Payment Routes - /api/payments/*

import authMiddleware from '../middleware/auth.js';

export default async function paymentRoutes(req, res, controller, pathname, sendError) {
    const paymentPath = pathname.replace('/api/payments', '');

    // Authenticate all payment routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // GET /api/payments/revenue
        if (paymentPath === '/revenue' && req.method === 'GET') {
            return controller.getRevenueSummary(req, res);
        }

        // GET /api/payments/order/:orderId
        if (paymentPath.match(/^\/order\/\d+$/) && req.method === 'GET') {
            req.params = { orderId: paymentPath.replace('/order/', '') };
            return controller.getPaymentsByOrder(req, res);
        }

        // POST /api/payments/order/:orderId
        if (paymentPath.match(/^\/order\/\d+$/) && req.method === 'POST') {
            req.params = { orderId: paymentPath.replace('/order/', '') };
            return controller.createPayment(req, res);
        }

        // GET /api/payments/:id
        if (paymentPath.match(/^\/\d+$/) && req.method === 'GET') {
            req.params = { id: paymentPath.substring(1) };
            return controller.getPayment(req, res);
        }

        // PUT /api/payments/:id/status
        if (paymentPath.match(/^\/\d+\/status$/) && req.method === 'PUT') {
            req.params = { id: paymentPath.replace('/status', '').replace('/', '') };
            return controller.updatePaymentStatus(req, res);
        }

        // POST /api/payments/:id/confirm
        if (paymentPath.match(/^\/\d+\/confirm$/) && req.method === 'POST') {
            req.params = { id: paymentPath.replace('/confirm', '').replace('/', '') };
            return controller.confirmPayment(req, res);
        }

        // POST /api/payments/:id/refund
        if (paymentPath.match(/^\/\d+\/refund$/) && req.method === 'POST') {
            req.params = { id: paymentPath.replace('/refund', '').replace('/', '') };
            return controller.refundPayment(req, res);
        }

        sendError(res, 'Payment endpoint not found', 404);
    } catch (error) {
        console.error('Payment route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
