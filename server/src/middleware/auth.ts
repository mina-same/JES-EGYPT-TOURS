import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload } from '../types';

const readRequestToken = (req: Request): string | undefined => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }

  return req.cookies?.token;
};

const loadTokenUser = async (token: string) => {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as JwtPayload;

  return User.findById(decoded.id).select('-password');
};

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = readRequestToken(req);

    // Make sure token exists
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    try {
      const user = await loadTokenUser(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: 'User account is deactivated',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Populate req.user when a visitor supplies a valid admin token, while keeping
 * genuinely public GET routes public. An expired browser token is ignored on
 * these routes so public catalogue pages do not become 401 pages; it simply
 * cannot grant access to inactive content.
 */
export const optionalProtect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = readRequestToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const user = await loadTokenUser(token);
    if (!user || !user.isActive) {
      next();
      return;
    }

    req.user = user;
    next();
  } catch {
    next();
  }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    // Superadmin bypasses role checks
    if (req.user.role === 'superadmin') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};

/**
 * Grant access if user has at least one of the required permissions
 */
export const permit = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    // Superadmin bypasses permission checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    const userPerms = (req.user as any).permissions || [];
    const hasPermission = permissions.some(p => userPerms.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${permissions.join(' or ')}`,
      });
      return;
    }

    next();
  };
};
