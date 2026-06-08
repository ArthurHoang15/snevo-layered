import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { VALIDATION_RULES } from '../../infrastructure/utils/constants.js';

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

export default class AddressService {
  constructor({ addressRepository } = {}) {
    this.addressRepository = addressRepository;
  }

  async listAddresses(userId) {
    requireDependency(this.addressRepository, 'Address');
    return this.addressRepository.findByUserId(userId);
  }

  async getAddress(userId, addressId) {
    requireDependency(this.addressRepository, 'Address');
    const id = toPositiveInteger(addressId, 'address_id');
    const address = await this.addressRepository.findById(id);
    if (!address || address.user_id !== userId) throw new NotFoundError('Address');
    return address;
  }

  async createAddress(userId, addressData = {}) {
    requireDependency(this.addressRepository, 'Address');
    const currentAddresses = await this.addressRepository.findByUserId(userId);
    const data = this._validateAddressPayload(addressData, { requireCoreFields: true });
    const shouldSetDefault = data.is_default === true || currentAddresses.length === 0;

    if (shouldSetDefault) await this.addressRepository.clearDefaultForUser(userId);
    return this.addressRepository.createForUser(userId, {
      ...data,
      is_default: shouldSetDefault
    });
  }

  async updateAddress(userId, addressId, addressData = {}) {
    requireDependency(this.addressRepository, 'Address');
    const id = toPositiveInteger(addressId, 'address_id');
    await this.getAddress(userId, id);
    const data = this._validateAddressPayload(addressData, { requireCoreFields: false });
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }
    if (data.is_default === true) await this.addressRepository.clearDefaultForUser(userId);
    return this.addressRepository.updateForUser(userId, id, data);
  }

  async deleteAddress(userId, addressId) {
    requireDependency(this.addressRepository, 'Address');
    const id = toPositiveInteger(addressId, 'address_id');
    const address = await this.getAddress(userId, id);
    await this.addressRepository.deleteForUser(userId, id);

    if (address.is_default) {
      const remaining = await this.addressRepository.findByUserId(userId);
      if (remaining.length > 0) {
        await this.addressRepository.updateDefaultFlag(remaining[0].address_id, true);
      }
    }

    return { deleted: true };
  }

  async setDefaultAddress(userId, addressId) {
    requireDependency(this.addressRepository, 'Address');
    const id = toPositiveInteger(addressId, 'address_id');
    await this.getAddress(userId, id);
    await this.addressRepository.clearDefaultForUser(userId);
    return this.addressRepository.updateDefaultFlag(id, true);
  }

  _validateAddressPayload(addressData, { requireCoreFields }) {
    const recipientName = addressData.recipient_name ?? addressData.full_name;
    const addressLine = addressData.address_line ?? addressData.address ?? addressData.street;
    const phone = addressData.phone_number ?? addressData.phone;
    const errors = [];
    const coreFields = [
      ['recipient_name', recipientName],
      ['address_line', addressLine],
      ['city', addressData.city]
    ];

    for (const [field, value] of coreFields) {
      if (requireCoreFields && !value) {
        errors.push({ field, message: `${field} is required` });
      }
      if (value !== undefined && String(value).trim().length === 0) {
        errors.push({ field, message: `${field} cannot be empty` });
      }
    }

    if (phone !== undefined && phone !== null && String(phone).trim() && !VALIDATION_RULES.PHONE.test(String(phone))) {
      errors.push({ field: 'phone_number', message: 'phone_number is invalid' });
    }

    if (errors.length > 0) throw new ValidationError('Validation failed', errors);

    return cleanObject({
      recipient_name: recipientName,
      phone_number: phone,
      address_line: addressLine,
      street: addressData.street,
      ward: addressData.ward,
      district: addressData.district,
      city: addressData.city,
      state: addressData.state ?? addressData.province,
      province: addressData.province ?? addressData.state,
      postal_code: addressData.postal_code,
      country: addressData.country,
      is_default: addressData.is_default
    });
  }
}
