/**
 * User Interaction Schema
 *
 * Defines validation schemas for user interaction-related API endpoints.
 */
import { z } from 'zod';
/**
 * Interaction types
 */
export declare const interactionTypeSchema: z.ZodEnum<{
    like: "like";
    pass: "pass";
    superlike: "superlike";
    rewind: "rewind";
    boost: "boost";
}>;
/**
 * Like request schema
 */
export declare const likeRequestSchema: z.ZodObject<{
    targetUserId: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Like response schema
 */
export declare const likeResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        liked: "liked";
        matched: "matched";
    }>;
    matchId: z.ZodOptional<z.ZodString>;
    targetUser: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * Pass request schema
 */
export declare const passRequestSchema: z.ZodObject<{
    targetUserId: z.ZodString;
    reason: z.ZodOptional<z.ZodEnum<{
        other: "other";
        not_interested: "not_interested";
        inappropriate_content: "inappropriate_content";
        fake_profile: "fake_profile";
    }>>;
}, {}, {}>;
/**
 * Pass response schema
 */
export declare const passResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"passed">;
    targetUserId: z.ZodString;
}, {}, {}>;
/**
 * Super like request schema
 */
export declare const superLikeRequestSchema: z.ZodObject<{
    targetUserId: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
}, {}, {}>;
/**
 * Super like response schema
 */
export declare const superLikeResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        matched: "matched";
        superliked: "superliked";
    }>;
    matchId: z.ZodOptional<z.ZodString>;
    remaining: z.ZodNumber;
    resetAt: z.ZodOptional<z.ZodNumber>;
    targetUser: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, {}, {}>>;
}, {}, {}>;
/**
 * Rewind request schema
 */
export declare const rewindRequestSchema: z.ZodObject<{
    interactionId: z.ZodString;
    interactionType: z.ZodEnum<{
        like: "like";
        pass: "pass";
        superlike: "superlike";
        rewind: "rewind";
        boost: "boost";
    }>;
}, {}, {}>;
/**
 * Rewind response schema
 */
export declare const rewindResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"rewound">;
    remaining: z.ZodNumber;
    resetAt: z.ZodOptional<z.ZodNumber>;
}, {}, {}>;
/**
 * Boost request schema
 */
export declare const boostRequestSchema: z.ZodObject<{
    duration: z.ZodOptional<z.ZodNumber>;
}, {}, {}>;
/**
 * Boost response schema
 */
export declare const boostResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"boosted">;
    expiresAt: z.ZodNumber;
    remaining: z.ZodNumber;
    resetAt: z.ZodOptional<z.ZodNumber>;
}, {}, {}>;
/**
 * Match list request schema
 */
export declare const matchListRequestSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        recent: "recent";
        unread: "unread";
    }>>>;
}, {}, {}>;
/**
 * Match item schema
 */
export declare const matchItemSchema: z.ZodObject<{
    matchId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
    }, {}, {}>>>;
    lastMessage: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        sentAt: z.ZodString;
        isRead: z.ZodBoolean;
    }, {}, {}>>;
    matchedAt: z.ZodString;
    unreadCount: z.ZodDefault<z.ZodNumber>;
    isNew: z.ZodDefault<z.ZodBoolean>;
}, {}, {}>;
/**
 * Match list response schema
 */
export declare const matchListResponseSchema: z.ZodObject<{
    matches: z.ZodArray<z.ZodObject<{
        matchId: z.ZodString;
        userId: z.ZodString;
        name: z.ZodString;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
        }, {}, {}>>>;
        lastMessage: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            content: z.ZodString;
            sentAt: z.ZodString;
            isRead: z.ZodBoolean;
        }, {}, {}>>;
        matchedAt: z.ZodString;
        unreadCount: z.ZodDefault<z.ZodNumber>;
        isNew: z.ZodDefault<z.ZodBoolean>;
    }, {}, {}>>;
    total: z.ZodNumber;
    hasMore: z.ZodBoolean;
}, {}, {}>;
/**
 * Unmatch request schema
 */
export declare const unmatchRequestSchema: z.ZodObject<{
    matchId: z.ZodString;
    reason: z.ZodOptional<z.ZodEnum<{
        other: "other";
        not_interested: "not_interested";
        fake_profile: "fake_profile";
        inappropriate_behavior: "inappropriate_behavior";
    }>>;
    block: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, {}, {}>;
/**
 * Unmatch response schema
 */
export declare const unmatchResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"unmatched">;
    matchId: z.ZodString;
}, {}, {}>;
/**
 * Report user request schema
 */
