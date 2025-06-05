import { Router, Request, Response } from "express";
import * as dotenv from 'dotenv';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
dotenv.config();

// Use direct string from environment variable to ensure it's loaded
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { priceId, userId, email, name, phone } = req.body;

    console.log("Price ID:", priceId);
    console.log("User ID:", userId);
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("Phone:", phone);

    // Determine price based on plan type
    let amount = 0;
    let description = '';
    
    if (priceId === 'monthly') {
      amount = 49 * 100; // $49 in cents
      description = 'Monthly subscription with full access';
    } else if (priceId === 'yearly') {
      amount = 499 * 100; // $499 in cents
      description = 'Yearly subscription with full access (15% savings)';
    } else {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    const session = await stripe.checkout.sessions.create({

      customer_email: email,
      client_reference_id: userId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${priceId.charAt(0).toUpperCase() + priceId.slice(1)} Subscription`,
            description: description,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/pricing',
      cancel_url: 'http://localhost:3000/pricing',
      metadata: {
        userId: userId,
        planType: priceId
      }
    });
    console.log("Session ID:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});


router.get('/status/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve the session to check its payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Return payment status and details
    res.json({
      id: session.id,
      status: session.payment_status,
      customer: session.customer_details,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Update user's sessionId in database
router.post('/session-update', async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'User ID and session ID are required' });
    }
    
    // Update the user record with the session ID
    const [updatedUser] = await db
      .update(users)
      .set({
        sessionId: sessionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Session ID updated successfully'
    });
  } catch (error) {
    console.error('Error updating session ID:', error);
    return res.status(500).json({ error: 'Failed to update session ID' });
  }
});

// Check and update payment status for a user
router.post('/check-payment', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get user from database to check for session ID
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    // Check if subscription has expired - even if user is paid
    if (user.isPaid && user.expiryDate) {
      const expiryDate = new Date(user.expiryDate);
      const now = new Date();
      
      if (expiryDate < now) {
        // Subscription has expired, update user
        const [updatedUser] = await db
          .update(users)
          .set({
            isPaid: false, // Mark as unpaid since subscription expired
            updatedAt: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
        
        return res.status(200).json({
          success: true,
          isPaid: false,
          expiryDate: user.expiryDate,
          message: 'Subscription has expired'
        });
      }
    }
    
    // If user doesn't have a session ID, nothing to check
    if (!user.sessionId) {
      return res.status(200).json({ 
        success: true,
        isPaid: user.isPaid,
        expiryDate: user.expiryDate,
        message: 'No session ID found for user'
      });
    }
    
    // Check the payment status with Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(user.sessionId);
      
      // If payment is successful but user hasn't been marked as paid yet
      if (session.payment_status === 'paid' && !user.isPaid) {
        // Determine subscription duration
        let expiryDate = new Date();
        if (session.metadata.planType === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (session.metadata.planType === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        // Update user with payment information
        const [updatedUser] = await db
          .update(users)
          .set({
            isPaid: true,
            expiryDate: expiryDate,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
        
        return res.status(200).json({
          success: true,
          isPaid: true,
          expiryDate: expiryDate,
          message: `Payment confirmed and user updated with ${session.metadata.planType} subscription`
        });
      }
      
      // If payment status is something else
      return res.status(200).json({
        success: true,
        isPaid: user.isPaid,
        expiryDate: user.expiryDate,
        paymentStatus: session.payment_status,
        message: 'Session exists but payment not confirmed or already processed'
      });
      
    } catch (error) {
      console.error('Error checking session with Stripe:', error);
      // If we can't check with Stripe for some reason, just return the current status
      return res.status(200).json({
        success: true,
        isPaid: user.isPaid,
        expiryDate: user.expiryDate,
        message: 'Failed to check session with Stripe'
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;