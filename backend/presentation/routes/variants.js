// ⭐ Variant Routes - /api/variants/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function variantRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const variantPath = pathname.replace('/api/variants', '');
    const segments = variantPath.split('/').filter(Boolean);

    try {
        // Authenticate write operations
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        // GET /api/variants/find
        if (variantPath === '/find' && req.method === 'GET') {
            return controller.findVariantByComposite(req, res);
        }

        // GET /api/variants/low-stock
        if (variantPath === '/low-stock' && req.method === 'GET') {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
            return controller.getLowStockVariants(req, res);
        }

        // POST /api/variants/bulk
        if (variantPath === '/bulk' && req.method === 'POST') {
            return controller.bulkCreateVariants(req, res);
        }

        // POST /api/variants/generate-all/:shoeId
        if (segments[0] === 'generate-all' && segments.length === 2 && req.method === 'POST') {
            req.params = { shoeId: segments[1] };
            return controller.generateAllVariants(req, res);
        }

        // POST /api/variants/generate-specific/:shoeId
        if (segments[0] === 'generate-specific' && segments.length === 2 && req.method === 'POST') {
            req.params = { shoeId: segments[1] };
            return controller.generateSpecificVariants(req, res);
        }

        // GET /api/variants/shoe/:shoeId
        if (segments[0] === 'shoe' && segments.length === 2 && req.method === 'GET') {
            req.params = { shoeId: segments[1] };
            return controller.getVariantsByShoe(req, res);
        }

        // GET /api/variants/shoe/:shoeId/color/:colorId
        if (segments[0] === 'shoe' && segments[2] === 'color' && segments.length === 4 && req.method === 'GET') {
            req.params = { shoeId: segments[1], colorId: segments[3] };
            return controller.getVariantsByColor(req, res);
        }

        // GET /api/variants/deleted-all
        if (variantPath === '/deleted-all' && req.method === 'GET') {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
            return controller.getAllDeletedVariants(req, res);
        }

        // GET /api/variants/deleted/:shoeId
        if (segments[0] === 'deleted' && segments.length === 2 && req.method === 'GET') {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
            req.params = { shoeId: segments[1] };
            return controller.getDeletedVariants(req, res);
        }

        // GET /api/variants/sku/:sku
        if (segments[0] === 'sku' && segments.length === 2 && req.method === 'GET') {
            req.params = { sku: segments[1] };
            return controller.getVariantBySku(req, res);
        }

        // PATCH /api/variants/:id/stock
        if (segments.length === 2 && segments[1] === 'stock' && req.method === 'PATCH') {
            req.params = { id: segments[0] };
            return controller.updateStock(req, res);
        }

        // POST /api/variants/:id/check-stock
        if (segments.length === 2 && segments[1] === 'check-stock' && req.method === 'POST') {
            req.params = { id: segments[0] };
            return controller.checkStock(req, res);
        }

        // POST /api/variants/:variantId/restore
        if (segments.length === 2 && segments[1] === 'restore' && req.method === 'POST') {
            req.params = { variantId: segments[0] };
            return controller.restoreVariant(req, res);
        }

        // GET /api/variants/:id
        if (segments.length === 1 && req.method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getVariant(req, res);
        }

        // GET /api/variants
        if (variantPath === '/' || variantPath === '') {
            if (req.method === 'GET') return controller.getVariants(req, res);
            if (req.method === 'POST') return controller.createVariant(req, res);
        }

        // PUT /api/variants/:id
        if (segments.length === 1 && req.method === 'PUT') {
            req.params = { id: segments[0] };
            return controller.updateVariant(req, res);
        }

        // DELETE /api/variants/:variantId
        if (segments.length === 1 && req.method === 'DELETE') {
            req.params = { variantId: segments[0] };
            return controller.softDeleteVariant(req, res);
        }

        sendError(res, 'Variant endpoint not found', 404);
    } catch (error) {
        console.error('Variant route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
