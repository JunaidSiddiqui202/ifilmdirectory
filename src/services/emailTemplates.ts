export type EmailType = 'invite' | 'warning' | 'suspended' | 'blocked' | 'welcome' | 'request_received' | 'request_confirmed' | 'request_declined' | 'access_request_received' | 'admin_access_alert';

export interface EmailData {
    studioName?: string;
    date?: string;
    time?: string;
    serviceType?: string;
    amount?: string;
    actionUrl?: string;
}

export const getEmailTemplate = (type: EmailType, name: string, data?: EmailData) => {
    const brandColor = '#ef4444';
    const darkColor = '#1a1c1e';

    const baseStyle = `
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #ffffff;
        color: #1f2937;
        line-height: 1.6;
    `;

    const appUrl = 'https://ifilmdirectory.com';
    const logoUrl = `${appUrl}/logo.png`;

    const templates: Record<string, { subject: string; title: string; content: string }> = {
        welcome: {
            subject: 'Welcome to iFilmDirectory! 🎬',
            title: `Lights, Camera, Action! Welcome, ${name}!`,
            content: `
                <p>Welcome to <strong>iFilmDirectory</strong>, India's premier professional network for the film and media industry.</p>
                <p>Your journey in the world of cinema just got a lot more exciting. Here's what you can do now:</p>
                <ul style="padding-left: 20px;">
                    <li>Build a stunning professional portfolio</li>
                    <li>Connect with production houses and talent</li>
                    <li>Book world-class shooting floors and equipment</li>
                    <li>Apply for verified casting calls and crew positions</li>
                </ul>
                <div style="margin: 40px 0; text-align: center;">
                    <a href="${appUrl}/profile" style="background-color: ${brandColor}; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">Complete Your Profile</a>
                </div>
                <p>We're thrilled to have you on board. If you have any questions, our support team is always here to help.</p>
            `
        },
        request_received: {
            subject: 'New Booking Request Received',
            title: 'Your Booking Request is Processing',
            content: `
                <p>Hi ${name},</p>
                <p>We've received your booking request for <strong>${data?.studioName || 'the facility'}</strong>. The studio team has been notified and will review your request shortly.</p>
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; font-size: 16px; color: ${darkColor};">Booking Details:</h3>
                    <p style="margin: 5px 0;"><strong>Facility:</strong> ${data?.studioName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${data?.date}</p>
                    <p style="margin: 5px 0;"><strong>Service:</strong> ${data?.serviceType || 'Shooting Floor'}</p>
                </div>
                <p>You will receive another update as soon as the studio confirms the availability.</p>
            `
        },
        request_confirmed: {
            subject: 'Booking Confirmed! ✅',
            title: 'Your Session is Confirmed',
            content: `
                <p>Great news, ${name}!</p>
                <p>Your booking with <strong>${data?.studioName}</strong> has been <strong>Confirmed</strong>.</p>
                <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bbf7d0;">
                    <h3 style="margin-top: 0; font-size: 16px; color: #166534;">Confirmed Details:</h3>
                    <p style="margin: 5px 0;"><strong>Facility:</strong> ${data?.studioName}</p>
                    <p style="margin: 5px 0;"><strong>Schedule:</strong> ${data?.date} at ${data?.time || '9:00 AM'}</p>
                    <p style="margin: 5px 0;"><strong>Total Price:</strong> ${data?.amount || 'Quote TBD'}</p>
                </div>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${appUrl}/messages" style="background-color: ${darkColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">Message Studio</a>
                </div>
                <p>Please ensure you bring your professional ID for verification at the entrance.</p>
            `
        },
        request_declined: {
            subject: 'Update on your Booking Request',
            title: 'Booking Not Available',
            content: `
                <p>Hi ${name},</p>
                <p>Unfortunately, <strong>${data?.studioName}</strong> is unable to accommodate your request for the selected date (${data?.date}).</p>
                <p>This is usually due to unexpected schedule changes or prior maintenance. We recommend exploring other nearby facilities on our marketplace.</p>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${appUrl}/marketplace" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">Find Alternative Studios</a>
                </div>
            `
        },
        invite: {
            subject: 'Invitation to Join iFilmDirectory',
            title: `Welcome to the Inner Circle, ${name}!`,
            content: `
                <p>We are pleased to inform you that your application for access to <strong>iFilmDirectory</strong> has been approved.</p>
                <p>You now have access to our exclusive network of film professionals, casting calls, and production tools.</p>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${appUrl}/login" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">Complete Your Registration</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">This invitation is exclusive to you. Please do not share this link.</p>
            `
        },
        access_request_received: {
            subject: 'Application Received - iFilmDirectory 🎬',
            title: `Thank you for your interest, ${name}!`,
            content: `
                <p>We've received your application to join <strong>iFilmDirectory</strong>, the premier professional network for the film industry.</p>
                <p>Our team is currently reviewing your portfolio and credentials. This process typically takes 24-48 hours.</p>
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Next Steps:</strong></p>
                    <p style="margin: 10px 0 0 0; color: #1f2937;">You will receive an invitation email once your profile is approved. Once invited, you'll be able to complete your registration and build your professional profile.</p>
                </div>
                <p>Thank you for your patience while we maintain our community quality standards.</p>
            `
        },
        admin_access_alert: {
            subject: 'NEW ACCESS REQUEST: Action Required 🚨',
            title: 'New Professional Application Received',
            content: `
                <p>A new professional has requested access to the platform.</p>
                <div style="background-color: #fff1f2; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #fecdd3;">
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                    <p style="margin: 5px 0;"><strong>Role:</strong> ${data?.serviceType || 'Not specified'}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${data?.amount || 'Not specified'}</p>
                </div>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${appUrl}/-admin" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">Review Application</a>
                </div>
            `
        },
        warning: {
            subject: 'Administrative Warning - iFilmDirectory',
            title: `Formal Warning: ${name}`,
            content: `
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">Action Required</p>
                </div>
                <p>We have noticed activity on your account that violates our community guidelines.</p>
                <p>Please consider this a formal notification. Continued violation may result in temporary suspension or a permanent ban from the platform.</p>
            `
        }
    };

    const template = templates[type] || templates['welcome'];

    return {
        subject: template.subject,
        html: `
            <html>
                <body style="background-color: #f9fafb; padding: 0; margin: 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <div style="${baseStyle} overflow: hidden; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                                    <!-- Header -->
                                    <div style="background-color: #ffffff; padding: 40px 0; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                        <img src="${logoUrl}" alt="iFilmDirectory" style="height: 80px; width: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
                                    </div>
                                    
                                    <!-- Body -->
                                    <div style="padding: 40px; background-color: #ffffff;">
                                        <h2 style="color: #111827; margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.2;">
                                            ${template.title}
                                        </h2>
                                        <div style="color: #4b5563; font-size: 16px; line-height: 1.7;">
                                            ${template.content}
                                        </div>
                                    </div>

                                    <!-- Footer -->
                                    <div style="padding: 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
                                        <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
                                            &copy; ${new Date().getFullYear()} iFilmDirectory. All rights reserved.
                                        </p>
                                        <p style="font-size: 12px; color: #94a3b8;">
                                            Film Nagar, Hyderabad • The Professional Network for Cinema
                                        </p>
                                        <div style="margin-top: 20px;">
                                            <a href="${appUrl}" style="color: ${brandColor}; text-decoration: none; font-weight: 600; font-size: 13px;">Visit Website</a>
                                            <span style="margin: 0 10px; color: #cbd5e1;">&bull;</span>
                                            <a href="${appUrl}/profile" style="color: ${brandColor}; text-decoration: none; font-weight: 600; font-size: 13px;">My Account</a>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    };
};
