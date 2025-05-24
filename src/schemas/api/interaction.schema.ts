/**
 * User Interaction Schema
 * 
 * Defines validation schemas for user interaction-related API endpoints.
 */

import { z } from 'zod';
import { schemaRegistry } from '../registry';
import { userIdSchema } from '../common/user.schema';
import baseSchema from '../common/base.schema';

/**
 * Interaction types
 */
export const interactionTypeSchema = z.enum([
  'like',
  'pass',
  'superlike',
  'rewind',
  'boost'
]);

/**
 * Like request schema
 */
export const likeRequestSchema = z.object({
  targetUserId: userIdSchema,
  content: z.string().max(500).optional()
});

/**
 * Like response schema
 */
export const likeResponseSchema = z.object({
  status: z.enum(['liked', 'matched']),
  matchId: baseSchema.uuidString.optional(),
  targetUser: z.object({
    id: userIdSchema,
    name: z.string().optional()
  }).optional()
});

/**
 * Pass request schema
 */
export const passRequestSchema = z.object({
  targetUserId: userIdSchema,
  reason: z.enum([
    'not_interested',
    'inappropriate_content',
    'fake_profile',
    'other'
  ]).optional()
});

/**
 * Pass response schema
 */
export const passResponseSchema = z.object({
  status: z.literal('passed'),
  targetUserId: userIdSchema
});

/**
 * Super like request schema
 */
export const superLikeRequestSchema = z.object({
  targetUserId: userIdSchema,
  content: z.string().max(500).optional()
});

/**
 * Super like response schema
 */
export const superLikeResponseSchema = z.object({
  status: z.enum(['superliked', 'matched']),
  matchId: baseSchema.uuidString.optional(),
  remaining: z.number().int().nonnegative(),
  resetAt: z.number().int().optional(),
  targetUser: z.object({
    id: userIdSchema,
    name: z.string().optional()
  }).optional()
});

/**
 * Rewind request schema
 */
export const rewindRequestSchema = z.object({
  interactionId: baseSchema.uuidString,
  interactionType: interactionTypeSchema
});

/**
 * Rewind response schema
 */
export const rewindResponseSchema = z.object({
  status: z.literal('rewound'),
  remaining: z.number().int().nonnegative(),
  resetAt: z.number().int().optional()
});

/**
 * Boost request schema
 */
export const boostRequestSchema = z.object({
  duration: z.number().int().positive().optional() // Duration in minutes
});

/**
 * Boost response schema
 */
export const boostResponseSchema = z.object({
  status: z.literal('boosted'),
  expiresAt: z.number().int(),
  remaining: z.number().int().nonnegative(),
  resetAt: z.number().int().optional()
});

/**
 * Match list request schema
 */
export const matchListRequestSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z.enum(['recent', 'unread']).optional().default('recent')
});

/**
 * Match item schema
 */
export const matchItemSchema = z.object({
  matchId: baseSchema.uuidString,
  userId: userIdSchema,
  name: z.string(),
  photos: z.array(z.object({
    id: baseSchema.uuidString,
    url: baseSchema.urlString
  })).optional(),
  lastMessage: z.object({
    id: baseSchema.uuidString,
    content: z.string(),
    sentAt: baseSchema.dateTimeString,
    isRead: z.boolean()
  }).optional(),
  matchedAt: baseSchema.dateTimeString,
  unreadCount: z.number().int().nonnegative().default(0),
  isNew: z.boolean().default(false)
});

/**
 * Match list response schema
 */
export const matchListResponseSchema = z.object({
  matches: z.array(matchItemSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean()
});

/**
 * Unmatch request schema
 */
export const unmatchRequestSchema = z.object({
  matchId: baseSchema.uuidString,
  reason: z.enum([
    'not_interested',
    'inappropriate_behavior',
    'fake_profile',
    'other'
  ]).optional(),
  block: z.boolean().optional().default(false)
});

/**
 * Unmatch response schema
 */
export const unmatchResponseSchema = z.object({
  status: z.literal('unmatched'),
  matchId: baseSchema.uuidString
});

/**
 * Report user request schema
 */
export const reportUserRequestSchema = z.object({
  targetUserId: userIdSchema,
  reason: z.enum([
    'inappropriate_photos',
    'inappropriate_messages',
    'fake_profile',
    'offensive_behavior',
    'underage',
    'spam',
    'other'
  ]),
  details: z.string().max(1000).optional(),
  evidenceUrls: z.array(baseSchema.urlString).max(5).optional()
});

/**
 * Report user response schema
 */
export const reportUserResponseSchema = z.object({
  status: z.literal('reported'),
  reportId: baseSchema.uuidString
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  status: z.literal('error'),
  code: z.number().int(),
  message: z.string(),
  details: z.any().optional()
});

/**
 * Register schemas with the registry
 */
export function registerInteractionSchemas() {
  // Request schemas
  schemaRegistry.register('interaction.like.request', likeRequestSchema, 'api', 'Like request schema');
  schemaRegistry.register('interaction.pass.request', passRequestSchema, 'api', 'Pass request schema');
  schemaRegistry.register('interaction.superLike.request', superLikeRequestSchema, 'api', 'Super like request schema');
  schemaRegistry.register('interaction.rewind.request', rewindRequestSchema, 'api', 'Rewind request schema');
  schemaRegistry.register('interaction.boost.request', boostRequestSchema, 'api', 'Boost request schema');
  schemaRegistry.register('interaction.matchList.request', matchListRequestSchema, 'api', 'Match list request schema');
  schemaRegistry.register('interaction.unmatch.request', unmatchRequestSchema, 'api', 'Unmatch request schema');
  schemaRegistry.register('interaction.reportUser.request', reportUserRequestSchema, 'api', 'Report user request schema');
  
  // Response schemas
  schemaRegistry.register('interaction.like.response', likeResponseSchema, 'api', 'Like response schema');
  schemaRegistry.register('interaction.pass.response', passResponseSchema, 'api', 'Pass response schema');
  schemaRegistry.register('interaction.superLike.response', superLikeResponseSchema, 'api', 'Super like response schema');
  schemaRegistry.register('interaction.rewind.response', rewindResponseSchema, 'api', 'Rewind response schema');
  schemaRegistry.register('interaction.boost.response', boostResponseSchema, 'api', 'Boost response schema');
  schemaRegistry.register('interaction.matchItem', matchItemSchema, 'api', 'Match item schema');
  schemaRegistry.register('interaction.matchList.response', matchListResponseSchema, 'api', 'Match list response schema');
  schemaRegistry.register('interaction.unmatch.response', unmatchResponseSchema, 'api', 'Unmatch response schema');
  schemaRegistry.register('interaction.reportUser.response', reportUserResponseSchema, 'api', 'Report user response schema');
  schemaRegistry.register('interaction.error.response', errorResponseSchema, 'api', 'Error response schema');
}

// Export schemas
export default {
  // Request schemas
  interactionTypeSchema,
  likeRequestSchema,
  passRequestSchema,
  superLikeRequestSchema,
  rewindRequestSchema,
  boostRequestSchema,
  matchListRequestSchema,
  unmatchRequestSchema,
  reportUserRequestSchema,
  
  // Response schemas
  likeResponseSchema,
  passResponseSchema,
  superLikeResponseSchema,
  rewindResponseSchema,
  boostResponseSchema,
  matchItemSchema,
  matchListResponseSchema,
  unmatchResponseSchema,
  reportUserResponseSchema,
  errorResponseSchema,
  
  // Register function
  registerInteractionSchemas
};