function sendSuccess(res, data = null, message = 'Success', meta = null, statusCode = 200) {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess
};
