// 📂 Category Routes - /api/categories/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function categoryRoutes(req, res, controller, pathname) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    req.query = parsedUrl.query || {};

    const path = pathname.replace('/api/categories', '') || '/';
    const segments = path.split('/').filter(Boolean);

    try {
        // Authenticate write operations
        if (['POST', 'PUT', 'DELETE'].includes(method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        // GET /api/categories/popular
        if (path === '/popular' && method === 'GET') {
            req.query.include_products = 'true';
            return controller.getCategories(req, res);
        }

        // GET /api/categories/:id/products
        if (segments.length === 2 && segments[1] === 'products' && method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getCategoryWithProducts(req, res);
        }

        // GET /api/categories/:id
        if (segments.length === 1 && method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getCategory(req, res);
        }

        // GET /api/categories
        if (path === '/' && method === 'GET') {
            return controller.getCategories(req, res);
        }

        // POST /api/categories
        if (path === '/' && method === 'POST') {
            return controller.createCategory(req, res);
        }

        // PUT /api/categories/:id
        if (segments.length === 1 && method === 'PUT') {
            req.params = { id: segments[0] };
            return controller.updateCategory(req, res);
        }

        // DELETE /api/categories/:id
        if (segments.length === 1 && method === 'DELETE') {
            req.params = { id: segments[0] };
            return controller.deleteCategory(req, res);
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Category route not found' }));

    } catch (error) {
        console.error('❌ Category route error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error', message: error.message }));
    }
}
