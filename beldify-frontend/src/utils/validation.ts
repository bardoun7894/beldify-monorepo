import { z } from 'zod';

// Email validation
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .toLowerCase()
  .trim();

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Registration schema — phone-first contract.
// Required: full_name_en, phone, password, password_confirmation.
// Optional: email (omitted when not provided by the user).
// Legacy fields (first_name, last_name, username, contact_number) are still
// accepted via passthrough() for Google-auth and backward-compat paths.
// Username is generated server-side — never required from the client.
export const registrationSchema = z.object({
  full_name_en: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Name is too long')
    .trim(),
  phone: z.string()
    .min(6, 'Phone number is required')
    .max(30, 'Phone number is too long')
    .trim(),
  // Backend enforces Password::min(8) only; the form's strength meter is
  // advisory. Keep the proxy in sync so it never hard-blocks valid passwords.
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  password_confirmation: z.string(),
  // Email is optional — omit key entirely if not provided (never send empty string)
  email: z.string().email('Invalid email format').max(255).toLowerCase().trim().optional(),
// Forward any extra/legacy keys to Laravel rather than silently stripping them.
}).passthrough().refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Login schema — accepts phone OR email via `identifier` field.
// Also keeps `email` for backward-compat (sent alongside identifier).
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone or email is required').trim(),
  // Legacy field forwarded for older backend paths; mirrors identifier value.
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Validate and sanitize object
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: z.ZodError } {
  try {
    // Parse with Zod
    const validatedData = schema.parse(data);
    
    // Additional sanitization for string fields
    if (typeof validatedData === 'object' && validatedData !== null) {
      const sanitized = { ...validatedData };
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
          (sanitized as any)[key] = sanitizeInput(value);
        }
      }
      return { success: true, data: sanitized as T };
    }
    
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Common validation patterns
export const validationPatterns = {
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  lettersOnly: /^[a-zA-Z]+$/,
  numbersOnly: /^[0-9]+$/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9-]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// Validate request body size (prevent large payload attacks)
export function validateRequestSize(body: string, maxSizeKB: number = 100): boolean {
  const sizeInKB = new Blob([body]).size / 1024;
  return sizeInKB <= maxSizeKB;
}