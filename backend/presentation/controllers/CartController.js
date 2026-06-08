// 🛒 Cart Controller - Presentation Layer
// Delegates all business logic to CartService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class CartController extends BaseController {
    constructor({ cartService }) {
        super();
        this.cartService = cartService;
    }

    // GET /api/cart
    async getCart(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const cart = await this.cartService.getCart(user.id);
            this.sendResponse(res, cart, 'Cart fetched successfully');
        });
    }

    // GET /api/cart/summary
    async getSummary(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const cart = await this.cartService.getCart(user.id);
            this.sendResponse(res, cart.summary, 'Cart summary fetched');
        });
    }

    // POST /api/cart
    async addToCart(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.cartService.addItem(user.id, req.body);
            this.sendResponse(res, result, 'Item added to cart', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/cart/:cartId
    async updateCartItem(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.cartService.updateItem(user.id, req.params.cartId, req.body);
            this.sendResponse(res, result, 'Cart item updated');
        });
    }

    // DELETE /api/cart/:cartId
    async removeCartItem(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.cartService.removeItem(user.id, req.params.cartId);
            this.sendResponse(res, result, 'Cart item removed');
        });
    }

    // DELETE /api/cart
    async clearCart(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.cartService.clearCart(user.id);
            this.sendResponse(res, result, 'Cart cleared');
        });
    }
}
