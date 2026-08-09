process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/canteen-test';
process.env.JWT_SECRET = 'test-secret-key-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.COOKIE_NAME = 'canteen_token';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
