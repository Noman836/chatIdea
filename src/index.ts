import express from 'express';
import cors from 'cors';

import routeEmail from './routes/email.routes';
import walletRoute from './routes/wallet.routes';
import profileRoute from './routes/profile.routes';
import passwordRoute from './routes/password.routes';

import cloudinary from 'cloudinary'
import bodyParser from 'body-parser';
import { rateLimiter } from './middleware/rate-limiter';
import dotenv from 'dotenv';

dotenv.config();

//Middlewares
const app = express();
// const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(rateLimiter);

// For form-urlencoded requests
app.use(bodyParser.urlencoded({ extended: true }));

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

app.use('/api/user', routeEmail);
app.use('/api/wallet', walletRoute);
app.use('/api/profile', profileRoute);
app.use('/api/password', passwordRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
