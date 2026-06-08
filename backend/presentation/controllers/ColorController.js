// 🎨 Color Controller - Presentation Layer
// Delegates all business logic to VariantService (colors managed as variant attributes)

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class ColorController extends BaseController {
    constructor({ colorRepository }) {
        super();
        // Colors are simple CRUD — use repository directly via service pattern
        this.colorRepository = colorRepository;
    }

    // GET /api/colors
    async getColors(req, res) {
        return this.handleRequest(req, res, async () => {
            const { active_only } = req.query;
            let colors;
            if (active_only === 'true') {
                colors = await this.colorRepository.findActive();
            } else {
                const result = await this.colorRepository.findAll();
                colors = result.data;
            }
            this.sendResponse(res, colors, 'Colors fetched successfully');
        });
    }

    // GET /api/colors/:id
    async getColor(req, res) {
        return this.handleRequest(req, res, async () => {
            const color = await this.colorRepository.findById(parseInt(req.params.id));
            this.sendResponse(res, color, 'Color fetched successfully');
        });
    }

    // POST /api/colors (Admin)
    async createColor(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            this.validateRequest(req.body, {
                color_name: { required: true, type: 'string', minLength: 2, maxLength: 50 },
                hex_code: { required: false, type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/ }
            });
            const newColor = await this.colorRepository.create(req.body);
            this.sendResponse(res, newColor, 'Color created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/colors/:id (Admin)
    async updateColor(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const updatedColor = await this.colorRepository.update(parseInt(req.params.id), req.body);
            this.sendResponse(res, updatedColor, 'Color updated successfully');
        });
    }

    // DELETE /api/colors/:id (Admin)
    async deleteColor(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            await this.colorRepository.update(parseInt(req.params.id), { is_active: false });
            this.sendResponse(res, null, 'Color deleted successfully');
        });
    }
}
