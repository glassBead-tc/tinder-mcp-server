"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const cache_manager_1 = __importDefault(require("../../services/cache-manager"));
const logger_1 = __importDefault(require("../../utils/logger"));
const config_1 = __importDefault(require("../../config"));
// Mock dependencies
jest.mock('node-cache');
jest.mock('../../utils/logger');
jest.mock('../../config', () => ({
    CACHE: {
        TTL: 300,
        CHECK_PERIOD: 60
    }
}));
describe('Cache Manager', () => {
    // Mock NodeCache instance
    const mockNodeCache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        flushAll: jest.fn(),
        getStats: jest.fn(),
        keys: jest.fn(),
        has: jest.fn()
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
        mockNodeCache.has.mockReturnValue(false);
        mockNodeCache.getStats.mockReturnValue({
            hits: 0,
            misses: 0,
            keys: 0,
            ksize: 0,
            vsize: 0
        });
    });
    describe('constructor', () => {
        it('should initialize NodeCache with config values', () => {
            // We need to re-import the module to test the constructor
            jest.isolateModules(() => {
                // Re-import the module
                const cacheManagerModule = require('../../services/cache-manager');
                // Assert
                expect(node_cache_1.default).toHaveBeenCalledWith({
                    stdTTL: config_1.default.CACHE.TTL,
                    checkperiod: config_1.default.CACHE.CHECK_PERIOD,
                    useClones: false
                });
                expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining(`Cache initialized with TTL: ${config_1.default.CACHE.TTL}s`));
            });
        });
    });
    describe('get', () => {
        it('should return cached value when found', async () => {
            // Arrange
            const key = 'test-key';
            const cachedValue = { data: 'test-data' };
            mockNodeCache.get.mockReturnValueOnce(cachedValue);
            // Act
            const result = await cache_manager_1.default.get(key);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(key);
            expect(result).toEqual(cachedValue);
        });
        it('should return null when value is not found', async () => {
            // Arrange
            const key = 'non-existent-key';
            mockNodeCache.get.mockReturnValueOnce(undefined);
            // Act
            const result = await cache_manager_1.default.get(key);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(key);
            expect(result).toBeNull();
        });
        it('should handle errors and return null', async () => {
            // Arrange
            const key = 'error-key';
            mockNodeCache.get.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = await cache_manager_1.default.get(key);
            // Assert
            expect(mockNodeCache.get).toHaveBeenCalledWith(key);
            expect(result).toBeNull();
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Cache get error for key ${key}`));
        });
    });
    describe('set', () => {
        it('should set cache value with default TTL', async () => {
            // Arrange
            const key = 'test-key';
            const value = { data: 'test-data' };
            mockNodeCache.set.mockReturnValueOnce(true);
            // Act
            const result = await cache_manager_1.default.set(key, value);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalledWith(key, value, undefined);
            expect(result).toBe(true);
        });
        it('should set cache value with custom TTL', async () => {
            // Arrange
            const key = 'test-key';
            const value = { data: 'test-data' };
            const ttl = 600;
            mockNodeCache.set.mockReturnValueOnce(true);
            // Act
            const result = await cache_manager_1.default.set(key, value, ttl);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalledWith(key, value, ttl);
            expect(result).toBe(true);
        });
        it('should handle errors and return false', async () => {
            // Arrange
            const key = 'error-key';
            const value = { data: 'test-data' };
            mockNodeCache.set.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = await cache_manager_1.default.set(key, value);
            // Assert
            expect(mockNodeCache.set).toHaveBeenCalledWith(key, value, undefined);
            expect(result).toBe(false);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Cache set error for key ${key}`));
        });
    });
    describe('del', () => {
        it('should return true when key is deleted', async () => {
            // Arrange
            const key = 'test-key';
            mockNodeCache.del.mockReturnValueOnce(1);
            // Act
            const result = await cache_manager_1.default.del(key);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(key);
            expect(result).toBe(true);
        });
        it('should return false when key is not found', async () => {
            // Arrange
            const key = 'non-existent-key';
            mockNodeCache.del.mockReturnValueOnce(0);
            // Act
            const result = await cache_manager_1.default.del(key);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(key);
            expect(result).toBe(false);
        });
        it('should handle errors and return false', async () => {
            // Arrange
            const key = 'error-key';
            mockNodeCache.del.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = await cache_manager_1.default.del(key);
            // Assert
            expect(mockNodeCache.del).toHaveBeenCalledWith(key);
            expect(result).toBe(false);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining(`Cache delete error for key ${key}`));
        });
    });
    describe('clear', () => {
        it('should clear all cache entries', async () => {
            // Act
            const result = await cache_manager_1.default.clear();
            // Assert
            expect(mockNodeCache.flushAll).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(logger_1.default.info).toHaveBeenCalledWith('Cache cleared');
        });
        it('should handle errors and return false', async () => {
            // Arrange
            mockNodeCache.flushAll.mockImplementationOnce(() => {
                throw new Error('Cache error');
            });
            // Act
            const result = await cache_manager_1.default.clear();
            // Assert
            expect(mockNodeCache.flushAll).toHaveBeenCalled();
            expect(result).toBe(false);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Cache clear error'));
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
            const result = cache_manager_1.default.getStats();
            // Assert
            expect(mockNodeCache.getStats).toHaveBeenCalled();
            expect(result).toEqual(mockStats);
        });
    });
    describe('getKeys', () => {
        it('should return all cache keys', () => {
            // Arrange
            const mockKeys = ['key1', 'key2', 'key3'];
            mockNodeCache.keys.mockReturnValueOnce(mockKeys);
            // Act
            const result = cache_manager_1.default.getKeys();
            // Assert
            expect(mockNodeCache.keys).toHaveBeenCalled();
            expect(result).toEqual(mockKeys);
        });
    });
    describe('has', () => {
        it('should return true when key exists', () => {
            // Arrange
            const key = 'test-key';
            mockNodeCache.has.mockReturnValueOnce(true);
            // Act
            const result = cache_manager_1.default.has(key);
            // Assert
            expect(mockNodeCache.has).toHaveBeenCalledWith(key);
            expect(result).toBe(true);
        });
        it('should return false when key does not exist', () => {
            // Arrange
            const key = 'non-existent-key';
            mockNodeCache.has.mockReturnValueOnce(false);
            // Act
            const result = cache_manager_1.default.has(key);
            // Assert
            expect(mockNodeCache.has).toHaveBeenCalledWith(key);
            expect(result).toBe(false);
        });
    });
});
//# sourceMappingURL=cache-manager.test.js.map