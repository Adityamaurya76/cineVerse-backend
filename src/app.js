import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use('/api/v1/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({
    limit : '10mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb" 
}));

app.use(express.static("public"));
app.use(cookieParser());

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [process.env.PRODUCTION_ORIGIN];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// import the routes
import healthcheckRoutes from './routes/healthcheck.routes.js';
import authRoute from './routes/auth.routes.js';
import categoryRoute from './routes/category.routes.js';
import userRoute from './routes/user.routes.js';
import videoRoute from './routes/video.routes.js';
import SubscriptionPlanRoute from './routes/subscriptionPlan.routes.js';
import subscriptionRoute from './routes/subscription.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import homeRoute from './routes/home.routes.js';
import movieRoute from './routes/movie.routes.js';

// use the routes
app.use('/api/v1/healthcheck', healthcheckRoutes);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/category', categoryRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/video', videoRoute);
app.use('/api/v1/subscription-plans', SubscriptionPlanRoute);
app.use('/api/v1/subscription', subscriptionRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/home', homeRoute);
app.use('/api/v1/movie', movieRoute);

app.get("/", (req, res) => {
    res.send("welcome to video streaming webisite");
});

export default app;