import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import customerRoutes from './modules/customers/customers.routes';
import productRoutes from './modules/products/products.routes';
import challanRoutes from './modules/challans/challans.routes';

const app: Application = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// ─── Health & Root Check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Mini ERP + CRM Operations Portal Backend API',
    version: '1.0.0',
    documentation: 'See README.md or Postman Collection for full API documentation',
    apiRoot: `${config.apiPrefix}`,
    health: '/health',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ERP/CRM API is running',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
const api = config.apiPrefix;

app.get(api, (_req, res) => {
  res.json({
    success: true,
    message: 'Mini ERP + CRM Operations Portal API v1',
    version: '1.0.0',
    endpoints: {
      auth: `${api}/auth`,
      customers: `${api}/customers`,
      products: `${api}/products`,
      challans: `${api}/challans`,
      users: `${api}/users`,
      health: '/health',
    },
  });
});

app.use(`${api}/auth`, authRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/customers`, customerRoutes);
app.use(`${api}/products`, productRoutes);
app.use(`${api}/challans`, challanRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
