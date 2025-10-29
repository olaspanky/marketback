require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const axios = require('axios');
const https = require('https');
const mongoose = require('mongoose');

const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://olakareemomobolarinwa:5fouoAMTjLZ17WEJ@cluster0.okrpagt.mongodb.net/pbrsite?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Registration Schema
const registrationSchema = new mongoose.Schema({
  // Personal Information
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  organization: { type: String, required: true },
  role: { type: String, required: true },
  country: { type: String, required: true },
  
  // Payment Information
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  amountDisplay: String,
  
  // Stripe Information
  stripeSessionId: String,
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid'
  },
  
  // Email Status
  confirmationEmailSent: { type: Boolean, default: false },
  confirmationEmailSentAt: Date,
  emailError: String,
  
  // Timestamps
  attemptedAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Additional tracking
  ipAddress: String,
  userAgent: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Error tracking for failed attempts
  errorMessage: String,
  errorDetails: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
registrationSchema.index({ email: 1 });
registrationSchema.index({ stripeSessionId: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ createdAt: -1 });

const Registration = mongoose.model('Registration', registrationSchema);

// HTTPS Agent for external API
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

// Email sending function
async function sendConfirmationEmail(recipientEmail, participantName) {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
          <td style=";">
            <table role="presentation" style=" margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <tr>
                <td style="padding: 9px 4px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                    Dear <strong style="color: #1e3a8a;">${participantName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.7; color: #4b5563;">
                    Thank you for completing your payment for the <strong style="color: #1e3a8a;">Pharm East and West African Training</strong> organized by PBR Lifesciences. We are delighted to confirm your registration! ✨
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; padding: 25px; border-left: 4px solid #3b82f6;">
                        <h2 style="margin: 0 0 20px 0; color: #000000ff; font-size: 18px; font-weight: 700;">
                          📋 Training Details
                        </h2>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; vertical-align: top;">
                              <span style="font-size: 24px; margin-right: 10px;">📅</span>
                            </td>
                            <td style="padding: 10px 0;">
                              <strong style="color: #000000ff; font-size: 15px; display: block; margin-bottom: 3px;">Training Dates</strong>
                              <span style="color: #000000ff; font-size: 15px;">November 14th - 16th, 2025</span>
                            </td>
                          </tr>
                          
                          <tr>
                            <td style="padding: 10px 0; vertical-align: top;">
                              <span style="font-size: 24px; margin-right: 10px;">💻</span>
                            </td>
                            <td style="padding: 10px 0;">
                              <strong style="color: #000000ff; font-size: 15px; display: block; margin-bottom: 8px;">register via zoom for notifications and reminders</strong>
                              <a href="https://bit.ly/pbrWEAwksp" style="display: inline-block; background-color: #3b82f6; color: #ffffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.3s;">
                                🔗 Click to Join Training
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                    <tr>
                      <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #92400e;">
                          <strong style="color: #78350f;">⚠️ Important:</strong> Please log in at least <strong>10 minutes before</strong> the start time to avoid any technical delays.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 16px; font-weight: 700;">
                      📚 What to Expect
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Comprehensive course materials</li>
                      <li style="margin-bottom: 8px;">Post-session resources and recordings</li>
                      <li style="margin-bottom: 8px;">Certificate of completion</li>
                      <li>Networking opportunities with industry professionals</li>
                    </ul>
                  </div>
                  
                  <p style="margin: 30px 0 25px 0; font-size: 16px; line-height: 1.7; color: #4b5563;">
                    We look forward to your active participation in this impactful training designed to enhance pharmaceutical capacity across East and West Africa. 🌍
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <tr>
                      <td style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-size: 15px; color: #6b7280; font-weight: 600;">
                          Need Help? We're Here for You!
                        </p>
                        <p style="margin: 0; font-size: 15px; color: #4b5563;">
                          📧 <a href="mailto:jumoke.kareem@pbrinsight.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">jumoke.kareem@pbrinsight.com</a><br>
                          📱 <a href="tel:+2348032915433" style="color: #3b82f6; text-decoration: none; font-weight: 600;">+234 803 291 5433</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; font-size: 16px; color: #6b7280;">
                      Warm regards,
                    </p>
                    <p style="margin: 0; font-size: 17px; color: #1e3a8a; font-weight: 700;">
                      Jumoke Kareem
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                      PBR Lifesciences Team
                    </p>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                    This is an automated confirmation email.<br>
                    Please do not reply directly to this email.
                  </p>
                  <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                    © 2025 PBR Lifesciences. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const emailData = {
      to: recipientEmail,
      from: process.env.EMAIL_FROM || 'noreply@pbrinsight.com',
      subject: '✅ Registration Confirmed - Pharm East and West African Training',
      body: htmlBody,
      isHtml: true
    };

    const response = await axios.post('http://Mail.pbr.com.ng/send', emailData, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ Email sent successfully via HTTP:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error sending email via HTTP:', error.response?.data || error.message);
    console.log('🔄 Trying HTTPS with SSL bypass...');
    return sendConfirmationEmailWithSSLBypass(recipientEmail, participantName, htmlBody);
  }
}

async function sendConfirmationEmailWithSSLBypass(recipientEmail, participantName, htmlBody) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  try {
    const emailData = {
      to: recipientEmail,
      from: process.env.EMAIL_FROM || 'noreply@pbrinsight.com',
      subject: '✅ Registration Confirmed - Pharm East and West African Training',
      body: htmlBody,
      isHtml: true
    };

    const response = await axios.post('https://Mail.pbr.com.ng/send', emailData, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      httpsAgent,
      timeout: 15000
    });

    console.log('✅ Email sent successfully with SSL bypass:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error sending email with SSL bypass:', error.response?.data || error.message);
    throw error;
  }
}

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
    message: 'Stripe Payment API with MongoDB is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  let registrationRecord = null;
  
  try {
    const { name, email, phone, organization, role, country, amount, currency } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !organization || !role || !country || !amount || !currency) {
      // Log failed attempt
      registrationRecord = new Registration({
        name: name || 'Unknown',
        email: email || 'unknown@example.com',
        phone: phone || 'N/A',
        organization: organization || 'N/A',
        role: role || 'N/A',
        country: country || 'Unknown',
        amount: amount || 0,
        currency: currency || 'USD',
        status: 'failed',
        paymentStatus: 'unpaid',
        errorMessage: 'Missing required fields',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      await registrationRecord.save();
      
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'phone', 'organization', 'role', 'country', 'amount', 'currency']
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      // Log failed attempt
      registrationRecord = new Registration({
        name,
        email,
        phone,
        organization,
        role,
        country,
        amount,
        currency,
        status: 'failed',
        paymentStatus: 'unpaid',
        errorMessage: 'Invalid email format',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      await registrationRecord.save();
      
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Calculate display amount
    let amountDisplay = '';
    const symbols = {
      'ngn': '₦',
      'ghs': 'GH₵',
      'kes': 'KSh',
      'usd': '$'
    };
    const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase();
    amountDisplay = `${symbol}${(amount / 100).toLocaleString()}`;

    // Create initial registration record
    registrationRecord = new Registration({
      name,
      email,
      phone,
      organization,
      role,
      country,
      amount,
      currency,
      amountDisplay,
      status: 'pending',
      paymentStatus: 'unpaid',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Get the origin for redirect URLs
    const origin = req.headers.origin || req.headers.referer || process.env.FRONTEND_URL || 'http://localhost:3000';
    const baseUrl = origin.replace(/\/$/, '');

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Pharm East and West African Training',
              description: `Registration for ${name} from ${organization}`,
              images: [],
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
        registrationId: registrationRecord._id.toString()
      },
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true,
      },
    });

    // Update registration with Stripe session ID
    registrationRecord.stripeSessionId = session.id;
    registrationRecord.metadata = {
      stripeUrl: session.url,
      expiresAt: session.expires_at
    };
    await registrationRecord.save();

    console.log('✅ Registration attempt logged:', registrationRecord._id);

    res.json({ 
      url: session.url, 
      sessionId: session.id,
      registrationId: registrationRecord._id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Log error in registration record if it exists
    if (registrationRecord) {
      registrationRecord.status = 'failed';
      registrationRecord.errorMessage = error.message;
      registrationRecord.errorDetails = {
        stack: error.stack,
        timestamp: new Date()
      };
      await registrationRecord.save();
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get session details and send confirmation email automatically
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['customer_details', 'payment_intent']
    });

    // Find and update registration in database
    const registration = await Registration.findOne({ stripeSessionId: session.id });
    
    if (registration) {
      // Update registration status based on payment status
      if (session.payment_status === 'paid') {
        registration.status = 'completed';
        registration.paymentStatus = 'paid';
        registration.completedAt = new Date();
        registration.stripePaymentIntentId = session.payment_intent?.id || session.payment_intent;
        registration.stripeCustomerId = session.customer;
        
        // Send confirmation email if not already sent
        if (!registration.confirmationEmailSent && session.customer_details?.email && session.metadata?.name) {
          try {
            await sendConfirmationEmail(
              session.customer_details.email,
              session.metadata.name
            );
            registration.confirmationEmailSent = true;
            registration.confirmationEmailSentAt = new Date();
            console.log('✅ Confirmation email sent to:', session.customer_details.email);
          } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
            registration.emailError = emailError.message;
          }
        }
      } else if (session.payment_status === 'unpaid') {
        if (session.status === 'expired') {
          registration.status = 'expired';
        }
      }
      
      await registration.save();
      console.log('✅ Registration updated:', registration._id);
    }

    const sessionData = {
      id: session.id,
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      email_sent: registration?.confirmationEmailSent || false,
      registration_id: registration?._id
    };

    res.json(sessionData);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Authentication Middleware
function authenticateDashboard(req, res, next) {
  const passkey = req.headers['x-dashboard-passkey'] || req.query.passkey || req.body.passkey;
  
  if (passkey === 'pbr2025!') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Invalid passkey' });
  }
}

// Dashboard API Endpoints
app.get('/api/dashboard/stats', authenticateDashboard, async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();
    const completedRegistrations = await Registration.countDocuments({ status: 'completed' });
    const pendingRegistrations = await Registration.countDocuments({ status: 'pending' });
    const failedRegistrations = await Registration.countDocuments({ status: 'failed' });
    const expiredRegistrations = await Registration.countDocuments({ status: 'expired' });
    
    // Revenue calculation
    const revenueData = await Registration.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Country breakdown
    const countryData = await Registration.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Recent registrations by date
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentActivity = await Registration.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      overview: {
        total: totalRegistrations,
        completed: completedRegistrations,
        pending: pendingRegistrations,
        failed: failedRegistrations,
        expired: expiredRegistrations,
        conversionRate: totalRegistrations > 0 
          ? ((completedRegistrations / totalRegistrations) * 100).toFixed(2) 
          : 0
      },
      revenue: revenueData,
      countries: countryData,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/registrations', authenticateDashboard, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const search = req.query.search;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(query)
    ]);
    
    res.json({
      registrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export registrations as CSV
app.get('/api/dashboard/export', authenticateDashboard, async (req, res) => {
  try {
    const status = req.query.status;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const registrations = await Registration.find(query).sort({ createdAt: -1 }).lean();
    
    // Create CSV
    const csv = [
      'Name,Email,Phone,Organization,Role,Country,Amount,Currency,Status,Payment Status,Created At,Completed At,Email Sent'
    ];
    
    registrations.forEach(reg => {
      csv.push([
        `"${reg.name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.phone || ''}"`,
        `"${reg.organization || ''}"`,
        `"${reg.role || ''}"`,
        `"${reg.country || ''}"`,
        reg.amount || 0,
        reg.currency || '',
        reg.status || '',
        reg.paymentStatus || '',
        reg.createdAt ? new Date(reg.createdAt).toISOString() : '',
        reg.completedAt ? new Date(reg.completedAt).toISOString() : '',
        reg.confirmationEmailSent ? 'Yes' : 'No'
      ].join(','));
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${Date.now()}.csv`);
    res.send(csv.join('\n'));
  } catch (error) {
    console.error('Error exporting registrations:', error);
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
      console.log('💰 Payment successful via webhook!');
      
      // Update registration in database
      const registrationId = session.metadata?.registrationId;
      if (registrationId) {
        try {
          const registration = await Registration.findById(registrationId);
          if (registration) {
            registration.status = 'completed';
            registration.paymentStatus = 'paid';
            registration.completedAt = new Date();
            registration.stripePaymentIntentId = session.payment_intent;
            registration.stripeCustomerId = session.customer;
            await registration.save();
            console.log('✅ Registration updated via webhook:', registrationId);
          }
        } catch (error) {
          console.error('❌ Error updating registration via webhook:', error);
        }
      }
      break;
    
    case 'checkout.session.expired':
      console.log('⏰ Checkout session expired');
      const expiredSession = event.data.object;
      const expiredRegId = expiredSession.metadata?.registrationId;
      if (expiredRegId) {
        try {
          await Registration.findByIdAndUpdate(expiredRegId, {
            status: 'expired'
          });
          console.log('✅ Registration marked as expired:', expiredRegId);
        } catch (error) {
          console.error('❌ Error updating expired registration:', error);
        }
      }
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
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
    console.log(`   - GET  /api/dashboard/stats (requires passkey)`);
    console.log(`   - GET  /api/dashboard/registrations (requires passkey)`);
    console.log(`   - GET  /api/dashboard/export (requires passkey)`);
  });
}

// Export for Vercel
module.exports = app;