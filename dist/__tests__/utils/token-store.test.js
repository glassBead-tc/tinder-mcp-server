"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const token_store_1 = __importDefault(require("../../utils/token-store"));
const logger_1 = __importDefault(require("../../utils/logger"));
// Mock dependencies
jest.mock('node-cache');
jest.mock('../../utils/logger');
describe('Token Store', () => {
    // Mock NodeCache instance
    const mockNodeCache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        getStats: jest.fn()
    };
    // Sample token data
    const sampleTokenData = {
        apiToken: 'api-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: Date.now() + 3600000 // 1 hour from now
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset NodeCache mock
        node_cache_1.default.mockImplementation(() => mockNodeCache);
        // Default mock implementations
        mockNodeCache.get.mockReturnValue(undefined);
        mockNodeCache.set.mockReturnValue(true);
        mockNodeCache.del.mockReturnValue(0);
        mockNodeCache.keys.mockReturnValue([]);
        mockNodeCache.getStats.mockReturnValue({
            hits: 0,
            misses: 0,
            keys: 0,
            ksize: 0,
            vsize: 0
        });
    });
    describe('getToken', () => {
        it('should return token data when found', () => {
            // Arrange
            const userId = 'user-123';
            mockNodeCache.get.mockReturnValueOnce(sampleTokenData);
            // Act
            const result = token_store_1.default.getToken(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toEqual(sampleTokenData);
        });
        it('should return null when token is not found', () => {
            // Arrange
            const userId = 'non-existent-user';
            mockNodeCache.get.mockReturnValueOnce(undefined);
            // Act
            const result = token_store_1.default.getToken(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBeNull();
        });
        it('should handle errors and return null', () => {
            // Arrange
            const userId = 'error-user';
            mockNodeCache.get.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = token_store_1.default.getToken(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBeNull();
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Error getting token for user ${userId}`));
        });
    });
    describe('storeToken', () => {
        it('should store token data with calculated TTL', () => {
            // Arrange
            const userId = 'user-123';
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const tokenData = {
                apiToken: 'api-token-123',
                refreshToken: 'refresh-token-456',
                expiresAt: now + 3600000 // 1 hour from now
            };
            mockNodeCache.set.mockReturnValueOnce(true);
            // Act
            const result = token_store_1.default.storeToken(userId, tokenData);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalledWith(userId, tokenData, 3600 // TTL in seconds (1 hour)
            );
            expect(result).toBe(true);
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
        it('should use undefined TTL when expiry is in the past', () => {
            // Arrange
            const userId = 'user-123';
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const tokenData = {
                apiToken: 'api-token-123',
                refreshToken: 'refresh-token-456',
                expiresAt: now - 3600000 // 1 hour ago (expired)
            };
            mockNodeCache.set.mockReturnValueOnce(true);
            // Act
            const result = token_store_1.default.storeToken(userId, tokenData);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalledWith(userId, tokenData, undefined // TTL is undefined when expiry is in the past
            );
            expect(result).toBe(true);
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
        it('should handle errors and return false', () => {
            // Arrange
            const userId = 'error-user';
            mockNodeCache.set.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = token_store_1.default.storeToken(userId, sampleTokenData);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalled();
            expect(result).toBe(false);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Error storing token for user ${userId}`));
        });
    });
    describe('removeToken', () => {
        it('should return true when token is removed', () => {
            // Arrange
            const userId = 'user-123';
            mockNodeCache.del.mockReturnValueOnce(1);
            // Act
            const result = token_store_1.default.removeToken(userId);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });
        it('should return false when token is not found', () => {
            // Arrange
            const userId = 'non-existent-user';
            mockNodeCache.del.mockReturnValueOnce(0);
            // Act
            const result = token_store_1.default.removeToken(userId);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
        });
        it('should handle errors and return false', () => {
            // Arrange
            const userId = 'error-user';
            mockNodeCache.del.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = token_store_1.default.removeToken(userId);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Error removing token for user ${userId}`));
        });
    });
    describe('isTokenExpired', () => {
        it('should return true when token is expired', () => {
            // Arrange
            const userId = 'user-123';
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const expiredToken = {
                apiToken: 'api-token-123',
                refreshToken: 'refresh-token-456',
                expiresAt: now - 1000 // Expired 1 second ago
            };
            mockNodeCache.get.mockReturnValueOnce(expiredToken);
            // Act
            const result = token_store_1.default.isTokenExpired(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
        it('should return false when token is not expired', () => {
            // Arrange
            const userId = 'user-123';
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const validToken = {
                apiToken: 'api-token-123',
                refreshToken: 'refresh-token-456',
                expiresAt: now + 3600000 // Expires in 1 hour
            };
            mockNodeCache.get.mockReturnValueOnce(validToken);
            // Act
            const result = token_store_1.default.isTokenExpired(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBe(false);
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
        it('should return true when token is not found', () => {
            // Arrange
            const userId = 'non-existent-user';
            mockNodeCache.get.mockReturnValueOnce(null);
            // Act
            const result = token_store_1.default.isTokenExpired(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
        });
        it('should handle errors and return true', () => {
            // Arrange
            const userId = 'error-user';
            mockNodeCache.get.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = token_store_1.default.isTokenExpired(userId);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Error checking token expiry for user ${userId}`));
        });
    });
    describe('calculateExpiryTime', () => {
        it('should calculate expiry time with default TTL', () => {
            // Arrange
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            // Act
            const result = token_store_1.default.calculateExpiryTime();
            // Assert
            expect(result).toBe(now + 24 * 60 * 60 * 1000); // Default TTL is 24 hours
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
        it('should calculate expiry time with custom TTL', () => {
            // Arrange
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const customTtl = 3600000; // 1 hour
            // Act
            const result = token_store_1.default.calculateExpiryTime(customTtl);
            // Assert
            expect(result).toBe(now + customTtl);
            // Restore Date.now
            jest.spyOn(Date, 'now').mockRestore();
        });
    });
    describe('getAllUserIds', () => {
        it('should return all user IDs', () => {
            // Arrange
            const userIds = ['user-1', 'user-2', 'user-3'];
            mockNodeCache.keys.mockReturnValueOnce(userIds);
            // Act
            const result = token_store_1.default.getAllUserIds();
            // Assert
            expect(mockNodeCache.keys).toHaveBeenCalled();
            expect(result).toEqual(userIds);
        });
    });
    describe('getStats', () => {
        it('should return cache statistics', () => {
            // Arrange
            const mockStats = {
                hits: 10,
                misses: 5,
                keys: 3,
                ksize: 100,
                vsize: 500
            };
            mockNodeCache.getStats.mockReturnValueOnce(mockStats);
            // Act
            const result = token_store_1.default.getStats();
            // Assert
            expect(mockNodeCache.getStats).toHaveBeenCalled();
            expect(result).toEqual(mockStats);
        });
    });
});
//# sourceMappingURL=token-store.test.js.map