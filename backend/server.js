// 🚀 Server Entry Point - Layered Refactor
// Main server file that starts the application using DI container

import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({
  path: path.join(process.cwd(), '.env')
});

// Import Dependency Injection Container
import buildContainer from './container.js';

// Import modular routes.
import productRoutes from './presentation/routes/products.js';
import variantRoutes from './presentation/routes/variants.js';
import categoryRoutes from './presentation/routes/categories.js';
import colorRoutes from './presentation/routes/colors.js';
import sizeRoutes from './presentation/routes/sizes.js';
import importRoutes from './presentation/routes/imports.js';
import adminRoutes from './presentation/routes/admin.js';
import cartRoutes from './presentation/routes/cart.js';
import reviewRoutes from './presentation/routes/reviews.js';
import orderRoutes from './presentation/routes/orders.js';
import adminOrderRoutes from './presentation/routes/adminOrders.js';
import authRoutes from './presentation/routes/auth.js';
import userRoutes from './presentation/routes/users.js';
import profileRoutes from './presentation/routes/profiles.js';
import addressRoutes from './presentation/routes/addresses.js';
import paymentRoutes from './presentation/routes/payments.js';

// Import Middleware
import corsMiddleware from './presentation/middleware/cors.js';

class Server {
    constructor() {
        this.port = Number(process.env.PORT) || 3001;
        this.maxRetries = 5;

        // Build container & resolve controllers
        const container = buildContainer();
        this.controllers = container.controllers;
    }

