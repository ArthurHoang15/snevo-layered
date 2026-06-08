import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { VALIDATION_RULES } from '../../infrastructure/utils/constants.js';

function requireDependency(value, name) {
  if (!value) throw new BusinessLogicError(`${name} repository is required`);
}

function cleanObject(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export default class ProfileService {
  constructor({ profileRepository } = {}) {
    this.profileRepository = profileRepository;
  }

  async getProfile(userId) {
    requireDependency(this.profileRepository, 'Profile');
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');
    return profile;
  }

  async createProfile(userId, profileData = {}) {
    requireDependency(this.profileRepository, 'Profile');
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) throw new BusinessLogicError('Profile already exists');
    const data = this._validateProfilePayload(profileData, { allowEmpty: false });
    return this.profileRepository.createForUser(userId, data);
  }

  async updateProfile(userId, profileData = {}) {
    requireDependency(this.profileRepository, 'Profile');
    const data = this._validateProfilePayload(profileData, { allowEmpty: false });
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) return this.profileRepository.createForUser(userId, data);
    return this.profileRepository.updateByUserId(userId, data);
  }

  async deleteProfile(userId) {
    requireDependency(this.profileRepository, 'Profile');
    await this.getProfile(userId);
    await this.profileRepository.deleteByUserId(userId);
    return { deleted: true };
  }

  _validateProfilePayload(profileData, { allowEmpty }) {
    const email = profileData.email;
    const phone = profileData.phone_number ?? profileData.phone;
    const errors = [];

    if (email !== undefined && !VALIDATION_RULES.EMAIL.test(String(email))) {
      errors.push({ field: 'email', message: 'email is invalid' });
    }

    if (phone !== undefined && phone !== null && String(phone).trim() && !VALIDATION_RULES.PHONE.test(String(phone))) {
      errors.push({ field: 'phone_number', message: 'phone_number is invalid' });
    }

    if (errors.length > 0) throw new ValidationError('Validation failed', errors);

    const data = cleanObject({
      username: profileData.username,
      full_name: profileData.full_name,
      email,
      phone_number: phone,
      avatar_url: profileData.avatar_url
    });

    if (!allowEmpty && Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }

    return data;
  }
}
