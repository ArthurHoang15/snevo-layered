// 👑 Admin Routes - /api/admin/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function adminRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const adminPath = pathname.replace('/api/admin', '') || '/';
    const segments = adminPath.split('/').filter(Boolean);

    // Authenticate all admin routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // GET /api/admin/dashboard
        if (adminPath === '/dashboard' && req.method === 'GET') return controller.getDashboardMetrics(req, res);

        // GET /api/admin/dashboard/metrics
        if (adminPath === '/dashboard/metrics' && req.method === 'GET') return controller.getDashboardMetrics(req, res);

        // GET /api/admin/metrics
        if (adminPath === '/metrics' && req.method === 'GET') return controller.getDashboardMetrics(req, res);

        // GET /api/admin/statistics
        if (adminPath === '/statistics' && req.method === 'GET') return controller.getStatistics(req, res);

        // GET /api/admin/users
        if (adminPath === '/users' && req.method === 'GET') return controller.getUserManagement(req, res);

        // GET /api/admin/inventory
        if (adminPath === '/inventory' && req.method === 'GET') return controller.getInventoryManagement(req, res);

        // GET /api/admin/orders
        if (adminPath === '/orders' && req.method === 'GET') return controller.getOrderManagement(req, res);

        // GET /api/admin/orders/:id
        if (segments[0] === 'orders' && segments.length === 2 && req.method === 'GET') {
            req.params = { id: segments[1] };
            return controller.getAdminOrderDetail(req, res);
        }

        // PUT /api/admin/orders/:id/status
        if (segments[0] === 'orders' && segments.length === 3 && segments[2] === 'status' && req.method === 'PUT') {
            req.params = { id: segments[1] };
            return controller.updateAdminOrderStatus(req, res);
        }

        // PUT /api/admin/orders/:id/cancel
        if (segments[0] === 'orders' && segments.length === 3 && segments[2] === 'cancel' && req.method === 'PUT') {
            req.params = { id: segments[1] };
            // Simulate cancel by setting status to cancelled
            req.body = req.body || {};
            req.body.status = 'cancelled';
            return controller.updateAdminOrderStatus(req, res);
        }

        // GET /api/admin/top-selling
        if (adminPath === '/top-selling' && req.method === 'GET') return controller.getTopSellingProducts(req, res);

        sendError(res, 'Admin endpoint not found', 404);
    } catch (error) {
        console.error('Admin route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
