const {BadRequestError} = require("../lib/error.js");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validateUuid = (value, field) =>{
    if(!uuidPattern.test(value)) throw new BadRequestError(`${field} must be a valid UUID.`);
};

const pagination = (query) => {
    const page = Number(query.page || 1);
    const pageSize = Number(query.pageSize || 20);
    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 100
    )
        throw new BadRequestError("Invalid pagination.");
    return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
};

module.exports = {validateUuid, pagination}