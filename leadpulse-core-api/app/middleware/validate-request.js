const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // 1. Use async parsing to support database checks in schemas
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // 2. Overwrite the request with the sanitized/transformed data
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      next(error); 
    }
  };
};

module.exports = validateRequest;