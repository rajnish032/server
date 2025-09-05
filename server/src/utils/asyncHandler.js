const asyncHandler = (myfn) => {
  async function reqHandler(req, res, next) {
    try {
      await myfn(req, res, next);
    } catch (err) {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  return reqHandler;
};

export { asyncHandler };
