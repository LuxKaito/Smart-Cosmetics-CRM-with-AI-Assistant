const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const fail = (res, message = 'Error', statusCode = 500, data = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data
  });
};

module.exports = { success, fail };
