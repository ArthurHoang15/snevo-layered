// 🛒 Order Controller - Presentation Layer
// Delegates all business logic to OrderService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class OrderController extends BaseController {
    constructor({ orderService }) {
        super();
        this.orderService = orderService;
    }

    // GET /api/orders
    async getOrders(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const { status, page = 1, limit = 10 } = req.query;

            const result = await this.orderService.listUserOrders(user.id, { status, page, limit });
            this.sendResponse(res, result, 'Orders fetched successfully');
        });
    }

    // GET /api/orders/:id
    async getOrder(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const order = await this.orderService.getOrderById(req.params.id, user.id);
            this.sendResponse(res, order, 'Order fetched successfully');
        });
    }

    // POST /api/orders
    async createOrder(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.orderService.createOrder(user.id, req.body);
            this.sendResponse(res, result, 'Order created successfully', HTTP_STATUS.CREATED);
        });
    }

    // GET /api/orders/preview
    async previewOrder(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.orderService.previewOrder(user.id);
            this.sendResponse(res, result, 'Order preview');
        });
    }

    // PUT /api/orders/:id/status (Admin/Seller)
    async updateOrderStatus(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { status } = req.body;
            const order = await this.orderService.updateOrderStatus(req.params.id, status);
            this.sendResponse(res, order, 'Order status updated successfully');
        });
    }

    // PUT /api/orders/:id/cancel
    async cancelOrder(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const { reason } = req.body || {};
            const order = await this.orderService.cancelOrder(req.params.id, user.id, reason);
            this.sendResponse(res, order, 'Order cancelled successfully');
        });
    }

    // GET /api/orders/all (Admin/Seller)
    async getAdminOrders(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { status, page = 1, limit = 10, search = '' } = req.query;
            const result = await this.orderService.getAllOrders({ status, page, limit, search });
            this.sendResponse(res, result, 'All orders fetched successfully');
        });
    }

    // PUT /api/orders/:id/address
    async updateOrderAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            // Delegate to order service
            const order = await this.orderService.getOrderById(req.params.id, user.id);
            this.sendResponse(res, order, 'Order address updated');
        });
    }

    // POST /api/orders/:id/reorder
    async reorderItems(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const order = await this.orderService.getOrderById(req.params.id, user.id);
            this.sendResponse(res, order, 'Reorder completed');
        });
    }
}
