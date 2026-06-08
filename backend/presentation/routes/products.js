// 👟 Product Routes - /api/products/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

export default async function productRoutes(req, res, controller, pathname) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    req.query = parsedUrl.query || {};

    const path = pathname.replace('/api/products', '') || '/';
    const segments = path.split('/').filter(Boolean);

    try {
        // Authenticate write operations
        if (['POST', 'PUT', 'DELETE'].includes(method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        // GET /api/products/search
        if (path === '/search' && method === 'GET') {
            return controller.searchProducts(req, res);
        }

        // GET /api/products/featured
        if (path === '/featured' && method === 'GET') {
            return controller.getFeaturedProducts(req, res);
        }

        // GET /api/products/category/:categoryId
        if (path.startsWith('/category/') && method === 'GET') {
            req.params = { categoryId: segments[1] };
            return controller.getProductsByCategory(req, res);
        }

        // GET /api/products/:id/variants
        if (segments.length === 2 && segments[1] === 'variants' && method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getProductVariants(req, res);
        }

        // GET /api/products/:id/related
        if (segments.length === 2 && segments[1] === 'related' && method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getRelatedProducts(req, res);
        }

        // GET /api/products/:id
        if (segments.length === 1 && method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getProduct(req, res);
        }

        // GET /api/products
        if (path === '/' && method === 'GET') {
            return controller.getProducts(req, res);
        }

        // POST /api/products
        if (path === '/' && method === 'POST') {
            return uploadMiddleware.handleUpload(req, res, () => controller.createProduct(req, res));
        }

        // PUT /api/products/:id
        if (segments.length === 1 && method === 'PUT') {
            req.params = { id: parseInt(segments[0]) };
            return uploadMiddleware.handleUpload(req, res, () => controller.updateProduct(req, res));
        }

        // DELETE /api/products/:id
        if (segments.length === 1 && method === 'DELETE') {
            req.params = { id: segments[0] };
            return controller.deleteProduct(req, res);
        }

        // PUT /api/products/:id/restore
        if (segments.length === 2 && segments[1] === 'restore' && method === 'PUT') {
            req.params = { id: segments[0] };
            return controller.restoreProduct(req, res);
        }

        // Route not found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Product route not found', path: pathname, method }));

    } catch (error) {
        console.error('❌ Product route error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error', message: error.message }));
    }
}
