const { pagination } = require("../utils/validation.js");
module.exports = (req,res,next)=>{
    try {
        req.pagination = pagination(req.query);
        return next();
    } catch (error) {
        return next(error)
    }
}