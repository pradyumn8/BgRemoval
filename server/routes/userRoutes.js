import express from 'express';
import { clerkWebhooks, userCredits, purchaseCredits } from '../controllers/userController.js';
import authUser from '../middlewares/auth.js'

const userRouter = express.Router();

userRouter.post('/webhooks', clerkWebhooks);
userRouter.post('/credits', authUser, userCredits)
userRouter.post('/purchase', authUser, purchaseCredits)

export default userRouter;
