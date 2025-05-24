"use strict";
/**
 * User Interaction Schema
 *
 * Defines validation schemas for user interaction-related API endpoints.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = exports.reportUserResponseSchema = exports.reportUserRequestSchema = exports.unmatchResponseSchema = exports.unmatchRequestSchema = exports.matchListResponseSchema = exports.matchItemSchema = exports.matchListRequestSchema = exports.boostResponseSchema = exports.boostRequestSchema = exports.rewindResponseSchema = exports.rewindRequestSchema = exports.superLikeResponseSchema = exports.superLikeRequestSchema = exports.passResponseSchema = exports.passRequestSchema = exports.likeResponseSchema = exports.likeRequestSchema = exports.interactionTypeSchema = void 0;
exports.registerInteractionSchemas = registerInteractionSchemas;
const zod_1 = require("zod");
const registry_1 = require("../registry");
const user_schema_1 = require("../common/user.schema");
const base_schema_1 = __importDefault(require("../common/base.schema"));
/**
 * Interaction types
 */
exports.interactionTypeSchema = zod_1.z.enum([
    'like',
    'pass',
    'superlike',
    'rewind',
    'boost'
]);
/**
 * Like request schema
 */
exports.likeRequestSchema = zod_1.z.object({
    targetUserId: user_schema_1.userIdSchema,
    content: zod_1.z.string().max(500).optional()
});
/**
 * Like response schema
 */
exports.likeResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['liked', 'matched']),
    matchId: base_schema_1.default.uuidString.optional(),
    targetUser: zod_1.z.object({
        id: user_schema_1.userIdSchema,
        name: zod_1.z.string().optional()
    }).optional()
});
/**
 * Pass request schema
 */
exports.passRequestSchema = zod_1.z.object({
    targetUserId: user_schema_1.userIdSchema,
    reason: zod_1.z.enum([
        'not_interested',
        'inappropriate_content',
        'fake_profile',
        'other'
    ]).optional()
});
/**
 * Pass response schema
 */
exports.passResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('passed'),
    targetUserId: user_schema_1.userIdSchema
});
/**
 * Super like request schema
 */
exports.superLikeRequestSchema = zod_1.z.object({
    targetUserId: user_schema_1.userIdSchema,
    content: zod_1.z.string().max(500).optional()
});
/**
 * Super like response schema
 */
exports.superLikeResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['superliked', 'matched']),
    matchId: base_schema_1.default.uuidString.optional(),
    remaining: zod_1.z.number().int().nonnegative(),
    resetAt: zod_1.z.number().int().optional(),
    targetUser: zod_1.z.object({
        id: user_schema_1.userIdSchema,
        name: zod_1.z.string().optional()
    }).optional()
});
/**
 * Rewind request schema
 */
exports.rewindRequestSchema = zod_1.z.object({
    interactionId: base_schema_1.default.uuidString,
    interactionType: exports.interactionTypeSchema
});
/**
 * Rewind response schema
 */
exports.rewindResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('rewound'),
    remaining: zod_1.z.number().int().nonnegative(),
    resetAt: zod_1.z.number().int().optional()
});
/**
 * Boost request schema
 */
exports.boostRequestSchema = zod_1.z.object({
    duration: zod_1.z.number().int().positive().optional() // Duration in minutes
});
/**
 * Boost response schema
 */
exports.boostResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('boosted'),
    expiresAt: zod_1.z.number().int(),
    remaining: zod_1.z.number().int().nonnegative(),
    resetAt: zod_1.z.number().int().optional()
});
/**
 * Match list request schema
 */
exports.matchListRequestSchema = zod_1.z.object({
    limit: zod_1.z.number().int().positive().max(100).optional().default(20),
    offset: zod_1.z.number().int().nonnegative().optional().default(0),
    sortBy: zod_1.z.enum(['recent', 'unread']).optional().default('recent')
});
/**
 * Match item schema
 */
exports.matchItemSchema = zod_1.z.object({
    matchId: base_schema_1.default.uuidString,
    userId: user_schema_1.userIdSchema,
    name: zod_1.z.string(),
    photos: zod_1.z.array(zod_1.z.object({
        id: base_schema_1.default.uuidString,
        url: base_schema_1.default.urlString
    })).optional(),
    lastMessage: zod_1.z.object({
        id: base_schema_1.default.uuidString,
        content: zod_1.z.string(),
        sentAt: base_schema_1.default.dateTimeString,
        isRead: zod_1.z.boolean()
    }).optional(),
    matchedAt: base_schema_1.default.dateTimeString,
    unreadCount: zod_1.z.number().int().nonnegative().default(0),
    isNew: zod_1.z.boolean().default(false)
});
/**
 * Match list response schema
 */
exports.matchListResponseSchema = zod_1.z.object({
    matches: zod_1.z.array(exports.matchItemSchema),
    total: zod_1.z.number().int().nonnegative(),
    hasMore: zod_1.z.boolean()
});
/**
 * Unmatch request schema
 */
