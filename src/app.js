import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({
    limit : '10mb'
}));
app.use(express.urlencoded({
    extended: true,
    limit: "16kb" 
}));
app.use(express.static("public"));
app.use(cookieParser());

// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(","),
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

// use the routes
app.use('/api/v1/healthcheck', healthcheckRoutes);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/category', categoryRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/video', videoRoute);


app.get("/", (req, res) => {
    res.send("welcome to video streaming webisite");
});

export default app;