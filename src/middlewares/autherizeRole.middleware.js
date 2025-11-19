import { ApiError } from "../utils/api-error.js";

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "You are not authorized to perform this action");
    }
    next();
  };
};
