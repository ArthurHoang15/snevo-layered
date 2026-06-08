// 📏 Size Controller - Presentation Layer
// Handles size CRUD for shoe variants

import BaseController from './BaseController.js';
import { HTTP_STATUS } from '../../infrastructure/utils/constants.js';

export default class SizeController extends BaseController {
    constructor({ sizeRepository }) {
        super();
        this.sizeRepository = sizeRepository;
    }

    // GET /api/sizes
    async getSizes(req, res) {
        return this.handleRequest(req, res, async () => {
            const { active_only, size_type } = req.query;
            let sizes;
            if (size_type) {
                sizes = await this.sizeRepository.findByType(size_type);
            } else if (active_only === 'true') {
                sizes = await this.sizeRepository.findActive();
            } else {
                const result = await this.sizeRepository.findAll();
                sizes = result.data;
            }
            this.sendResponse(res, sizes, 'Sizes fetched successfully');
        });
    }

    // GET /api/sizes/:id
    async getSize(req, res) {
        return this.handleRequest(req, res, async () => {
            const size = await this.sizeRepository.findById(parseInt(req.params.id));
            this.sendResponse(res, size, 'Size fetched successfully');
        });
    }

    // POST /api/sizes (Admin)
    async createSize(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            this.validateRequest(req.body, {
                size_value: { required: true, type: 'string', maxLength: 10 },
                size_type: { required: false, type: 'string', maxLength: 20 }
            });
            const newSize = await this.sizeRepository.create(req.body);
            this.sendResponse(res, newSize, 'Size created successfully', HTTP_STATUS.CREATED);
        });
    }

    // PUT /api/sizes/:id (Admin)
    async updateSize(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            const updatedSize = await this.sizeRepository.update(parseInt(req.params.id), req.body);
            this.sendResponse(res, updatedSize, 'Size updated successfully');
        });
    }

    // DELETE /api/sizes/:id (Admin)
    async deleteSize(req, res) {
        return this.handleRequest(req, res, async () => {
            this.requireRole(req, ['admin']);
            await this.sizeRepository.update(parseInt(req.params.id), { is_active: false });
            this.sendResponse(res, null, 'Size deleted successfully');
        });
    }
}
