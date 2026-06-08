// 🌐 CORS Configuration Middleware - Presentation Layer
// Handles Cross-Origin Resource Sharing configuration (native http, no Express)

class CorsMiddleware {
    constructor() {
        this.allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    }

    /**
     * Configure CORS headers on response
     * For native http module (no res.status or next())
     */
    configure(req, res) {
        const origin = req.headers.origin;

        if (this.allowedOrigins.includes(origin) || this.allowedOrigins.includes('*')) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return true; // Signal that response was sent
        }

        return false; // Continue processing
    }
}

export default new CorsMiddleware();
