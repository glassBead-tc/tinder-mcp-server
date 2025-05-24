/**
 * Authentication Schema
 *
 * Defines validation schemas for authentication-related API endpoints.
 */
import { z } from 'zod';
/**
 * Login request schema
 */
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    deviceInfo: z.ZodOptional<z.ZodObject<{
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
}, {}, {}>;
/**
 * Login response schema
 */
export declare const loginResponseSchema: z.ZodObject<{
    token: z.ZodString;
    refreshToken: z.ZodString;
    expiresAt: z.ZodNumber;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        profileComplete: z.ZodOptional<z.ZodBoolean>;
        emailVerified: z.ZodOptional<z.ZodBoolean>;
        phoneVerified: z.ZodOptional<z.ZodBoolean>;
        twoFactorEnabled: z.ZodOptional<z.ZodBoolean>;
    }, {}, {}>;
    sessionId: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Refresh token request schema
 */
export declare const refreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        deviceId: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodOptional<z.ZodEnum<{
            other: "other";
            mobile: "mobile";
            tablet: "tablet";
            desktop: "desktop";
        }>>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * Refresh token response schema
 */
export declare const refreshTokenResponseSchema: z.ZodObject<{
    token: z.ZodString;
    refreshToken: z.ZodString;
    expiresAt: z.ZodNumber;
}, {}, {}>;
/**
 * SMS request schema
 */
export declare const smsRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    purpose: z.ZodDefault<z.ZodEnum<{
        login: "login";
        verification: "verification";
        password_reset: "password_reset";
    }>>;
}, {}, {}>;
/**
 * SMS response schema
 */
export declare const smsResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        success: "success";
    }>;
    otpLength: z.ZodNumber;
    expiresIn: z.ZodNumber;
    attemptsRemaining: z.ZodOptional<z.ZodNumber>;
}, {}, {}>;
/**
 * OTP verification request schema
 */
export declare const otpVerificationRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    otp: z.ZodString;
    purpose: z.ZodDefault<z.ZodEnum<{
        login: "login";
        verification: "verification";
        password_reset: "password_reset";
    }>>;
}, {}, {}>;
/**
 * OTP verification response schema
 */
export declare const otpVerificationResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        verified: "verified";
        invalid: "invalid";
        expired: "expired";
    }>;
    token: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    isNewUser: z.ZodOptional<z.ZodBoolean>;
}, {}, {}>;
/**
 * Facebook auth request schema
 */
export declare const facebookAuthRequestSchema: z.ZodObject<{
    accessToken: z.ZodString;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        deviceId: z.ZodOptional<z.ZodString>;
        deviceType: z.ZodOptional<z.ZodEnum<{
            other: "other";
            mobile: "mobile";
            tablet: "tablet";
            desktop: "desktop";
        }>>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * Facebook auth response schema
 */
export declare const facebookAuthResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        authenticated: "authenticated";
        onboarding_required: "onboarding_required";
    }>;
    token: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    onboardingToken: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    isNewUser: z.ZodOptional<z.ZodBoolean>;
}, {}, {}>;
/**
 * Password reset request schema
 */
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, {}, {}>;
/**
 * Password reset response schema
 */
export declare const passwordResetResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        success: "success";
    }>;
    message: z.ZodString;
}, {}, {}>;
/**
 * Password reset confirmation schema
 */
export declare const passwordResetConfirmSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, {}, {}>;
/**
 * Password reset confirmation response schema
 */
export declare const passwordResetConfirmResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        success: "success";
    }>;
    message: z.ZodString;
}, {}, {}>;
/**
 * Logout request schema
 */
export declare const logoutRequestSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    allSessions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, {}, {}>;
/**
 * Logout response schema
 */
export declare const logoutResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        success: "success";
    }>;
    message: z.ZodString;
}, {}, {}>;
/**
 * Two-factor setup request schema
 */
export declare const twoFactorSetupRequestSchema: z.ZodObject<{
    method: z.ZodEnum<{
        app: "app";
        email: "email";
        sms: "sms";
    }>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Two-factor setup response schema
 */
export declare const twoFactorSetupResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        setup_initiated: "setup_initiated";
    }>;
    secret: z.ZodOptional<z.ZodString>;
    qrCodeUrl: z.ZodOptional<z.ZodString>;
    backupCodes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    message: z.ZodString;
}, {}, {}>;
/**
 * Two-factor verification request schema
 */
export declare const twoFactorVerificationRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    method: z.ZodEnum<{
        app: "app";
        email: "email";
        sms: "sms";
    }>;
    code: z.ZodString;
}, {}, {}>;
/**
 * Two-factor verification response schema
 */
export declare const twoFactorVerificationResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        verified: "verified";
        invalid: "invalid";
        expired: "expired";
    }>;
    token: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
}, {}, {}>;
/**
 * Error response schema
 */
export declare const errorResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"error">;
    code: z.ZodNumber;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodAny>;
}, {}, {}>;
/**
 * Register schemas with the registry
 */
