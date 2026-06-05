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

// Registration schema — must mirror the actual register form payload
// (first_name/last_name/username/contact_number) and the Laravel backend
// contract (AuthController::register). Names allow non-ASCII (Arabic) input.
export const registrationSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'Name is too long')
    .trim(),
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Name is too long')
    .trim(),
  full_name_en: z.string().max(255, 'Name is too long').trim().optional(),
  username: z.string()
    .min(1, 'Username is required')
    .max(255, 'Username is too long')
    .trim(),
  email: emailSchema,
  // Backend enforces Password::min(8) only; the form's strength meter is
  // advisory. Keep the proxy in sync so it never hard-blocks valid passwords.
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  password_confirmation: z.string(),
  contact_number: z.string()
    .max(20, 'Phone number is too long')
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: 'Invalid phone number format'
    })
    .optional(),
// Forward any extra/legacy keys to Laravel rather than silently stripping them.
}).passthrough().refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
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