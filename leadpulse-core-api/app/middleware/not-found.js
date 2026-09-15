const { NotFoundError } = require("../lib/error.js");
module.exports = (req, res, next) => next(new NotFoundError("API Endpoint not found."));
