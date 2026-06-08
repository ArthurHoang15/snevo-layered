import { BusinessLogicError, ConflictError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { ORDER_STATUS, VALIDATION_RULES } from '../../infrastructure/utils/constants.js';

function requireDependency(value, name) {
  if (!value) throw new BusinessLogicError(`${name} repository is required`);
}

function toPositiveInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a positive integer` }]);
  }
  return parsed;
}

function cleanObject(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export default class ReviewService {
  constructor({ reviewRepository, shoeRepository } = {}) {
    this.reviewRepository = reviewRepository;
    this.shoeRepository = shoeRepository;
  }

  async listProductReviews(productId, pagination = {}) {
    requireDependency(this.reviewRepository, 'Review');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    return this.reviewRepository.findByShoeId(shoeId, pagination);
  }

  async getProductReviewStats(productId) {
    requireDependency(this.reviewRepository, 'Review');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    return this.reviewRepository.getReviewStats(shoeId);
  }

  async createReview(userId, productId, reviewData = {}) {
    requireDependency(this.reviewRepository, 'Review');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    if (this.shoeRepository) {
      const product = await this.shoeRepository.findById(shoeId);
      if (!product) throw new NotFoundError('Product');
    }
    const existingReview = await this.reviewRepository.findByUserAndShoe(userId, shoeId);
    if (existingReview) throw new ConflictError('You already reviewed this product');
    await this._ensureUserCanReview(userId, shoeId);

    const data = this._validateReviewPayload(reviewData, { requireRating: true });
    return this.reviewRepository.create({
      ...data,
      user_id: userId,
      shoe_id: shoeId,
      review_date: data.review_date ?? new Date().toISOString()
    });
  }

  async updateReview(userId, reviewId, reviewData = {}) {
    requireDependency(this.reviewRepository, 'Review');
    const id = toPositiveInteger(reviewId, 'review_id');
    const review = await this.reviewRepository.findById(id);
    if (!review || review.user_id !== userId) throw new NotFoundError('Review');
    const data = this._validateReviewPayload(reviewData, { requireRating: false });
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }
    return this.reviewRepository.updateById(id, data);
  }

  async deleteReview(userId, reviewId) {
    requireDependency(this.reviewRepository, 'Review');
    const id = toPositiveInteger(reviewId, 'review_id');
    const review = await this.reviewRepository.findById(id);
    if (!review || review.user_id !== userId) throw new NotFoundError('Review');
    await this.reviewRepository.deleteById(id);
    return { deleted: true };
  }

  async getUserReviewForProduct(userId, productId) {
    requireDependency(this.reviewRepository, 'Review');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    return this.reviewRepository.findUserReviewForProduct(userId, shoeId);
  }

  async _ensureUserCanReview(userId, shoeId) {
    const purchases = await this.reviewRepository.findPurchasedOrderItems(userId, shoeId, [ORDER_STATUS.DELIVERED]);
    if (purchases.length === 0) {
      throw new BusinessLogicError('Only delivered purchases can be reviewed');
    }
  }

  _validateReviewPayload(reviewData, { requireRating }) {
    const errors = [];
    const rating = reviewData.rating !== undefined ? Number.parseInt(reviewData.rating, 10) : undefined;

    if (requireRating && rating === undefined) {
      errors.push({ field: 'rating', message: 'rating is required' });
    }

    if (
      rating !== undefined &&
      (!Number.isInteger(rating) || rating < VALIDATION_RULES.RATING.MIN || rating > VALIDATION_RULES.RATING.MAX)
    ) {
      errors.push({ field: 'rating', message: 'rating must be between 1 and 5' });
    }

    if (errors.length > 0) throw new ValidationError('Validation failed', errors);

    return cleanObject({
      rating,
      comment: reviewData.comment ?? reviewData.review_text,
      review_date: reviewData.review_date
    });
  }
}