export declare function registerAuthSchemas(): void;
declare const _default: {
    loginRequestSchema: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        deviceInfo: z.ZodOptional<z.ZodObject<{
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
    }, {}, {}>;
    refreshTokenRequestSchema: z.ZodObject<{
        refreshToken: z.ZodString;
        deviceInfo: z.ZodOptional<z.ZodObject<{
            deviceId: z.ZodOptional<z.ZodString>;
            deviceType: z.ZodOptional<z.ZodEnum<{
                other: "other";
                mobile: "mobile";
                tablet: "tablet";
                desktop: "desktop";
            }>>;
        }, {}, {}>>;
    }, {}, {}>;
    smsRequestSchema: z.ZodObject<{
        phoneNumber: z.ZodString;
        purpose: z.ZodDefault<z.ZodEnum<{
            login: "login";
            verification: "verification";
            password_reset: "password_reset";
        }>>;
    }, {}, {}>;
    otpVerificationRequestSchema: z.ZodObject<{
        phoneNumber: z.ZodString;
        otp: z.ZodString;
        purpose: z.ZodDefault<z.ZodEnum<{
            login: "login";
            verification: "verification";
            password_reset: "password_reset";
        }>>;
    }, {}, {}>;
    facebookAuthRequestSchema: z.ZodObject<{
        accessToken: z.ZodString;
        deviceInfo: z.ZodOptional<z.ZodObject<{
            deviceId: z.ZodOptional<z.ZodString>;
            deviceType: z.ZodOptional<z.ZodEnum<{
                other: "other";
                mobile: "mobile";
                tablet: "tablet";
                desktop: "desktop";
            }>>;
        }, {}, {}>>;
    }, {}, {}>;
    passwordResetRequestSchema: z.ZodObject<{
        email: z.ZodString;
    }, {}, {}>;
    passwordResetConfirmSchema: z.ZodObject<{
        token: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
    }, {}, {}>;
    logoutRequestSchema: z.ZodObject<{
        sessionId: z.ZodOptional<z.ZodString>;
        allSessions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, {}, {}>;
    twoFactorSetupRequestSchema: z.ZodObject<{
        method: z.ZodEnum<{
            app: "app";
            email: "email";
            sms: "sms";
        }>;
        phoneNumber: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    twoFactorVerificationRequestSchema: z.ZodObject<{
        userId: z.ZodString;
        method: z.ZodEnum<{
            app: "app";
            email: "email";
            sms: "sms";
        }>;
        code: z.ZodString;
    }, {}, {}>;
    loginResponseSchema: z.ZodObject<{
        token: z.ZodString;
        refreshToken: z.ZodString;
        expiresAt: z.ZodNumber;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            name: z.ZodString;
            phoneNumber: z.ZodOptional<z.ZodString>;
            profileComplete: z.ZodOptional<z.ZodBoolean>;
            emailVerified: z.ZodOptional<z.ZodBoolean>;
            phoneVerified: z.ZodOptional<z.ZodBoolean>;
            twoFactorEnabled: z.ZodOptional<z.ZodBoolean>;
        }, {}, {}>;
        sessionId: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    refreshTokenResponseSchema: z.ZodObject<{
        token: z.ZodString;
        refreshToken: z.ZodString;
        expiresAt: z.ZodNumber;
    }, {}, {}>;
    smsResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            error: "error";
            success: "success";
        }>;
        otpLength: z.ZodNumber;
        expiresIn: z.ZodNumber;
        attemptsRemaining: z.ZodOptional<z.ZodNumber>;
    }, {}, {}>;
    otpVerificationResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            verified: "verified";
            invalid: "invalid";
            expired: "expired";
        }>;
        token: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        isNewUser: z.ZodOptional<z.ZodBoolean>;
    }, {}, {}>;
    facebookAuthResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            authenticated: "authenticated";
            onboarding_required: "onboarding_required";
        }>;
        token: z.ZodOptional<z.ZodString>;
        refreshToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        onboardingToken: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        isNewUser: z.ZodOptional<z.ZodBoolean>;
    }, {}, {}>;
    passwordResetResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            error: "error";
            success: "success";
        }>;
        message: z.ZodString;
    }, {}, {}>;
    passwordResetConfirmResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            error: "error";
            success: "success";
        }>;
        message: z.ZodString;
    }, {}, {}>;
    logoutResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            error: "error";
            success: "success";
        }>;
        message: z.ZodString;
    }, {}, {}>;
    twoFactorSetupResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            error: "error";
            setup_initiated: "setup_initiated";
        }>;
        secret: z.ZodOptional<z.ZodString>;
        qrCodeUrl: z.ZodOptional<z.ZodString>;
        backupCodes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        message: z.ZodString;
    }, {}, {}>;
    twoFactorVerificationResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            verified: "verified";
            invalid: "invalid";
            expired: "expired";
        }>;
        token: z.ZodOptional<z.ZodString>;
        message: z.ZodString;
    }, {}, {}>;
    errorResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"error">;
        code: z.ZodNumber;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, {}, {}>;
    registerAuthSchemas: typeof registerAuthSchemas;
};
export default _default;
