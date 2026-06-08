// 💳 Payment Controller - Presentation Layer
// Delegates all business logic to PaymentService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class PaymentController extends BaseController {
    constructor({ paymentService }) {
        super();
        this.paymentService = paymentService;
    }

    // GET /api/payments/:id
    async getPayment(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireAuth(req);
            const payment = await this.paymentService.getPaymentById(req.params.id);
            this.sendResponse(res, payment, 'Payment fetched successfully');
        });
    }

    // GET /api/payments/order/:orderId
    async getPaymentsByOrder(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireAuth(req);
            const result = await this.paymentService.listPaymentsByOrder(req.params.orderId);
            this.sendResponse(res, result, 'Payments fetched successfully');
        });
    }

    // POST /api/payments/order/:orderId
    async createPayment(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireAuth(req);
            const payment = await this.paymentService.createPayment(req.params.orderId, req.body);
            this.sendResponse(res, payment, 'Payment created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/payments/:id/status
    async updatePaymentStatus(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const { status } = req.body;
            const payment = await this.paymentService.updatePaymentStatus(req.params.id, status);
            this.sendResponse(res, payment, 'Payment status updated');
        });
    }

    // POST /api/payments/:id/confirm
    async confirmPayment(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireAuth(req);
            const payment = await this.paymentService.completePayment(req.params.id, req.body);
            this.sendResponse(res, payment, 'Payment confirmed');
        });
    }

    // POST /api/payments/:id/refund (Admin)
    async refundPayment(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const payment = await this.paymentService.refundPayment(req.params.id, req.body);
            this.sendResponse(res, payment, 'Payment refunded');
        });
    }

    // GET /api/payments/revenue
    async getRevenueSummary(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin', 'seller']);
            const summary = await this.paymentService.getRevenueSummary();
            this.sendResponse(res, summary, 'Revenue summary fetched');
        });
    }
}
