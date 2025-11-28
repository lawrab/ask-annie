import MagicLinkToken from '../MagicLinkToken';

describe('MagicLinkToken Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid magic link token with all required fields', () => {
      const validToken = {
        email: 'test@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      };

      const magicLinkToken = new MagicLinkToken(validToken);

      expect(magicLinkToken.email).toBe(validToken.email);
      expect(magicLinkToken.token).toBe(validToken.token);
      expect(magicLinkToken.expiresAt).toEqual(validToken.expiresAt);
      expect(magicLinkToken.used).toBe(false);
    });

    it('should fail validation without email', () => {
      const tokenWithoutEmail = new MagicLinkToken({
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const error = tokenWithoutEmail.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
    });

    it('should fail validation without token', () => {
      const tokenWithoutToken = new MagicLinkToken({
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const error = tokenWithoutToken.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.token).toBeDefined();
    });

    it('should fail validation without expiresAt', () => {
      const tokenWithoutExpiresAt = new MagicLinkToken({
        email: 'test@example.com',
        token: 'a'.repeat(64),
      });

      const error = tokenWithoutExpiresAt.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.expiresAt).toBeDefined();
    });

    it('should fail validation with invalid email format', () => {
      const tokenWithInvalidEmail = new MagicLinkToken({
        email: 'invalid-email',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const error = tokenWithInvalidEmail.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
    });

    it('should trim and lowercase email', () => {
      const token = new MagicLinkToken({
        email: '  TEST@EXAMPLE.COM  ',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(token.email).toBe('test@example.com');
    });

    it('should default used to false', () => {
      const token = new MagicLinkToken({
        email: 'test@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(token.used).toBe(false);
    });

    it('should allow setting used to true', () => {
      const token = new MagicLinkToken({
        email: 'test@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: true,
      });

      expect(token.used).toBe(true);
    });
  });

  describe('Schema Properties', () => {
    it('should have correct schema structure', () => {
      const schema = MagicLinkToken.schema;

      expect(schema.path('email')).toBeDefined();
      expect(schema.path('token')).toBeDefined();
      expect(schema.path('expiresAt')).toBeDefined();
      expect(schema.path('used')).toBeDefined();
    });

    it('should have createdAt timestamp', () => {
      const schema = MagicLinkToken.schema;
      expect(schema.path('createdAt')).toBeDefined();
    });

    it('should not have updatedAt timestamp', () => {
      const schema = MagicLinkToken.schema;
      // Magic link tokens don't need updatedAt since they're single-use
      expect(schema.path('updatedAt')).toBeUndefined();
    });

    it('should have TTL index on expiresAt', () => {
      const schema = MagicLinkToken.schema;
      const indexes = schema.indexes();

      const ttlIndex = indexes.find(
        (index) => index[0].expiresAt && index[1].expireAfterSeconds === 0
      );

      expect(ttlIndex).toBeDefined();
    });

    it('should have index on email', () => {
      const schema = MagicLinkToken.schema;
      const indexes = schema.indexes();

      const emailIndex = indexes.find((index) => index[0].email);
      expect(emailIndex).toBeDefined();
    });

    it('should have index on token', () => {
      const schema = MagicLinkToken.schema;
      const indexes = schema.indexes();

      const tokenIndex = indexes.find((index) => index[0].token);
      expect(tokenIndex).toBeDefined();
    });

    it('should have index on createdAt', () => {
      const schema = MagicLinkToken.schema;
      const indexes = schema.indexes();

      const createdAtIndex = indexes.find((index) => index[0].createdAt);
      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('Schema Validation Rules', () => {
    it('should have required validators', () => {
      const schema = MagicLinkToken.schema;

      const emailValidators = schema.path('email').validators;
      const tokenValidators = schema.path('token').validators;
      const expiresAtValidators = schema.path('expiresAt').validators;

      expect(emailValidators.some((v: any) => v.type === 'required')).toBe(true);
      expect(tokenValidators.some((v: any) => v.type === 'required')).toBe(true);
      expect(expiresAtValidators.some((v: any) => v.type === 'required')).toBe(true);
    });

    it('should have email validator', () => {
      const emailValidators = MagicLinkToken.schema.path('email').validators;
      expect(
        emailValidators.some((v: any) => v.validator.name === 'isEmail' || v.type === 'regexp')
      ).toBe(true);
    });
  });

  describe('Token Lifecycle', () => {
    it('should handle token expiration scenario', () => {
      const expiredToken = new MagicLinkToken({
        email: 'test@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
        used: false,
      });

      expect(expiredToken.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it('should handle single-use token scenario', () => {
      const token = new MagicLinkToken({
        email: 'test@example.com',
        token: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      });

      expect(token.used).toBe(false);

      // Simulate token usage
      token.used = true;
      expect(token.used).toBe(true);
    });
  });
});
