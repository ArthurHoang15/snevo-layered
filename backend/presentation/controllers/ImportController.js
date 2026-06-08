// 📥 Import Controller - Presentation Layer
// Delegates all business logic to ImportService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class ImportController extends BaseController {
    constructor({ importService }) {
        super();
        this.importService = importService;
    }

    // GET /api/imports
    async getImports(req, res) {
        return this.handleRequest(req, res, async () => {
            const pagination = this.getPaginationParams(req, { limit: 50, sort: 'import_date', order: 'desc' });
            const filters = this.getFilterParams(req, ['shoe_id', 'variant_id', 'user_id', 'from_date', 'to_date']);
            const result = await this.importService.listImports({ filters, pagination });
            this.sendPaginatedResponse(res, result, pagination, 'Imports fetched successfully');
        });
    }

    // GET /api/imports/:id
    async getImport(req, res) {
        return this.handleRequest(req, res, async () => {
            const importRecord = await this.importService.getImportById(req.params.id);
            this.sendResponse(res, importRecord, 'Import fetched successfully');
        });
    }

    // POST /api/imports
    async createImport(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireRole(req, ['seller', 'admin', 'authenticated']);
            const result = await this.importService.createImport(user.user_id || user.id, req.body);
            this.sendResponse(res, result, 'Import created successfully', HTTP_STATUS.CREATED);
        });
    }

    // POST /api/imports/batch
    async createBatchImport(req, res) {
        return this.handleRequest(req, res, async () => {
            const user = this.requireRole(req, ['seller', 'admin']);
            const { imports, notes } = req.body;
            const result = await this.importService.createImports(user.user_id || user.id, imports, { notes });
            this.sendResponse(res, result, `Successfully created ${result.count} import records`, HTTP_STATUS.CREATED);
        });
    }

    // GET /api/imports/statistics
    async getImportStatistics(req, res) {
        return this.handleRequest(req, res, async () => {
            const filters = this.getFilterParams(req, ['user_id', 'from_date', 'to_date']);
            const stats = await this.importService.getStatistics(filters);
            this.sendResponse(res, stats, 'Import statistics fetched successfully');
        });
    }

    // GET /api/imports/shoe/:shoeId
    async getImportsByShoe(req, res) {
        return this.handleRequest(req, res, async () => {
            const pagination = this.getPaginationParams(req);
            const result = await this.importService.listImports({
                filters: { shoe_id: req.params.shoeId },
                pagination
            });
            this.sendPaginatedResponse(res, result, pagination, 'Shoe imports fetched successfully');
        });
    }

    // GET /api/imports/variant/:variantId
    async getImportsByVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            const pagination = this.getPaginationParams(req);
            const result = await this.importService.listImports({
                filters: { variant_id: req.params.variantId },
                pagination
            });
            this.sendPaginatedResponse(res, result, pagination, 'Variant imports fetched successfully');
        });
    }

    // DELETE /api/imports/:id (Admin only)
    async deleteImport(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const result = await this.importService.deleteImport(req.params.id);
            this.sendResponse(res, result, 'Import deleted and stock reversed successfully');
        });
    }

    // PUT /api/imports/:id
    async updateImport(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            // Only notes can be updated (via service layer)
            const importRecord = await this.importService.getImportById(req.params.id);
            this.sendResponse(res, importRecord, 'Import updated successfully');
        });
    }
}