export declare const reportUserRequestSchema: z.ZodObject<{
    targetUserId: z.ZodString;
    reason: z.ZodEnum<{
        other: "other";
        fake_profile: "fake_profile";
        inappropriate_photos: "inappropriate_photos";
        inappropriate_messages: "inappropriate_messages";
        offensive_behavior: "offensive_behavior";
        underage: "underage";
        spam: "spam";
    }>;
    details: z.ZodOptional<z.ZodString>;
    evidenceUrls: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, {}, {}>;
/**
 * Report user response schema
 */
export declare const reportUserResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"reported">;
    reportId: z.ZodString;
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
export declare function registerInteractionSchemas(): void;
declare const _default: {
    interactionTypeSchema: z.ZodEnum<{
        like: "like";
        pass: "pass";
        superlike: "superlike";
        rewind: "rewind";
        boost: "boost";
    }>;
    likeRequestSchema: z.ZodObject<{
        targetUserId: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    passRequestSchema: z.ZodObject<{
        targetUserId: z.ZodString;
        reason: z.ZodOptional<z.ZodEnum<{
            other: "other";
            not_interested: "not_interested";
            inappropriate_content: "inappropriate_content";
            fake_profile: "fake_profile";
        }>>;
    }, {}, {}>;
    superLikeRequestSchema: z.ZodObject<{
        targetUserId: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
    }, {}, {}>;
    rewindRequestSchema: z.ZodObject<{
        interactionId: z.ZodString;
        interactionType: z.ZodEnum<{
            like: "like";
            pass: "pass";
            superlike: "superlike";
            rewind: "rewind";
            boost: "boost";
        }>;
    }, {}, {}>;
    boostRequestSchema: z.ZodObject<{
        duration: z.ZodOptional<z.ZodNumber>;
    }, {}, {}>;
    matchListRequestSchema: z.ZodObject<{
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            recent: "recent";
            unread: "unread";
        }>>>;
    }, {}, {}>;
    unmatchRequestSchema: z.ZodObject<{
        matchId: z.ZodString;
        reason: z.ZodOptional<z.ZodEnum<{
            other: "other";
            not_interested: "not_interested";
            fake_profile: "fake_profile";
            inappropriate_behavior: "inappropriate_behavior";
        }>>;
        block: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, {}, {}>;
    reportUserRequestSchema: z.ZodObject<{
        targetUserId: z.ZodString;
        reason: z.ZodEnum<{
            other: "other";
            fake_profile: "fake_profile";
            inappropriate_photos: "inappropriate_photos";
            inappropriate_messages: "inappropriate_messages";
            offensive_behavior: "offensive_behavior";
            underage: "underage";
            spam: "spam";
        }>;
        details: z.ZodOptional<z.ZodString>;
        evidenceUrls: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, {}, {}>;
    likeResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            liked: "liked";
            matched: "matched";
        }>;
        matchId: z.ZodOptional<z.ZodString>;
        targetUser: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, {}, {}>>;
    }, {}, {}>;
    passResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"passed">;
        targetUserId: z.ZodString;
    }, {}, {}>;
    superLikeResponseSchema: z.ZodObject<{
        status: z.ZodEnum<{
            matched: "matched";
            superliked: "superliked";
        }>;
        matchId: z.ZodOptional<z.ZodString>;
        remaining: z.ZodNumber;
        resetAt: z.ZodOptional<z.ZodNumber>;
        targetUser: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, {}, {}>>;
    }, {}, {}>;
    rewindResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"rewound">;
        remaining: z.ZodNumber;
        resetAt: z.ZodOptional<z.ZodNumber>;
    }, {}, {}>;
    boostResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"boosted">;
        expiresAt: z.ZodNumber;
        remaining: z.ZodNumber;
        resetAt: z.ZodOptional<z.ZodNumber>;
    }, {}, {}>;
    matchItemSchema: z.ZodObject<{
        matchId: z.ZodString;
        userId: z.ZodString;
        name: z.ZodString;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
        }, {}, {}>>>;
        lastMessage: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            content: z.ZodString;
            sentAt: z.ZodString;
            isRead: z.ZodBoolean;
        }, {}, {}>>;
        matchedAt: z.ZodString;
        unreadCount: z.ZodDefault<z.ZodNumber>;
        isNew: z.ZodDefault<z.ZodBoolean>;
    }, {}, {}>;
    matchListResponseSchema: z.ZodObject<{
        matches: z.ZodArray<z.ZodObject<{
            matchId: z.ZodString;
            userId: z.ZodString;
            name: z.ZodString;
            photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                url: z.ZodString;
            }, {}, {}>>>;
            lastMessage: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                content: z.ZodString;
                sentAt: z.ZodString;
                isRead: z.ZodBoolean;
            }, {}, {}>>;
            matchedAt: z.ZodString;
            unreadCount: z.ZodDefault<z.ZodNumber>;
            isNew: z.ZodDefault<z.ZodBoolean>;
        }, {}, {}>>;
        total: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, {}, {}>;
    unmatchResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"unmatched">;
        matchId: z.ZodString;
    }, {}, {}>;
    reportUserResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"reported">;
        reportId: z.ZodString;
    }, {}, {}>;
    errorResponseSchema: z.ZodObject<{
        status: z.ZodLiteral<"error">;
        code: z.ZodNumber;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, {}, {}>;
    registerInteractionSchemas: typeof registerInteractionSchemas;
};
export default _default;
