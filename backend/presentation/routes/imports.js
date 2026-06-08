// 📥 Import Routes - /api/imports/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function importRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const importPath = pathname.replace('/api/imports', '') || '/';
    const segments = importPath.split('/').filter(Boolean);

    // Authenticate all import routes
    const authResult = await authMiddleware.authenticate(req, res);
    if (!authResult || !authResult.success) return;
    req.user = authResult.user;

    try {
        // GET /api/imports/statistics
        if (importPath === '/statistics' && req.method === 'GET') return controller.getImportStatistics(req, res);

        // POST /api/imports/batch
        if (importPath === '/batch' && req.method === 'POST') return controller.createBatchImport(req, res);

        // GET /api/imports/shoe/:shoeId
        if (segments[0] === 'shoe' && segments.length === 2 && req.method === 'GET') {
            req.params = { shoeId: segments[1] };
            return controller.getImportsByShoe(req, res);
        }

        // GET /api/imports/variant/:variantId
        if (segments[0] === 'variant' && segments.length === 2 && req.method === 'GET') {
            req.params = { variantId: segments[1] };
            return controller.getImportsByVariant(req, res);
        }

        // GET /api/imports/:id
        if (segments.length === 1 && !isNaN(segments[0]) && req.method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getImport(req, res);
        }

        // GET /api/imports
        if ((importPath === '/' || importPath === '') && req.method === 'GET') return controller.getImports(req, res);

        // POST /api/imports
        if ((importPath === '/' || importPath === '') && req.method === 'POST') return controller.createImport(req, res);

        // PUT /api/imports/:id
        if (segments.length === 1 && req.method === 'PUT') {
            req.params = { id: segments[0] };
            return controller.updateImport(req, res);
        }

        // DELETE /api/imports/:id
        if (segments.length === 1 && req.method === 'DELETE') {
            req.params = { id: segments[0] };
            return controller.deleteImport(req, res);
        }

        sendError(res, 'Import endpoint not found', 404);
    } catch (error) {
        console.error('Import route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
