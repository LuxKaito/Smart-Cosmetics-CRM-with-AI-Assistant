class ReviewRepository {
  listByProduct() {
    throw new Error('ReviewRepository.listByProduct must be implemented');
  }

  findByUserAndProduct() {
    throw new Error('ReviewRepository.findByUserAndProduct must be implemented');
  }

  create() {
    throw new Error('ReviewRepository.create must be implemented');
  }

  summaryByProduct() {
    throw new Error('ReviewRepository.summaryByProduct must be implemented');
  }
}

module.exports = ReviewRepository;
