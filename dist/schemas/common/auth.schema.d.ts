/**
 * Authentication Data Schemas
 *
 * Defines validation schemas for authentication-related data.
 */
import { z } from 'zod';
/**
 * Token data schema
 */
export declare const tokenDataSchema: z.ZodObject<{
    apiToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresAt: z.ZodNumber;
}, {}, {}>;
/**
 * OAuth provider schema
 */
export declare const oauthProviderSchema: z.ZodEnum<{
    facebook: "facebook";
    google: "google";
    apple: "apple";
}>;
/**
 * OAuth token schema
 */
export declare const oauthTokenSchema: z.ZodObject<{
    provider: z.ZodEnum<{
        facebook: "facebook";
        google: "google";
        apple: "apple";
    }>;
    providerUserId: z.ZodString;
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    scope: z.ZodOptional<z.ZodString>;
    tokenType: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Two-factor authentication method schema
 */
export declare const twoFactorMethodSchema: z.ZodEnum<{
    app: "app";
    email: "email";
    sms: "sms";
}>;
/**
 * Two-factor authentication data schema
 */
export declare const twoFactorDataSchema: z.ZodObject<{
    userId: z.ZodString;
    method: z.ZodEnum<{
        app: "app";
        email: "email";
        sms: "sms";
    }>;
    secret: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
    backupCodes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    lastUsed: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * OTP (One-Time Password) schema
 */
export declare const otpSchema: z.ZodObject<{
    userId: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
    purpose: z.ZodEnum<{
        login: "login";
        verification: "verification";
        password_reset: "password_reset";
    }>;
    expiresAt: z.ZodNumber;
    attempts: z.ZodDefault<z.ZodNumber>;
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    verified: z.ZodDefault<z.ZodBoolean>;
}, {}, {}>;
/**
 * Session schema
 */
export declare const sessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        userAgent: z.ZodOptional<z.ZodString>;
        ip: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodOptional<z.ZodEnum<{
            other: "other";
            mobile: "mobile";
            tablet: "tablet";
            desktop: "desktop";
        }>>;
        osName: z.ZodOptional<z.ZodString>;
        osVersion: z.ZodOptional<z.ZodString>;
        browserName: z.ZodOptional<z.ZodString>;
        browserVersion: z.ZodOptional<z.ZodString>;
    }, {}, {}>>;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
    lastActiveAt: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, {}, {}>;
/**
 * Password reset schema
 */
export declare const passwordResetSchema: z.ZodObject<{
    userId: z.ZodString;
    token: z.ZodString;
    expiresAt: z.ZodNumber;
    used: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
}, {}, {}>;
/**
 * Register schemas with the registry
 */
export declare function registerAuthDataSchemas(): void;
declare const _default: {
    tokenDataSchema: z.ZodObject<{
        apiToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresAt: z.ZodNumber;
    }, {}, {}>;
    oauthProviderSchema: z.ZodEnum<{
        facebook: "facebook";
        google: "google";
        apple: "apple";
    }>;
    oauthTokenSchema: z.ZodObject<{
        provider: z.ZodEnum<{
            facebook: "facebook";
            google: "google";
            apple: "apple";
        }>;
        providerUserId: z.ZodString;
        accessToken: z.ZodString;
        refreshToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        scope: z.ZodOptional<z.ZodString>;
        tokenType: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    twoFactorMethodSchema: z.ZodEnum<{
        app: "app";
        email: "email";
        sms: "sms";
    }>;
    twoFactorDataSchema: z.ZodObject<{
        userId: z.ZodString;
        method: z.ZodEnum<{
            app: "app";
            email: "email";
            sms: "sms";
        }>;
        secret: z.ZodOptional<z.ZodString>;
        verified: z.ZodDefault<z.ZodBoolean>;
        backupCodes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        lastUsed: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    otpSchema: z.ZodObject<{
        userId: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        code: z.ZodString;
        purpose: z.ZodEnum<{
            login: "login";
            verification: "verification";
            password_reset: "password_reset";
        }>;
        expiresAt: z.ZodNumber;
        attempts: z.ZodDefault<z.ZodNumber>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        verified: z.ZodDefault<z.ZodBoolean>;
    }, {}, {}>;
    sessionSchema: z.ZodObject<{
        sessionId: z.ZodString;
        userId: z.ZodString;
        deviceInfo: z.ZodOptional<z.ZodObject<{
            userAgent: z.ZodOptional<z.ZodString>;
            ip: z.ZodOptional<z.ZodString>;
            deviceId: z.ZodOptional<z.ZodString>;
            deviceType: z.ZodOptional<z.ZodEnum<{
                other: "other";
                mobile: "mobile";
                tablet: "tablet";
                desktop: "desktop";
            }>>;
            osName: z.ZodOptional<z.ZodString>;
            osVersion: z.ZodOptional<z.ZodString>;
            browserName: z.ZodOptional<z.ZodString>;
            browserVersion: z.ZodOptional<z.ZodString>;
        }, {}, {}>>;
        createdAt: z.ZodString;
        expiresAt: z.ZodString;
        lastActiveAt: z.ZodString;
        isActive: z.ZodDefault<z.ZodBoolean>;
    }, {}, {}>;
    passwordResetSchema: z.ZodObject<{
        userId: z.ZodString;
        token: z.ZodString;
        expiresAt: z.ZodNumber;
        used: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
    }, {}, {}>;
    registerAuthDataSchemas: typeof registerAuthDataSchemas;
};
export default _default;
