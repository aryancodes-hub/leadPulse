    const { BadRequestError } = require("../lib/error");
    module.exports = (req, res, next) =>
        req.is("application/json")
            ? next()
            : next(new BadRequestError("Content-Type must be application/json."));
