/**
 * User Schema
 *
 * Defines validation schemas for user-related data.
 */
import { z } from 'zod';
/**
 * User ID schema
 */
export declare const userIdSchema: z.ZodString;
/**
 * User name schema
 */
export declare const userNameSchema: z.ZodString;
/**
 * User email schema
 */
export declare const userEmailSchema: z.ZodString;
/**
 * User password schema
 */
export declare const userPasswordSchema: z.ZodString;
/**
 * Phone number schema
 */
export declare const phoneNumberSchema: z.ZodString;
/**
 * Gender schema
 */
export declare const genderSchema: z.ZodEnum<{
    male: "male";
    female: "female";
    other: "other";
    prefer_not_to_say: "prefer_not_to_say";
}>;
/**
 * Location schema
 */
export declare const locationSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Photo schema
 */
export declare const photoSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    isMain: z.ZodDefault<z.ZodBoolean>;
    processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        height: z.ZodNumber;
        width: z.ZodNumber;
    }, {}, {}>>>;
}, {}, {}>;
/**
 * User profile schema
 */
export declare const userProfileSchema: z.ZodObject<{
    bio: z.ZodOptional<z.ZodString>;
    birthDate: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        male: "male";
        female: "female";
        other: "other";
        prefer_not_to_say: "prefer_not_to_say";
    }>>;
    location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
    }, {}, {}>]>>;
    interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
    photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        isMain: z.ZodDefault<z.ZodBoolean>;
        processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            height: z.ZodNumber;
            width: z.ZodNumber;
        }, {}, {}>>>;
    }, {}, {}>>>;
    occupation: z.ZodOptional<z.ZodString>;
    education: z.ZodOptional<z.ZodString>;
    relationshipGoals: z.ZodOptional<z.ZodEnum<{
        casual: "casual";
        relationship: "relationship";
        marriage: "marriage";
        not_sure: "not_sure";
    }>>;
    height: z.ZodOptional<z.ZodNumber>;
    drinking: z.ZodOptional<z.ZodEnum<{
        never: "never";
        rarely: "rarely";
        socially: "socially";
        frequently: "frequently";
    }>>;
    smoking: z.ZodOptional<z.ZodEnum<{
        never: "never";
        socially: "socially";
        regularly: "regularly";
    }>>;
    children: z.ZodOptional<z.ZodEnum<{
        have: "have";
        dont_have: "dont_have";
        want_someday: "want_someday";
        dont_want: "dont_want";
    }>>;
    zodiacSign: z.ZodOptional<z.ZodEnum<{
        aries: "aries";
        taurus: "taurus";
        gemini: "gemini";
        cancer: "cancer";
        leo: "leo";
        virgo: "virgo";
        libra: "libra";
        scorpio: "scorpio";
        sagittarius: "sagittarius";
        capricorn: "capricorn";
        aquarius: "aquarius";
        pisces: "pisces";
    }>>;
    lastActive: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * User preferences schema
 */
