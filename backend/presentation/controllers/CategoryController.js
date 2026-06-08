// 📂 Category Controller - Presentation Layer
// Delegates all business logic to CategoryService

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class CategoryController extends BaseController {
    constructor({ categoryService }) {
        super();
        this.categoryService = categoryService;
    }

    // GET /api/categories
    async getCategories(req, res) {
        return this.handleRequest(req, res, async () => {
            const { active_only = 'true', include_products } = req.query;
            const categories = await this.categoryService.listCategories({
                activeOnly: active_only === 'true',
                includeProductCount: include_products === 'true'
            });
            this.sendResponse(res, categories, 'Categories fetched successfully');
        });
    }

    // GET /api/categories/:id
    async getCategory(req, res) {
        return this.handleRequest(req, res, async () => {
            const category = await this.categoryService.getCategoryById(req.params.id);
            this.sendResponse(res, category, 'Category fetched successfully');
        });
    }

    // GET /api/categories/:id/products
    async getCategoryWithProducts(req, res) {
        return this.handleRequest(req, res, async () => {
            const category = await this.categoryService.getCategoryWithProducts(req.params.id);
            this.sendResponse(res, category, 'Category with products fetched');
        });
    }

    // POST /api/categories (Admin)
    async createCategory(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const category = await this.categoryService.createCategory(req.body);
            this.sendResponse(res, category, 'Category created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/categories/:id (Admin)
    async updateCategory(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const category = await this.categoryService.updateCategory(req.params.id, req.body);
            this.sendResponse(res, category, 'Category updated successfully');
        });
    }

    // DELETE /api/categories/:id (Admin)
    async deleteCategory(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            await this.categoryService.deleteCategory(req.params.id);
            this.sendResponse(res, null, 'Category deleted successfully');
        });
    }
}