    // Parse JSON body
    async parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (err) {
                    reject(err);
                }
            });
            req.on('error', reject);
        });
    }

    // Send JSON response
    sendJson(res, data, statusCode = 200) {
        res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(JSON.stringify(data));
    }

    // Send error response
    sendError(res, message, statusCode = 500) {
        this.sendJson(res, { success: false, message }, statusCode);
    }

    async handleApiRequest(req, res, pathname) {
        console.log('API Request:', req.method, pathname);
        
        try {
            // Apply CORS middleware
            const isCorsPreflight = corsMiddleware.configure(req, res);
            if (isCorsPreflight) return;

            // SKIP body parsing for upload routes
            const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
            const isUploadRoute = (
                (req.method === 'POST' && pathname === '/api/products') ||
                (req.method === 'PUT' && pathname.match(/^\/api\/products\/\d+$/)) ||
                (req.method === 'PUT' && pathname === '/api/auth/profile' && isMultipart)
            );

            // Parse body for POST/PUT/PATCH requests
            let body = {};
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (isUploadRoute || isMultipart) {
                    console.log('Skipping JSON body parse for upload/multipart request');
                } else {
                    body = await this.parseBody(req);
                    req.body = body;
                }
            }

            // Parse query parameters
            const parsedUrl = url.parse(req.url, true);
            req.query = parsedUrl.query || {};

            // Modular Routes dispatching
            if (pathname.startsWith('/api/reviews') || pathname.match(/^\/api\/products\/\d+\/reviews/)) {
                await reviewRoutes(req, res, this.controllers.review, pathname, this.sendError.bind(this));
                return;
            }
            
            if (pathname.startsWith('/api/products')) {
                return productRoutes(req, res, this.controllers.product, pathname);
            }
            
            if (pathname.startsWith('/api/variants')) {
                return variantRoutes(req, res, this.controllers.variant, pathname, this.sendError.bind(this));
            }
            
            if (pathname.startsWith('/api/categories')) {
                return categoryRoutes(req, res, this.controllers.category, pathname);
            }
            
            if (pathname.startsWith('/api/colors')) {
                return colorRoutes(req, res, this.controllers.color, pathname, this.sendError.bind(this));
            }
            
            if (pathname.startsWith('/api/sizes')) {
                return sizeRoutes(req, res, this.controllers.size, pathname, this.sendError.bind(this));
            }

            if (pathname.startsWith('/api/imports')) {
                return importRoutes(req, res, this.controllers.import, pathname, this.sendError.bind(this));
            }

            if (pathname.startsWith('/api/cart')) {
                await cartRoutes(req, res, this.controllers.cart, pathname, this.sendError.bind(this));
                return;
            }

            if (pathname.startsWith('/api/auth/')) {
                await authRoutes(req, res, {
                    profileController: this.controllers.profile,
                    addressController: this.controllers.address
                }, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/orders') && (pathname === '/api/orders' || pathname.startsWith('/api/orders/'))) {
                await orderRoutes(req, res, this.controllers.order, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/admin/orders') && (pathname === '/api/admin/orders' || pathname.startsWith('/api/admin/orders/'))) {
                await adminOrderRoutes(req, res, this.controllers.order, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/users') && (pathname === '/api/users' || pathname.startsWith('/api/users/'))) {
                await userRoutes(req, res, { 
                    profileController: this.controllers.profile, 
                    addressController: this.controllers.address 
                }, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/profiles') && (pathname === '/api/profiles' || pathname.startsWith('/api/profiles/'))) {
                await profileRoutes(req, res, this.controllers.profile, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/addresses') && (pathname === '/api/addresses' || pathname.startsWith('/api/addresses/'))) {
                await addressRoutes(req, res, this.controllers.address, pathname, this.sendError.bind(this));
            } else if (pathname.startsWith('/api/payments') && (pathname === '/api/payments' || pathname.startsWith('/api/payments/'))) {
                await paymentRoutes(req, res, this.controllers.payment, pathname, this.sendError.bind(this));
            } else if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
                await adminRoutes(req, res, this.controllers.admin, pathname, this.sendError.bind(this));
            } else {
                this.sendError(res, 'API endpoint not found', 404);
            }

        } catch (error) {
            console.error('API Error:', error);
            this.sendError(res, 'Internal server error', 500);
        }
    }

    // Start the server
    start(retryCount = 0) {
        const server = http.createServer(async (req, res) => {
            await this.handleRequest(req, res);
        });

        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE' && retryCount < this.maxRetries) {
                const nextPort = this.port + 1;
                console.warn(`⚠️  Port ${this.port} in use, retrying on ${nextPort}...`);
                this.port = nextPort;
                setTimeout(() => this.start(retryCount + 1), 250);
            } else {
                console.error('❌ Server failed to start:', err);
                process.exit(1);
            }
        });

        server.listen(this.port, () => {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }

    // Handle incoming requests (API + static files)
    async handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url || '/');
            const pathname = parsedUrl.pathname || '/';

            // Route API requests
            if (pathname.startsWith('/api/')) {
                await this.handleApiRequest(req, res, pathname);
                return;
            }

            // Base directories for static files
            const frontendRoot = path.join(process.cwd(), 'frontend');
            const pagesRoot = path.join(frontendRoot, 'pages');

            let filePath;
            if (pathname === '/' || pathname === '/index.html') {
                filePath = path.join(pagesRoot, 'index.html');
            } else if (pathname.startsWith('/assets/')) {
                filePath = path.join(frontendRoot, pathname);
            } else if (pathname.startsWith('/pages/')) {
                filePath = path.join(frontendRoot, pathname);
            } else if (pathname.endsWith('.html')) {
                filePath = path.join(pagesRoot, pathname.replace(/^\//, ''));
            } else {
                // Friendly URLs: /products -> pages/products.html
                const candidateHtml = path.join(pagesRoot, pathname.replace(/^\//, '')) + '.html';
                filePath = candidateHtml;
            }

            // Security check: prevent directory traversal
            const normalized = path.normalize(filePath);
            if (!normalized.startsWith(frontendRoot)) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden');
                return;
            }

            if (!fs.existsSync(normalized)) {
                // Fallback to index.html for client-side routing
                const fallback = path.join(pagesRoot, 'index.html');
                if (fs.existsSync(fallback)) {
                    const html = fs.readFileSync(fallback);
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(html);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
                return;
            }

            const contentType = mime.lookup(normalized) || 'application/octet-stream';
            const stream = fs.createReadStream(normalized);
            stream.on('open', () => {
                res.writeHead(200, { 'Content-Type': `${contentType}${String(contentType).startsWith('text/') || contentType === 'application/javascript' ? '; charset=utf-8' : ''}` });
            });
            stream.on('error', () => {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            });
            stream.pipe(res);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
    }
}

// Start the server
const server = new Server();
server.start();
