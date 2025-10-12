import { z } from 'zod';

/**
 * Схема валидации email
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format');

/**
 * Схема валидации пароля
 * - Минимум 8 символов
 * - Минимум 1 буква
 * - Минимум 1 цифра
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

/**
 * Схема для формы регистрации
 */
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Схема для формы входа
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Типы для форм
 */
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;

