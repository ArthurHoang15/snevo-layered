// 🏠 Address Controller - Presentation Layer
// Delegates all business logic to AddressService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class AddressController extends BaseController {
    constructor({ addressService }) {
        super();
        this.addressService = addressService;
    }

    // GET /api/auth/addresses
    async getAddresses(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const addresses = await this.addressService.listAddresses(user.id);
            this.sendResponse(res, addresses, 'Addresses fetched successfully');
        });
    }

    // GET /api/auth/addresses/:id
    async getAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const address = await this.addressService.getAddress(user.id, req.params.id);
            this.sendResponse(res, address, 'Address fetched successfully');
        });
    }

    // POST /api/auth/addresses
    async createAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const address = await this.addressService.createAddress(user.id, req.body);
            this.sendResponse(res, address, 'Address created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/auth/addresses/:id
    async updateAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const address = await this.addressService.updateAddress(user.id, req.params.id, req.body);
            this.sendResponse(res, address, 'Address updated successfully');
        });
    }

    // DELETE /api/auth/addresses/:id
    async deleteAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const result = await this.addressService.deleteAddress(user.id, req.params.id);
            this.sendResponse(res, result, 'Address deleted successfully');
        });
    }

    // PUT /api/auth/addresses/:id/default
    async setDefaultAddress(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireAuth(req);
            const address = await this.addressService.setDefaultAddress(user.id, req.params.id);
            this.sendResponse(res, address, 'Default address set successfully');
        });
    }
}
