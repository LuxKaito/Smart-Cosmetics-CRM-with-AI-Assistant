const AppError = require('../errors/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return next(
      new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        error.details.map((detail) => detail.message)
      )
    );
  }

  req[source] = value;
  next();
};

module.exports = validate;
