// 👑 Admin Controller - Presentation Layer
// Delegates all business logic to AdminService

import BaseController from './BaseController.js';

export default class AdminController extends BaseController {
    constructor({ adminService }) {
        super();
        this.adminService = adminService;
    }

    // GET /api/admin/dashboard
    async getDashboardMetrics(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const metrics = await this.adminService.getDashboardSummary();
            this.sendResponse(res, metrics, 'Dashboard metrics fetched');
        });
    }

    // GET /api/admin/dashboard (legacy)
    async getDashboard(req, res) {
        return this.getDashboardMetrics(req, res);
    }

    // GET /api/admin/statistics
    async getStatistics(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            this.sendResponse(res, { message: 'Statistics coming soon' });
        });
    }

    // GET /api/admin/users
    async getUserManagement(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            this.sendResponse(res, { message: 'User management coming soon' });
        });
    }

    // GET /api/admin/inventory
    async getInventoryManagement(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const lowStock = await this.adminService.getLowStockVariants();
            this.sendResponse(res, { low_stock: lowStock }, 'Inventory info fetched');
        });
    }

    // GET /api/admin/orders
    async getOrderManagement(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const { status, page = 1, limit = 10, search = '' } = req.query;
            const orders = await this.adminService.listOrders({ status, page, limit, search });
            this.sendResponse(res, orders, 'Admin orders fetched');
        });
    }

    // GET /api/admin/orders/:id
    async getAdminOrderDetail(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const order = await this.adminService.getOrderDetail(req.params.id);
            this.sendResponse(res, order, 'Order detail fetched');
        });
    }

    // PUT /api/admin/orders/:id/status
    async updateAdminOrderStatus(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const { status } = req.body;
            const order = await this.adminService.updateOrderStatus(req.params.id, status);
            this.sendResponse(res, order, 'Order status updated');
        });
    }

    // GET /api/admin/top-selling
    async getTopSellingProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const { limit = 5 } = req.query;
            const products = await this.adminService.getTopSellingProducts(limit);
            this.sendResponse(res, products, 'Top selling products fetched');
        });
    }
}
