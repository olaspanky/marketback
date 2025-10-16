require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const axios = require('axios');
const https = require('https');

const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// HTTPS Agent for external API (optional - allows self-signed certificates in dev)
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

// Email sending function using external API - FIXED HTML issue
// Email sending function using external API - FIXED for your API requirements
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
          <td style="padding: 3px;">
            <!-- Main Container -->
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    🎉 Registration Confirmed!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    You're all set for the training
                  </p>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                    Dear <strong style="color: #1e3a8a;">${participantName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.7; color: #4b5563;">
                    Thank you for completing your payment for the <strong style="color: #1e3a8a;">Pharm East and West African Training</strong> organized by PBR Lifesciences. We are delighted to confirm your registration! ✨
                  </p>
                  
                  <!-- Event Details Card -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; padding: 25px; border-left: 4px solid #3b82f6;">
                        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 18px; font-weight: 700;">
                          📋 Training Details
                        </h2>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; vertical-align: top;">
                              <span style="font-size: 24px; margin-right: 10px;">📅</span>
                            </td>
                            <td style="padding: 10px 0;">
                              <strong style="color: #1f2937; font-size: 15px; display: block; margin-bottom: 3px;">Training Dates</strong>
                              <span style="color: #4b5563; font-size: 15px;">November 14th - 16th, 2025</span>
                            </td>
                          </tr>
                          
                          <tr>
                            <td style="padding: 10px 0; vertical-align: top;">
                              <span style="font-size: 24px; margin-right: 10px;">🕒</span>
                            </td>
                            <td style="padding: 10px 0;">
                              <strong style="color: #1f2937; font-size: 15px; display: block; margin-bottom: 3px;">Time</strong>
                            </td>
                          </tr>
                          
                          <tr>
                            <td style="padding: 10px 0; vertical-align: top;">
                              <span style="font-size: 24px; margin-right: 10px;">💻</span>
                            </td>
                            <td style="padding: 10px 0;">
                              <strong style="color: #1f2937; font-size: 15px; display: block; margin-bottom: 8px;">Join via Zoom</strong>
                              <a href="https://bit.ly/pbrWEAwksp" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.3s;">
                                🔗 Click to Join Training
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Important Notice -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                    <tr>
                      <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #92400e;">
                          <strong style="color: #78350f;">⚠️ Important:</strong> Please log in at least <strong>10 minutes before</strong> the start time to avoid any technical delays.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- What to Expect -->
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
                  
                  <!-- Contact Section -->
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
                  
                  <!-- Signature -->
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
              
              <!-- Footer -->
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

    // Try HTTP instead of HTTPS
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
    
    // Fallback to HTTPS with SSL bypass
    console.log('🔄 Trying HTTPS with SSL bypass...');
    return sendConfirmationEmailWithSSLBypass(recipientEmail, participantName, htmlBody);
  }
}

// Fallback function with SSL bypass
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
              name: 'Pharm East and West African Training',
              description: `Registration for ${name} from ${organization}`,
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

// Get session details and send confirmation email automatically
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['customer_details']
    });

    const sessionData = {
      id: session.id,
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    };

    // Send confirmation email automatically if payment is successful
    if (session.payment_status === 'paid' && session.customer_details?.email && session.metadata?.name) {
      try {
        await sendConfirmationEmail(
          session.customer_details.email,
          session.metadata.name
        );
        console.log('✅ Confirmation email sent automatically to:', session.customer_details.email);
        
        // Add email status to response
        sessionData.email_sent = true;
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        sessionData.email_sent = false;
        sessionData.email_error = emailError.message;
      }
    }

    res.json(sessionData);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Stripe events (optional - keep for redundancy)
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
      console.log('Customer:', session.customer_details);
      console.log('Metadata:', session.metadata);
      
      // Optional: You can keep this as a backup email sending method
      // But the main email will be sent when user reaches success page
      /*
      try {
        await sendConfirmationEmail(
          session.customer_details.email,
          session.metadata.name
        );
        console.log('✅ Confirmation email sent via webhook to:', session.customer_details.email);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email via webhook:', emailError);
      }
      */
      
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