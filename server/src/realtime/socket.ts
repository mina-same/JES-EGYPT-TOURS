import { allowedNotificationTypes, canRead } from '../utils/notificationAccess';
import { PERMISSIONS } from '../permissions';
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
  id: string;
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

export const buildDashboardStats = async (): Promise<AdminDashboardStats> => {
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
    'https://jes-egypt-tours.vercel.app',
    'https://www.jesegypttours.com',
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
      (socket.data as any).token = token;
      (socket.data as any).expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
      return next();
    } catch {
      return next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const expiresAt = socket.data.expiresAt;
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    const checkExpiry = () => {
      if (expiresAt <= Date.now()) { socket.disconnect(true); return; }
      expiryTimer = setTimeout(checkExpiry, Math.min(expiresAt - Date.now(), 2147483647));
      expiryTimer.unref();
    };
    if (expiresAt) checkExpiry();
    const validationTimer = setInterval(() => { void refreshSocketUser(socket); }, 30000);
    validationTimer.unref();
    socket.on('disconnect', () => { if (expiryTimer) clearTimeout(expiryTimer); clearInterval(validationTimer); });
    void buildDashboardStats().then(stats => socket.emit('dashboard:stats', scopeStats(stats, socket.data.user))).catch(() => {});
  });

  return io;
};

function scopeStats(stats: AdminDashboardStats, user: any) {
  return {
    updatedAt: stats.updatedAt,
    ...(canRead(user, PERMISSIONS.USER_READ) ? { usersTotal: stats.usersTotal } : {}),
    ...(canRead(user, PERMISSIONS.TOUR_READ) ? { toursTotal: stats.toursTotal, toursActive: stats.toursActive } : {}),
    ...(canRead(user, PERMISSIONS.BOOKING_READ) ? { bookingsTotal: stats.bookingsTotal, bookingsPending: stats.bookingsPending } : {}),
    ...(canRead(user, PERMISSIONS.CONTACT_READ) ? { contactNew: stats.contactNew } : {}),
    ...(canRead(user, PERMISSIONS.TAILOR_MADE_READ) ? { tailorMadePending: stats.tailorMadePending } : {}),
  };
}
async function refreshSocketUser(socket: Socket) {
  try {
    jwt.verify(socket.data.token, process.env.JWT_SECRET as string);
    const user = await User.findById(socket.data.user._id).select('-password');
    if (!user?.isActive || !['admin', 'superadmin'].includes(user.role)) throw new Error('Session ended');
    socket.data.user = user;
    return user;
  } catch { socket.disconnect(true); return null; }
}
export const emitAdminNotification = async (payload: AdminNotificationPayload) => {
  if (!io) return;
  await Promise.all([...io.sockets.sockets.values()].map(async socket => {
    const user = await refreshSocketUser(socket);
    if (user && allowedNotificationTypes(user).includes(payload.type)) socket.emit('notification:new', payload);
  }));
};
export const emitDashboardStatsUpdate = async () => {
  if (!io || io.sockets.sockets.size === 0) return;
  try {
    const stats = await buildDashboardStats();
    await Promise.all([...io.sockets.sockets.values()].map(async socket => {
      const user = await refreshSocketUser(socket);
      if (user) socket.emit('dashboard:stats', scopeStats(stats, user));
    }));
  } catch { /* HTTP synchronization remains available. */ }
};
