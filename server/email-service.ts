// Simple email service for testing
// In production, use a proper email service like SendGrid, AWS SES, etc.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // For demo purposes, we'll simulate email sending
    // In production, implement actual email sending logic
    
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject,
      from: options.from || 'noreply@premiererp.com'
    });
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (you can set this to false to test error handling)
    const simulateSuccess = true;
    
    if (simulateSuccess) {
      return { success: true };
    } else {
      return { success: false, error: 'Simulated email sending failure' };
    }
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}