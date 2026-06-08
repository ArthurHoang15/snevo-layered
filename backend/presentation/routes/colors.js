// 🎨 Color Routes - /api/colors/*

import url from 'url';
import authMiddleware from '../middleware/auth.js';

export default async function colorRoutes(req, res, controller, pathname, sendError) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};
    const colorPath = pathname.replace('/api/colors', '') || '/';
    const segments = colorPath.split('/').filter(Boolean);

    try {
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            const authResult = await authMiddleware.authenticate(req, res);
            if (!authResult || !authResult.success) return;
            req.user = authResult.user;
        }

        if (segments.length === 1 && req.method === 'GET') {
            req.params = { id: segments[0] };
            return controller.getColor(req, res);
        }
        if ((colorPath === '/' || colorPath === '') && req.method === 'GET') return controller.getColors(req, res);
        if ((colorPath === '/' || colorPath === '') && req.method === 'POST') return controller.createColor(req, res);
        if (segments.length === 1 && req.method === 'PUT') { req.params = { id: segments[0] }; return controller.updateColor(req, res); }
        if (segments.length === 1 && req.method === 'DELETE') { req.params = { id: segments[0] }; return controller.deleteColor(req, res); }

        sendError(res, 'Color endpoint not found', 404);
    } catch (error) {
        console.error('Color route error:', error);
        sendError(res, 'Internal server error', 500);
    }
}
