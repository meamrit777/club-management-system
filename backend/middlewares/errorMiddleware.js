export const NOT_FOUND_HANDLER = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const ERROR_HANDLER = (error, req, res, next) => {
  let errorMessage = error?.message;

  const __handleDuplicateErrorMessage = () => {
    errorMessage = `Field(s) already exits. Duplicate ${Object.keys(
      error?.keyValue
    ).join("&")}.`;
  };

  const __handleRequiredErrorMessage = () => {
    const _errorObj = error?.errors;

    if (!_errorObj) return;

    const _requiredFields = Object.keys(_errorObj).filter(
      (key) => _errorObj[key] && _errorObj[key]?.kind === "required"
    );

    if (!_requiredFields?.length) return;

    const _missingFieldsErrorMessage = `Missing required fields: ${_requiredFields?.join(
      ", "
    )}`;

    errorMessage = _missingFieldsErrorMessage;
  };

  const __handleMiscErrorMessages = () => {
    __handleRequiredErrorMessage();
  };

  switch (error?.code) {
    case 11000:
      __handleDuplicateErrorMessage();
      break;

    default:
      __handleMiscErrorMessages();
      break;
  }

  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: errorMessage,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });

  next(error);
};
