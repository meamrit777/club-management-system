export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);

      throw new Error("Unauthorized");
    }

    next();
  };
};
