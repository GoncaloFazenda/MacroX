import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import foodRoutes from './routes/foods';
import compositeMealRoutes from './routes/compositeMeals';
import dailyPlanRoutes from './routes/dailyPlans';
import weeklyPlanRoutes from './routes/weeklyPlans';
import templateRoutes from './routes/templates';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Swagger Config ─────────────────────────────────
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MacroX API',
      version: '1.0.0',
      description: 'Nutrition tracking & meal planning API',
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ─── Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// ─── Swagger UI ─────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MacroX API Docs',
}));

// ─── Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/composite-meals', compositeMealRoutes);
app.use('/api/daily-plans', dailyPlanRoutes);
app.use('/api/weekly-plans', weeklyPlanRoutes);
app.use('/api/templates', templateRoutes);

// ─── Health Check ───────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ──────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 MacroX API running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs at http://localhost:${PORT}/api/docs\n`);
  });
}

start();

export default app;
