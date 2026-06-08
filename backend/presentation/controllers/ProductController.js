// 👟 Product Controller - Presentation Layer
// Delegates all business logic to ProductService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class ProductController extends BaseController {
    constructor({ productService }) {
        super();
        this.productService = productService;
    }

    // GET /api/products
    async getProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            const pagination = this.getPaginationParams(req);
            const filters = this.getFilterParams(req, [
                'category_id', 'min_price', 'max_price', 'brand', 'is_active', 'include_no_variants'
            ]);
            const { sort, order } = pagination;

            const result = await this.productService.listProducts({ filters, pagination, sortBy: sort, sortOrder: order });
            this.sendPaginatedResponse(res, result, pagination, 'Products fetched successfully');
        });
    }

    // GET /api/products/:id
    async getProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            const product = await this.productService.getProductById(req.params.id);
            this.sendResponse(res, product, 'Product fetched successfully');
        });
    }

    // GET /api/products/search
    async searchProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            const { q, search } = req.query;
            const searchTerm = q || search || '';
            const pagination = this.getPaginationParams(req);
            const filters = this.getFilterParams(req, ['category_id', 'min_price', 'max_price']);

            const result = await this.productService.searchProducts(searchTerm, { filters, pagination });
            this.sendPaginatedResponse(res, result, pagination, 'Search results');
        });
    }

    // GET /api/products/featured
    async getFeaturedProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            const { limit = 10 } = req.query;
            const products = await this.productService.getFeaturedProducts(limit);
            this.sendResponse(res, products, 'Featured products fetched');
        });
    }

    // GET /api/products/category/:categoryId
    async getProductsByCategory(req, res) {
        return this.handleRequest(req, res, async () => {
            const { categoryId } = req.params;
            const pagination = this.getPaginationParams(req);
            const filters = this.getFilterParams(req, ['min_price', 'max_price']);

            const result = await this.productService.getProductsByCategory(categoryId, { filters, pagination });
            this.sendPaginatedResponse(res, result, pagination, 'Category products fetched');
        });
    }

    // GET /api/products/:id/related
    async getRelatedProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            const { limit = 4 } = req.query;
            const products = await this.productService.getRelatedProducts(req.params.id, limit);
            this.sendResponse(res, products, 'Related products fetched');
        });
    }

    // GET /api/products/:id/variants
    async getProductVariants(req, res) {
        return this.handleRequest(req, res, async () => {
            const variants = await this.productService.getProductVariants(req.params.id);
            this.sendResponse(res, variants, 'Product variants fetched');
        });
    }

    // POST /api/products (Admin/Seller)
    async createProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const product = await this.productService.createProduct(req.body);
            this.sendResponse(res, product, 'Product created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/products/:id (Admin/Seller)
    async updateProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['seller', 'admin']);
            const product = await this.productService.updateProduct(req.params.id, req.body);
            this.sendResponse(res, product, 'Product updated successfully');
        });
    }

    // DELETE /api/products/:id (Admin)
    async deleteProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            await this.productService.deleteProduct(req.params.id);
            this.sendResponse(res, null, 'Product deleted successfully');
        });
    }

    // PUT /api/products/:id/restore
    async restoreProduct(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const product = await this.productService.restoreProduct(req.params.id);
            this.sendResponse(res, product, 'Product restored successfully');
        });
    }
}
