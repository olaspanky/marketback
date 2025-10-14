// api/index.js
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Stripe Payment API is running',
    timestamp: new Date().toISOString()
  });
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { name, email, phone, organization, role, country, amount, currency } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !organization || !role || !country || !amount || !currency) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'phone', 'organization', 'role', 'country', 'amount', 'currency']
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get the origin for redirect URLs
    const origin = req.headers.origin || req.headers.referer || process.env.FRONTEND_URL || 'http://localhost:3000';
    const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Event Registration',
              description: `${organization} - ${name}`,
              images: [], // Add your event logo/image URL here if needed
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}`,
      customer_email: email,
      client_reference_id: email,
      metadata: {
        name,
        phone,
        organization,
        role,
        country,
        registrationDate: new Date().toISOString(),
      },
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true,
      },
    });

    res.json({ 
      url: session.url, 
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get session details (optional - for success page verification)
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      id: session.id,
      status: session.payment_status,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💰 Payment successful!');
      console.log('Customer:', session.customer_details);
      console.log('Metadata:', session.metadata);
      
      // TODO: Save registration to database
      // TODO: Send confirmation email
      // await saveRegistration(session.metadata);
      // await sendConfirmationEmail(session.customer_details.email);
      
      break;
    
    case 'checkout.session.expired':
      console.log('⏰ Checkout session expired');
      break;
    
    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed');
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoints:`);
    console.log(`   - GET  /api`);
    console.log(`   - POST /api/create-checkout-session`);
    console.log(`   - GET  /api/checkout-session/:sessionId`);
    console.log(`   - POST /api/webhook`);
  });
}

// Export for Vercel
module.exports = app;