// ⭐ Variant Controller - Presentation Layer
// Delegates all business logic to VariantService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class VariantController extends BaseController {
    constructor({ variantService }) {
        super();
        this.variantService = variantService;
    }

    // GET /api/variants
    async getVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            const { shoe_id } = req.query;
            if (shoe_id) {
                const variants = await this.variantService.listVariantsByProduct(shoe_id);
                return this.sendResponse(res, variants, 'Variants fetched successfully');
            }
            const variants = await this.variantService.listVariantsByProduct(1);
            this.sendResponse(res, variants, 'Variants fetched successfully');
        });
    }

    // GET /api/variants/:id
    async getVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            const variant = await this.variantService.getVariantById(req.params.id);
            this.sendResponse(res, variant, 'Variant fetched successfully');
        });
    }

    // GET /api/variants/shoe/:shoeId
    async getVariantsByShoe(req, res) {
        return this.handleRequest(req, res, async () => {
            const variants = await this.variantService.listVariantsByProduct(req.params.shoeId);
            this.sendResponse(res, variants || [], 'Variants fetched successfully');
        });
    }

    // GET /api/variants/shoe/:shoeId/color/:colorId
    async getVariantsByColor(req, res) {
        return this.handleRequest(req, res, async () => {
            const variants = await this.variantService.listVariantsByProduct(req.params.shoeId);
            const filtered = (variants || []).filter(v => v.color_id === parseInt(req.params.colorId));
            this.sendResponse(res, filtered, 'Variants fetched successfully');
        });
    }

    // GET /api/variants/find
    async findVariantByComposite(req, res) {
        return this.handleRequest(req, res, async () => {
            const { shoe_id, color_id, size_id } = req.query;
            // Use variant service - it internally calls repository
            const variants = await this.variantService.listVariantsByProduct(shoe_id);
            const variant = (variants || []).find(
                v => v.color_id === parseInt(color_id) && v.size_id === parseInt(size_id)
            );
            if (!variant) {
                return this.sendError(res, 'Variant not found', HTTP_STATUS.NOT_FOUND);
            }
            this.sendResponse(res, variant, 'Variant found successfully');
        });
    }

    // GET /api/variants/sku/:sku
    async getVariantBySku(req, res) {
        return this.handleRequest(req, res, async () => {
            const variant = await this.variantService.getVariantById(req.params.sku);
            this.sendResponse(res, variant, 'Variant fetched successfully');
        });
    }

    // GET /api/variants/low-stock
    async getLowStockVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { threshold = 10 } = req.query;
            const variants = await this.variantService.listLowStock(threshold);
            this.sendResponse(res, variants, 'Low stock variants fetched successfully');
        });
    }

    // POST /api/variants
    async createVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const variant = await this.variantService.createVariant(req.body);
            this.sendResponse(res, variant, 'Variant created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/variants/:id
    async updateVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const variant = await this.variantService.updateVariant(req.params.id, req.body);
            this.sendResponse(res, variant, 'Variant updated successfully');
        });
    }

    // DELETE /api/variants/:id
    async deleteVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            await this.variantService.softDeleteVariant(req.params.id);
            this.sendResponse(res, null, 'Variant deleted successfully');
        });
    }

    // PATCH /api/variants/:id/stock
    async updateStock(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { quantity, operation = 'set' } = req.body;
            const result = await this.variantService.adjustStock(req.params.id, { operation, quantity });
            this.sendResponse(res, result, 'Stock updated successfully');
        });
    }

    // POST /api/variants/bulk
    async bulkCreateVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { variants } = req.body;
            const results = [];
            for (const variant of variants) {
                const created = await this.variantService.createVariant(variant);
                results.push(created);
            }
            this.sendResponse(res, results, `${results.length} variants created successfully`, HTTP_STATUS.CREATED);
        });
    }

    // POST /api/variants/:id/check-stock
    async checkStock(req, res) {
        return this.handleRequest(req, res, async () => {
            const variant = await this.variantService.getVariantById(req.params.id);
            const { quantity } = req.body;
            const available = Number(variant.stock_quantity || 0) >= Number(quantity || 0);
            this.sendResponse(res, { available, stock_quantity: variant.stock_quantity }, 'Stock check completed');
        });
    }

    // POST /api/variants/generate-all/:shoeId
    async generateAllVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { defaultStock = 0 } = req.body;
            const result = await this.variantService.generateVariants(req.params.shoeId, { stock_quantity: defaultStock });
            this.sendResponse(res, result, 'Variants generated successfully', HTTP_STATUS.CREATED);
        });
    }

    // POST /api/variants/generate-specific/:shoeId
    async generateSpecificVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const { colorIds, sizeIds, defaultStock = 0, defaultPrice = null } = req.body;
            const result = await this.variantService.generateVariants(req.params.shoeId, {
                color_ids: colorIds,
                size_ids: sizeIds,
                stock_quantity: defaultStock,
                variant_price: defaultPrice
            });
            this.sendResponse(res, result, 'Specific variants generated successfully', HTTP_STATUS.CREATED);
        });
    }

    // DELETE /api/variants/:variantId (soft delete)
    async softDeleteVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const variant = await this.variantService.getVariantById(req.params.variantId);
            await this.variantService.softDeleteVariant(req.params.variantId);
            this.sendResponse(res, {
                variant_id: variant.variant_id,
                sku: variant.sku,
                stock_preserved: variant.stock_quantity,
                is_active: false
            }, variant.stock_quantity > 0
                ? `Variant deleted. Stock preserved: ${variant.stock_quantity} units`
                : 'Variant deleted successfully'
            );
        });
    }

    // POST /api/variants/:variantId/restore
    async restoreVariant(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const restoredVariant = await this.variantService.restoreVariant(req.params.variantId);
            this.sendResponse(res, restoredVariant, 'Variant restored successfully');
        });
    }

    // GET /api/variants/deleted/:shoeId
    async getDeletedVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            // Delegate to service - returns all variants including deleted
            const variants = await this.variantService.listVariantsByProduct(req.params.shoeId);
            const deleted = (variants || []).filter(v => v.is_active === false);
            this.sendResponse(res, deleted, 'Deleted variants fetched');
        });
    }

    // GET /api/variants/deleted-all
    async getAllDeletedVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const result = await this.variantService.getAllDeletedGroupedByShoe();
            this.sendResponse(res, result, 'All deleted variants fetched');
        });
    }
}