export declare const userPreferencesSchema: z.ZodObject<{
    ageRange: z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, {}, {}>;
    distanceMax: z.ZodNumber;
    genderPreference: z.ZodArray<z.ZodEnum<{
        male: "male";
        female: "female";
        other: "other";
        prefer_not_to_say: "prefer_not_to_say";
    }>>;
    hideProfile: z.ZodDefault<z.ZodBoolean>;
    showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
    autoplayVideos: z.ZodDefault<z.ZodBoolean>;
    notifications: z.ZodObject<{
        matches: z.ZodDefault<z.ZodBoolean>;
        messages: z.ZodDefault<z.ZodBoolean>;
        likes: z.ZodDefault<z.ZodBoolean>;
    }, {}, {}>;
}, {}, {}>;
/**
 * User creation schema
 */
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodObject<{
        bio: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
        }, {}, {}>]>>;
        interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
            isMain: z.ZodDefault<z.ZodBoolean>;
            processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                height: z.ZodNumber;
                width: z.ZodNumber;
            }, {}, {}>>>;
        }, {}, {}>>>;
        occupation: z.ZodOptional<z.ZodString>;
        education: z.ZodOptional<z.ZodString>;
        relationshipGoals: z.ZodOptional<z.ZodEnum<{
            casual: "casual";
            relationship: "relationship";
            marriage: "marriage";
            not_sure: "not_sure";
        }>>;
        height: z.ZodOptional<z.ZodNumber>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            rarely: "rarely";
            socially: "socially";
            frequently: "frequently";
        }>>;
        smoking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        children: z.ZodOptional<z.ZodEnum<{
            have: "have";
            dont_have: "dont_have";
            want_someday: "want_someday";
            dont_want: "dont_want";
        }>>;
        zodiacSign: z.ZodOptional<z.ZodEnum<{
            aries: "aries";
            taurus: "taurus";
            gemini: "gemini";
            cancer: "cancer";
            leo: "leo";
            virgo: "virgo";
            libra: "libra";
            scorpio: "scorpio";
            sagittarius: "sagittarius";
            capricorn: "capricorn";
            aquarius: "aquarius";
            pisces: "pisces";
        }>>;
        lastActive: z.ZodOptional<z.ZodString>;
    }, {}, {}>>;
    preferences: z.ZodOptional<z.ZodObject<{
        ageRange: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, {}, {}>;
        distanceMax: z.ZodNumber;
        genderPreference: z.ZodArray<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        hideProfile: z.ZodDefault<z.ZodBoolean>;
        showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
        autoplayVideos: z.ZodDefault<z.ZodBoolean>;
        notifications: z.ZodObject<{
            matches: z.ZodDefault<z.ZodBoolean>;
            messages: z.ZodDefault<z.ZodBoolean>;
            likes: z.ZodDefault<z.ZodBoolean>;
        }, {}, {}>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * User update schema
 */
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodObject<{
        bio: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
        }, {}, {}>]>>;
        interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
            isMain: z.ZodDefault<z.ZodBoolean>;
            processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                height: z.ZodNumber;
                width: z.ZodNumber;
            }, {}, {}>>>;
        }, {}, {}>>>;
        occupation: z.ZodOptional<z.ZodString>;
        education: z.ZodOptional<z.ZodString>;
        relationshipGoals: z.ZodOptional<z.ZodEnum<{
            casual: "casual";
            relationship: "relationship";
            marriage: "marriage";
            not_sure: "not_sure";
        }>>;
        height: z.ZodOptional<z.ZodNumber>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            rarely: "rarely";
            socially: "socially";
            frequently: "frequently";
        }>>;
        smoking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        children: z.ZodOptional<z.ZodEnum<{
            have: "have";
            dont_have: "dont_have";
            want_someday: "want_someday";
            dont_want: "dont_want";
        }>>;
        zodiacSign: z.ZodOptional<z.ZodEnum<{
            aries: "aries";
            taurus: "taurus";
            gemini: "gemini";
            cancer: "cancer";
            leo: "leo";
            virgo: "virgo";
            libra: "libra";
            scorpio: "scorpio";
            sagittarius: "sagittarius";
            capricorn: "capricorn";
            aquarius: "aquarius";
            pisces: "pisces";
        }>>;
        lastActive: z.ZodOptional<z.ZodString>;
    }, {}, {}>>;
    preferences: z.ZodOptional<z.ZodObject<{
        ageRange: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, {}, {}>;
        distanceMax: z.ZodNumber;
        genderPreference: z.ZodArray<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        hideProfile: z.ZodDefault<z.ZodBoolean>;
        showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
        autoplayVideos: z.ZodDefault<z.ZodBoolean>;
        notifications: z.ZodObject<{
            matches: z.ZodDefault<z.ZodBoolean>;
            messages: z.ZodDefault<z.ZodBoolean>;
            likes: z.ZodDefault<z.ZodBoolean>;
        }, {}, {}>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * User login schema
 */
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, {}, {}>;
/**
 * User authentication data schema
 */
export declare const userAuthDataSchema: z.ZodObject<{
    userId: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    passwordHash: z.ZodString;
    passwordSalt: z.ZodString;
    lastLogin: z.ZodOptional<z.ZodString>;
    failedLoginAttempts: z.ZodDefault<z.ZodNumber>;
    accountLocked: z.ZodDefault<z.ZodBoolean>;
    accountLockedUntil: z.ZodOptional<z.ZodString>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    phoneVerified: z.ZodDefault<z.ZodBoolean>;
    twoFactorEnabled: z.ZodDefault<z.ZodBoolean>;
    twoFactorMethod: z.ZodOptional<z.ZodEnum<{
        app: "app";
        email: "email";
        sms: "sms";
    }>>;
}, {}, {}>;
/**
 * Register schemas with the registry
 */
export declare function registerUserSchemas(): void;
declare const _default: {
    userIdSchema: z.ZodString;
    userNameSchema: z.ZodString;
    userEmailSchema: z.ZodString;
    userPasswordSchema: z.ZodString;
    phoneNumberSchema: z.ZodString;
    genderSchema: z.ZodEnum<{
        male: "male";
        female: "female";
        other: "other";
        prefer_not_to_say: "prefer_not_to_say";
    }>;
    locationSchema: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    photoSchema: z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        isMain: z.ZodDefault<z.ZodBoolean>;
        processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            height: z.ZodNumber;
            width: z.ZodNumber;
        }, {}, {}>>>;
    }, {}, {}>;
    userProfileSchema: z.ZodObject<{
        bio: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            name: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
        }, {}, {}>]>>;
        interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
            isMain: z.ZodDefault<z.ZodBoolean>;
            processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                height: z.ZodNumber;
                width: z.ZodNumber;
            }, {}, {}>>>;
        }, {}, {}>>>;
        occupation: z.ZodOptional<z.ZodString>;
        education: z.ZodOptional<z.ZodString>;
        relationshipGoals: z.ZodOptional<z.ZodEnum<{
            casual: "casual";
            relationship: "relationship";
            marriage: "marriage";
            not_sure: "not_sure";
        }>>;
        height: z.ZodOptional<z.ZodNumber>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            rarely: "rarely";
            socially: "socially";
            frequently: "frequently";
        }>>;
        smoking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        children: z.ZodOptional<z.ZodEnum<{
            have: "have";
            dont_have: "dont_have";
            want_someday: "want_someday";
            dont_want: "dont_want";
        }>>;
        zodiacSign: z.ZodOptional<z.ZodEnum<{
            aries: "aries";
            taurus: "taurus";
            gemini: "gemini";
            cancer: "cancer";
            leo: "leo";
            virgo: "virgo";
            libra: "libra";
            scorpio: "scorpio";
            sagittarius: "sagittarius";
            capricorn: "capricorn";
            aquarius: "aquarius";
            pisces: "pisces";
        }>>;
        lastActive: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    userPreferencesSchema: z.ZodObject<{
        ageRange: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, {}, {}>;
        distanceMax: z.ZodNumber;
        genderPreference: z.ZodArray<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
            prefer_not_to_say: "prefer_not_to_say";
        }>>;
        hideProfile: z.ZodDefault<z.ZodBoolean>;
        showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
        autoplayVideos: z.ZodDefault<z.ZodBoolean>;
        notifications: z.ZodObject<{
            matches: z.ZodDefault<z.ZodBoolean>;
            messages: z.ZodDefault<z.ZodBoolean>;
            likes: z.ZodDefault<z.ZodBoolean>;
        }, {}, {}>;
    }, {}, {}>;
    createUserSchema: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodObject<{
            bio: z.ZodOptional<z.ZodString>;
            birthDate: z.ZodOptional<z.ZodString>;
            gender: z.ZodOptional<z.ZodEnum<{
                male: "male";
                female: "female";
                other: "other";
                prefer_not_to_say: "prefer_not_to_say";
            }>>;
            location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
                city: z.ZodOptional<z.ZodString>;
                country: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodOptional<z.ZodString>;
            }, {}, {}>]>>;
            interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
            photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                url: z.ZodString;
                isMain: z.ZodDefault<z.ZodBoolean>;
                processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    url: z.ZodString;
                    height: z.ZodNumber;
                    width: z.ZodNumber;
                }, {}, {}>>>;
            }, {}, {}>>>;
            occupation: z.ZodOptional<z.ZodString>;
            education: z.ZodOptional<z.ZodString>;
            relationshipGoals: z.ZodOptional<z.ZodEnum<{
                casual: "casual";
                relationship: "relationship";
                marriage: "marriage";
                not_sure: "not_sure";
            }>>;
            height: z.ZodOptional<z.ZodNumber>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                rarely: "rarely";
                socially: "socially";
                frequently: "frequently";
            }>>;
            smoking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            children: z.ZodOptional<z.ZodEnum<{
                have: "have";
                dont_have: "dont_have";
                want_someday: "want_someday";
                dont_want: "dont_want";
            }>>;
            zodiacSign: z.ZodOptional<z.ZodEnum<{
                aries: "aries";
                taurus: "taurus";
                gemini: "gemini";
                cancer: "cancer";
                leo: "leo";
                virgo: "virgo";
                libra: "libra";
                scorpio: "scorpio";
                sagittarius: "sagittarius";
                capricorn: "capricorn";
                aquarius: "aquarius";
                pisces: "pisces";
            }>>;
            lastActive: z.ZodOptional<z.ZodString>;
        }, {}, {}>>;
        preferences: z.ZodOptional<z.ZodObject<{
            ageRange: z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, {}, {}>;
            distanceMax: z.ZodNumber;
            genderPreference: z.ZodArray<z.ZodEnum<{
                male: "male";
                female: "female";
                other: "other";
                prefer_not_to_say: "prefer_not_to_say";
            }>>;
            hideProfile: z.ZodDefault<z.ZodBoolean>;
            showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
            autoplayVideos: z.ZodDefault<z.ZodBoolean>;
            notifications: z.ZodObject<{
                matches: z.ZodDefault<z.ZodBoolean>;
                messages: z.ZodDefault<z.ZodBoolean>;
                likes: z.ZodDefault<z.ZodBoolean>;
            }, {}, {}>;
        }, {}, {}>>;
    }, {}, {}>;
    updateUserSchema: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phoneNumber: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodObject<{
            bio: z.ZodOptional<z.ZodString>;
            birthDate: z.ZodOptional<z.ZodString>;
            gender: z.ZodOptional<z.ZodEnum<{
                male: "male";
                female: "female";
                other: "other";
                prefer_not_to_say: "prefer_not_to_say";
            }>>;
            location: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
                name: z.ZodOptional<z.ZodString>;
                city: z.ZodOptional<z.ZodString>;
                country: z.ZodOptional<z.ZodString>;
                postalCode: z.ZodOptional<z.ZodString>;
            }, {}, {}>]>>;
            interests: z.ZodOptional<z.ZodArray<z.ZodString>>;
            photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                url: z.ZodString;
                isMain: z.ZodDefault<z.ZodBoolean>;
                processedFiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    url: z.ZodString;
                    height: z.ZodNumber;
                    width: z.ZodNumber;
                }, {}, {}>>>;
            }, {}, {}>>>;
            occupation: z.ZodOptional<z.ZodString>;
            education: z.ZodOptional<z.ZodString>;
            relationshipGoals: z.ZodOptional<z.ZodEnum<{
                casual: "casual";
                relationship: "relationship";
                marriage: "marriage";
                not_sure: "not_sure";
            }>>;
            height: z.ZodOptional<z.ZodNumber>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                rarely: "rarely";
                socially: "socially";
                frequently: "frequently";
            }>>;
            smoking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            children: z.ZodOptional<z.ZodEnum<{
                have: "have";
                dont_have: "dont_have";
                want_someday: "want_someday";
                dont_want: "dont_want";
            }>>;
            zodiacSign: z.ZodOptional<z.ZodEnum<{
                aries: "aries";
                taurus: "taurus";
                gemini: "gemini";
                cancer: "cancer";
                leo: "leo";
                virgo: "virgo";
                libra: "libra";
                scorpio: "scorpio";
                sagittarius: "sagittarius";
                capricorn: "capricorn";
                aquarius: "aquarius";
                pisces: "pisces";
            }>>;
            lastActive: z.ZodOptional<z.ZodString>;
        }, {}, {}>>;
        preferences: z.ZodOptional<z.ZodObject<{
            ageRange: z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, {}, {}>;
            distanceMax: z.ZodNumber;
            genderPreference: z.ZodArray<z.ZodEnum<{
                male: "male";
                female: "female";
                other: "other";
                prefer_not_to_say: "prefer_not_to_say";
            }>>;
            hideProfile: z.ZodDefault<z.ZodBoolean>;
            showOnlyInAgeRange: z.ZodDefault<z.ZodBoolean>;
            autoplayVideos: z.ZodDefault<z.ZodBoolean>;
            notifications: z.ZodObject<{
                matches: z.ZodDefault<z.ZodBoolean>;
                messages: z.ZodDefault<z.ZodBoolean>;
                likes: z.ZodDefault<z.ZodBoolean>;
            }, {}, {}>;
        }, {}, {}>>;
    }, {}, {}>;
    userLoginSchema: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, {}, {}>;
    userAuthDataSchema: z.ZodObject<{
        userId: z.ZodString;
        email: z.ZodString;
        phoneNumber: z.ZodOptional<z.ZodString>;
        passwordHash: z.ZodString;
        passwordSalt: z.ZodString;
        lastLogin: z.ZodOptional<z.ZodString>;
        failedLoginAttempts: z.ZodDefault<z.ZodNumber>;
        accountLocked: z.ZodDefault<z.ZodBoolean>;
        accountLockedUntil: z.ZodOptional<z.ZodString>;
        emailVerified: z.ZodDefault<z.ZodBoolean>;
        phoneVerified: z.ZodDefault<z.ZodBoolean>;
        twoFactorEnabled: z.ZodDefault<z.ZodBoolean>;
        twoFactorMethod: z.ZodOptional<z.ZodEnum<{
            app: "app";
            email: "email";
            sms: "sms";
        }>>;
    }, {}, {}>;
    registerUserSchemas: typeof registerUserSchemas;
};
export default _default;
