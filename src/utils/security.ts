// Security utilities: Rate limiting, Input sanitization, CSRF protection

import DOMPurify from 'dompurify';

// ==================== RATE LIMITING ====================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private limits = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }

    check(key: string, limit: number, windowMs: number): boolean {
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now > entry.resetTime) {
            // New window
            this.limits.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
            return true;
        }

        if (entry.count >= limit) {
            // Rate limit exceeded
            return false;
        }

        // Increment count
        entry.count++;
        return true;
    }

    getRemainingTime(key: string): number {
        const entry = this.limits.get(key);
        if (!entry) return 0;
        return Math.max(0, entry.resetTime - Date.now());
    }

    reset(key: string) {
        this.limits.delete(key);
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.limits.clear();
    }
}

export const rateLimiter = new RateLimiter();

// Rate limit decorator for functions
export const rateLimit = (limit: number, windowMs: number) => {
    return (userId: string, action: string): boolean => {
        const key = `${userId}:${action}`;
        const allowed = rateLimiter.check(key, limit, windowMs);

        if (!allowed) {
            const remainingMs = rateLimiter.getRemainingTime(key);
            const remainingSec = Math.ceil(remainingMs / 1000);
            throw new Error(`Rate limit exceeded. Please try again in ${remainingSec} seconds.`);
        }

        return true;
    };
};

// Common rate limits
export const rateLimits = {
    // 5 requests per minute
    strict: rateLimit(5, 60000),

    // 10 requests per minute
    moderate: rateLimit(10, 60000),

    // 30 requests per minute
    lenient: rateLimit(30, 60000),

    // 3 requests per hour (for sensitive actions)
    sensitive: rateLimit(3, 3600000),
};

// ==================== INPUT SANITIZATION ====================

export const sanitize = {
    // Sanitize HTML content (for rich text editors)
    html: (dirty: string): string => {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: [
                'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
        });
    },

    // Sanitize for plain text (strip all HTML)
    text: (dirty: string): string => {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
        });
    },

    // Sanitize URL
    url: (dirty: string): string => {
        try {
            const url = new URL(dirty);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                return '';
            }
            return url.toString();
        } catch {
            return '';
        }
    },

    // Sanitize email
    email: (dirty: string): string => {
        const cleaned = dirty.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(cleaned) ? cleaned : '';
    },

    // Sanitize phone number (remove non-digits)
    phone: (dirty: string): string => {
        return dirty.replace(/\D/g, '');
    },

    // Sanitize filename
    filename: (dirty: string): string => {
        return dirty
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 255);
    },

    // Sanitize for SQL/NoSQL injection (basic)
    query: (dirty: string): string => {
        return dirty
            .replace(/['"`;\\]/g, '')
            .trim();
    },
};

// Validate input
export const validate = {
    email: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    url: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    phone: (phone: string): boolean => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    },

    password: (password: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*)');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    username: (username: string): boolean => {
        // 3-20 characters, alphanumeric and underscore only
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },
};

// ==================== CSRF PROTECTION ====================

class CSRFProtection {
    private token: string | null = null;

    generateToken(): string {
        // Generate a random token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

        // Store in sessionStorage
        sessionStorage.setItem('csrf-token', this.token);

        return this.token;
    }

    getToken(): string {
        if (!this.token) {
            this.token = sessionStorage.getItem('csrf-token');
        }

        if (!this.token) {
            return this.generateToken();
        }

        return this.token;
    }

    validateToken(token: string): boolean {
        const storedToken = this.getToken();
        return token === storedToken;
    }

    getHeaders(): Record<string, string> {
        return {
            'X-CSRF-Token': this.getToken(),
        };
    }

    clearToken() {
        this.token = null;
        sessionStorage.removeItem('csrf-token');
    }
}

export const csrf = new CSRFProtection();

// ==================== SECURE FETCH WRAPPER ====================

export const secureFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Add CSRF token to headers
    const headers = {
        ...options.headers,
        ...csrf.getHeaders(),
    };

    // Add credentials
    const secureOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'same-origin',
    };

    return fetch(url, secureOptions);
};

// ==================== CONTENT SECURITY POLICY ====================

export const setupCSP = () => {
    // Skip CSP in development to avoid Firebase auth issues
    if (import.meta.env.DEV) {
        console.log('[Security] Skipping CSP in development mode');
        return;
    }

    // Add CSP meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com https://*.firebaseapp.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;
      font-src 'self' data: https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.cloudinary.com https://*.imagekit.io https://*.gumlet.io wss://*.firebaseio.com https://*.ingest.sentry.io https://*.sentry.io;
      frame-src 'self' https://www.google.com https://*.firebaseapp.com;
      worker-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim();

        document.head.appendChild(meta);
        console.log('[Security] CSP enabled for production');
    }
};

// ==================== XSS PROTECTION ====================

export const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// ==================== USAGE EXAMPLES ====================

/*
// Rate limiting example:
try {
  rateLimits.moderate(currentUser.uid, 'post_job');
  await postJob(jobData);
} catch (error) {
  showError(error.message); // "Rate limit exceeded. Please try again in 45 seconds."
}

// Input sanitization example:
const cleanContent = sanitize.html(userInput);
const cleanEmail = sanitize.email(emailInput);

// CSRF protection example:
const response = await secureFetch('/api/jobs', {
  method: 'POST',
  body: JSON.stringify(jobData),
});

// Validation example:
const passwordCheck = validate.password(password);
if (!passwordCheck.valid) {
  showErrors(passwordCheck.errors);
}
*/

export default {
    rateLimiter,
    rateLimit,
    rateLimits,
    sanitize,
    validate,
    csrf,
    secureFetch,
    setupCSP,
    escapeHtml,
};
