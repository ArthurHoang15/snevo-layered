// 📏 Size Routes - /api/sizes/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function sizeRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const sizePath = pathname.replace('/api/sizes', '') || '/';
    const segments = sizePath.split('/').filter(Boolean);

    try {
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        if (segments.length === 1 && req.method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getSize(req, res);
        }
        if ((sizePath === '/' || sizePath === '') && req.method === 'GET') return controller.getSizes(req, res);
        if ((sizePath === '/' || sizePath === '') && req.method === 'POST') return controller.createSize(req, res);
        if (segments.length === 1 && req.method === 'PUT') { req.params = { id: segments[0] }; return controller.updateSize(req, res); }
        if (segments.length === 1 && req.method === 'DELETE') { req.params = { id: segments[0] }; return controller.deleteSize(req, res); }

        sendError(res, 'Size endpoint not found', 404);
    } catch (error) {
        console.error('Size route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
