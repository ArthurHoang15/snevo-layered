import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ProfileRepository extends BaseRepository {
  constructor() {
    super('profiles', 'user_id');
  }

  async findByUserId(userId) {
    return this.findById(userId);
  }

  async updateByUserId(userId, data) {
    return this.updateById(userId, data);
  }

  async createForUser(userId, profileData) {
    return this.create({ ...profileData, user_id: userId });
  }

  async deleteByUserId(userId) {
    return this.deleteById(userId);
  }
}
