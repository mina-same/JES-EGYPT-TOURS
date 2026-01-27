import http from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import User from '../models/User';
import Booking from '../models/Booking';
import ContactSubmission from '../models/ContactSubmission';
import TailorMadeRequest from '../models/TailorMadeRequest';
import Tour from '../models/Tour';
import { JwtPayload } from '../types';

export type AdminNotificationType = 'booking' | 'tailorMade' | 'contact';

export interface AdminNotificationPayload {
  type: AdminNotificationType;
  title: string;
  entityId: string;
  createdAt: string;
}

export interface AdminDashboardStats {
  usersTotal: number;
  toursTotal: number;
  toursActive: number;
  bookingsTotal: number;
  bookingsPending: number;
  contactNew: number;
  tailorMadePending: number;
  updatedAt: string;
}

let io: SocketIOServer | null = null;

const recentNotifications: AdminNotificationPayload[] = [];
const RECENT_NOTIFICATIONS_MAX = 30;

const buildDashboardStats = async (): Promise<AdminDashboardStats> => {
  const [
    usersTotal,
    toursTotal,
    toursActive,
    bookingsTotal,
    bookingsPending,
    contactNew,
    tailorMadePending,
  ] = await Promise.all([
    User.countDocuments(),
    Tour.countDocuments(),
    Tour.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    ContactSubmission.countDocuments({ status: 'new' }),
    TailorMadeRequest.countDocuments({ status: 'pending' }),
  ]);

  return {
    usersTotal,
    toursTotal,
    toursActive,
    bookingsTotal,
    bookingsPending,
    contactNew,
    tailorMadePending,
    updatedAt: new Date().toISOString(),
  };
};

export const initRealtime = (server: http.Server): SocketIOServer => {
  if (io) return io;

  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://192.168.1.33:3000',
  ].filter(Boolean) as string[];

  io = new SocketIOServer(server, {
    cors: {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const tokenFromAuth = (socket.handshake.auth as any)?.token;
      const headerAuth = socket.handshake.headers?.authorization;
      const tokenFromHeader =
        typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
          ? headerAuth.split(' ')[1]
          : undefined;

      const token = tokenFromAuth || tokenFromHeader;

      if (!token) {
        return next(new Error('Not authorized'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Not authorized'));
      }

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return next(new Error('Not authorized'));
      }

      (socket.data as any).user = user;
      return next();
    } catch {
      return next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.join('admins');

    void buildDashboardStats()
      .then((stats) => {
        socket.emit('dashboard:stats', stats);
      })
      .catch(() => {
        // ignore
      });

    socket.emit('dashboard:activity:seed', recentNotifications);
  });

  return io;
};

export const emitAdminNotification = (payload: AdminNotificationPayload) => {
  if (!io) return;

  recentNotifications.unshift(payload);
  if (recentNotifications.length > RECENT_NOTIFICATIONS_MAX) {
    recentNotifications.length = RECENT_NOTIFICATIONS_MAX;
  }

  io.to('admins').emit('notification:new', payload);
  io.to('admins').emit('dashboard:activity:new', payload);
};

export const emitDashboardStatsUpdate = async () => {
  if (!io) return;
  try {
    const stats = await buildDashboardStats();
    io.to('admins').emit('dashboard:stats', stats);
  } catch {
    // ignore
  }
};
