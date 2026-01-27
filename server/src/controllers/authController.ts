import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { ApiResponse, LoginCredentials, RegisterData } from '../types';
import { DEFAULT_ADMIN_PERMISSIONS } from '../permissions';
import { emitDashboardStatsUpdate } from '../realtime/socket';

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

/**
 * @desc    Register a new user (Admin only can create users)
 * @route   POST /api/auth/register
 * @access  Private/Admin
 */
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
      return;
    }

    const { name, email, password, role, permissions }: RegisterData = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
      return;
    }

    // Create user
    const resolvedRole = role || 'admin';
    const resolvedPermissions =
      resolvedRole === 'admin'
        ? (permissions && permissions.length > 0 ? permissions : DEFAULT_ADMIN_PERMISSIONS)
        : permissions || [];

    const user = await User.create({
      name,
      email,
      password,
      role: resolvedRole,
      permissions: resolvedPermissions,
    });

    void emitDashboardStatsUpdate();

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: (user as any).permissions || [],
          isActive: user.isActive,
        },
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Error registering user',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
      return;
    }

    const { email, password }: LoginCredentials = req.body;

    // Check if user exists and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Your account has been deactivated',
      });
      return;
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (parseInt(process.env.JWT_COOKIE_EXPIRE as string) || 7) *
            24 *
            60 *
            60 *
            1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    };

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: (user as any).permissions || [],
          isActive: user.isActive,
        },
      },
    };

    res.status(200).cookie('token', token, cookieOptions).json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging in',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          permissions: (user as any)?.permissions || [],
          isActive: user?.isActive,
        },
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user data',
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging out',
    });
  }
};