exports.unmatchRequestSchema = zod_1.z.object({
    matchId: base_schema_1.default.uuidString,
    reason: zod_1.z.enum([
        'not_interested',
        'inappropriate_behavior',
        'fake_profile',
        'other'
    ]).optional(),
    block: zod_1.z.boolean().optional().default(false)
});
/**
 * Unmatch response schema
 */
exports.unmatchResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('unmatched'),
    matchId: base_schema_1.default.uuidString
});
/**
 * Report user request schema
 */
exports.reportUserRequestSchema = zod_1.z.object({
    targetUserId: user_schema_1.userIdSchema,
    reason: zod_1.z.enum([
        'inappropriate_photos',
        'inappropriate_messages',
        'fake_profile',
        'offensive_behavior',
        'underage',
        'spam',
        'other'
    ]),
    details: zod_1.z.string().max(1000).optional(),
    evidenceUrls: zod_1.z.array(base_schema_1.default.urlString).max(5).optional()
});
/**
 * Report user response schema
 */
exports.reportUserResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('reported'),
    reportId: base_schema_1.default.uuidString
});
/**
 * Error response schema
 */
exports.errorResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('error'),
    code: zod_1.z.number().int(),
    message: zod_1.z.string(),
    details: zod_1.z.any().optional()
});
/**
 * Register schemas with the registry
 */
function registerInteractionSchemas() {
    // Request schemas
    registry_1.schemaRegistry.register('interaction.like.request', exports.likeRequestSchema, 'api', 'Like request schema');
    registry_1.schemaRegistry.register('interaction.pass.request', exports.passRequestSchema, 'api', 'Pass request schema');
    registry_1.schemaRegistry.register('interaction.superLike.request', exports.superLikeRequestSchema, 'api', 'Super like request schema');
    registry_1.schemaRegistry.register('interaction.rewind.request', exports.rewindRequestSchema, 'api', 'Rewind request schema');
    registry_1.schemaRegistry.register('interaction.boost.request', exports.boostRequestSchema, 'api', 'Boost request schema');
    registry_1.schemaRegistry.register('interaction.matchList.request', exports.matchListRequestSchema, 'api', 'Match list request schema');
    registry_1.schemaRegistry.register('interaction.unmatch.request', exports.unmatchRequestSchema, 'api', 'Unmatch request schema');
    registry_1.schemaRegistry.register('interaction.reportUser.request', exports.reportUserRequestSchema, 'api', 'Report user request schema');
    // Response schemas
    registry_1.schemaRegistry.register('interaction.like.response', exports.likeResponseSchema, 'api', 'Like response schema');
    registry_1.schemaRegistry.register('interaction.pass.response', exports.passResponseSchema, 'api', 'Pass response schema');
    registry_1.schemaRegistry.register('interaction.superLike.response', exports.superLikeResponseSchema, 'api', 'Super like response schema');
    registry_1.schemaRegistry.register('interaction.rewind.response', exports.rewindResponseSchema, 'api', 'Rewind response schema');
    registry_1.schemaRegistry.register('interaction.boost.response', exports.boostResponseSchema, 'api', 'Boost response schema');
    registry_1.schemaRegistry.register('interaction.matchItem', exports.matchItemSchema, 'api', 'Match item schema');
    registry_1.schemaRegistry.register('interaction.matchList.response', exports.matchListResponseSchema, 'api', 'Match list response schema');
    registry_1.schemaRegistry.register('interaction.unmatch.response', exports.unmatchResponseSchema, 'api', 'Unmatch response schema');
    registry_1.schemaRegistry.register('interaction.reportUser.response', exports.reportUserResponseSchema, 'api', 'Report user response schema');
    registry_1.schemaRegistry.register('interaction.error.response', exports.errorResponseSchema, 'api', 'Error response schema');
}
// Export schemas
exports.default = {
    // Request schemas
    interactionTypeSchema: exports.interactionTypeSchema,
    likeRequestSchema: exports.likeRequestSchema,
    passRequestSchema: exports.passRequestSchema,
    superLikeRequestSchema: exports.superLikeRequestSchema,
    rewindRequestSchema: exports.rewindRequestSchema,
    boostRequestSchema: exports.boostRequestSchema,
    matchListRequestSchema: exports.matchListRequestSchema,
    unmatchRequestSchema: exports.unmatchRequestSchema,
    reportUserRequestSchema: exports.reportUserRequestSchema,
    // Response schemas
    likeResponseSchema: exports.likeResponseSchema,
    passResponseSchema: exports.passResponseSchema,
    superLikeResponseSchema: exports.superLikeResponseSchema,
    rewindResponseSchema: exports.rewindResponseSchema,
    boostResponseSchema: exports.boostResponseSchema,
    matchItemSchema: exports.matchItemSchema,
    matchListResponseSchema: exports.matchListResponseSchema,
    unmatchResponseSchema: exports.unmatchResponseSchema,
    reportUserResponseSchema: exports.reportUserResponseSchema,
    errorResponseSchema: exports.errorResponseSchema,
    // Register function
    registerInteractionSchemas
};
//# sourceMappingURL=interaction.schema.js.map