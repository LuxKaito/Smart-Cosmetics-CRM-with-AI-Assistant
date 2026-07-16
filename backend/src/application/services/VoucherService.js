const AppError = require('../../shared/errors/AppError');
const {
  formatVoucher,
  getVoucherValidityReason,
  normalizeVoucherCode,
  toPlainVoucher
} = require('../../shared/utils/voucher');

class VoucherService {
  constructor({ voucherRepository, userRepository }) {
    this.voucherRepository = voucherRepository;
    this.userRepository = userRepository;
  }

  async listPublic(query = {}) {
    const vouchers = await this.voucherRepository.listPublic(query);
    return {
      items: (vouchers || []).map((voucher) => formatVoucher(voucher))
    };
  }

  async saveForUser(userId, code) {
    const normalizedCode = normalizeVoucherCode(code);
    if (!normalizedCode) throw new AppError('Voucher code is required', 400, 'VOUCHER_CODE_REQUIRED');

    const voucher = await this.voucherRepository.findByCode(normalizedCode);
    const invalidReason = getVoucherValidityReason(voucher);
    if (invalidReason) throw new AppError(invalidReason, 400, 'VOUCHER_NOT_AVAILABLE');

    const user = await this.userRepository.addSavedVoucherCode(userId, normalizedCode);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    return {
      saved: true,
      voucher: formatVoucher(voucher)
    };
  }

  async listMine(userId) {
    const codes = await this.userRepository.getSavedVoucherCodes(userId);
    const vouchers = await this.voucherRepository.findByCodes(codes);
    const voucherByCode = new Map(
      (vouchers || []).map((voucher) => [normalizeVoucherCode(toPlainVoucher(voucher)?.code), voucher])
    );

    return {
      items: codes
        .map((code) => voucherByCode.get(normalizeVoucherCode(code)))
        .filter(Boolean)
        .map((voucher) => formatVoucher(voucher))
    };
  }
}

module.exports = VoucherService;
