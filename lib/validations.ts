import * as z from "zod";

// Checkout Form Schema
export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  addressLine1: z.string().min(2, "Address Line 1 is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  addressLine3: z.string().optional().or(z.literal("")),
  district: z.string().min(2, "District is required"),
  city: z.string().min(2, "City is required"),
  nearestCity: z.string().min(2, "Nearest City is required"),
  phone: z.string().regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0 (e.g., 0712345678)"),
  email: z.string().email("Please enter a valid email address"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  billingSameAsShipping: z.boolean(),
  billingAddressLine1: z.string().optional(),
  billingCity: z.string().optional(),
  billingPhone: z.string().optional(),
  paymentMethod: z.enum(["cod", "mintpay", "koko", "payzy", "onepay"]),
  _honeypot: z.string().optional(),
  deviceFingerprint: z.string().optional(),
  turnstileToken: z.string().optional(),
}).strict().superRefine((data, ctx) => {
  if (!data.billingSameAsShipping) {
    if (!data.billingAddressLine1 || data.billingAddressLine1.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing address is required",
        path: ["billingAddressLine1"],
      });
    }
    if (!data.billingCity || data.billingCity.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing city is required",
        path: ["billingCity"],
      });
    }
    if (!data.billingPhone || !/^0\d{9}$/.test(data.billingPhone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid 10-digit billing phone number starting with 0 is required",
        path: ["billingPhone"],
      });
    }
  }
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Auth Forms Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().optional(),
  _honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
}).strict();

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  businessName: z.string().optional().or(z.literal("")),
  businessType: z.string().optional().or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  _honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  _honeypot: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema with OTP Verification
export const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    otp: z.string().min(6, "Verification code must be 6 digits"),
    resetToken: z.string().optional(),
    password: z.string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    _honeypot: z.string().optional(),
    turnstileToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    _honeypot: z.string().optional(),
    turnstileToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// POS Customer Entry Schema
export const posCustomerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0 (e.g., 0712345678)"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
}).strict();

export type POSCustomerFormData = z.infer<typeof posCustomerSchema>;

// Admin Create Product Schema (Oil & Non-Oil Retail)
export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  productType: z.enum([
    "LUBRICANT",
    "FILTER",
    "BATTERY",
    "CAR_CARE",
    "SPARE_PART",
    "ACCESSORY",
    "SERVICE",
    "GENERAL"
  ]).default("LUBRICANT"),
  brand: z.string().optional(),
  viscosity: z.string().optional(),
  oilType: z.string().optional(),
  apiStandard: z.string().optional(),
  partNumber: z.string().optional(),
  compatibleVehicles: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  collection: z.string().optional(),
  basePrice: z.string().min(1, "Base price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a valid positive number"),
  compareAtPrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), "Must be a valid positive number or empty"),
  costPrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), "Must be a valid positive number or empty"),
  wholesalePrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), "Must be a valid positive number or empty"),
  packUnit: z.string().optional(),
  unitVolumeLiters: z.string().optional(),
  tags: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  sizeGuideEnabled: z.boolean().optional(),
  sizeGuideContent: z.string().optional(),
  sizeGuideImageUrl: z.string().optional(),
}).strip();

export type CreateProductFormData = z.infer<typeof createProductSchema>;

