import User from '../User';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user with all required fields', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const user = new User(validUser);

      expect(user.username).toBe(validUser.username);
      expect(user.email).toBe(validUser.email);
      expect(user.notificationsEnabled).toBe(true); // default
      expect(user.notificationTimes).toEqual(['08:00', '14:00', '20:00']); // default
    });

    it('should fail validation without username', () => {
      const userWithoutUsername = new User({
        email: 'test@example.com',
      });

      const error = userWithoutUsername.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.username).toBeDefined();
    });

    it('should fail validation without email', () => {
      const userWithoutEmail = new User({
        username: 'testuser',
      });

      const error = userWithoutEmail.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
    });

    it('should fail validation with invalid email format', () => {
      const userWithInvalidEmail = new User({
        username: 'testuser',
        email: 'invalid-email',
      });

      const error = userWithInvalidEmail.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
    });

    it('should trim and lowercase email', () => {
      const user = new User({
        username: 'testuser',
        email: '  TEST@EXAMPLE.COM  ',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim username', () => {
      const user = new User({
        username: '  testuser  ',
        email: 'test@example.com',
      });

      expect(user.username).toBe('testuser');
    });

    it('should enforce minimum username length', () => {
      const userWithShortUsername = new User({
        username: 'ab', // less than 3 characters
        email: 'test@example.com',
      });

      const error = userWithShortUsername.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.username).toBeDefined();
    });

    it('should enforce maximum username length', () => {
      const userWithLongUsername = new User({
        username: 'a'.repeat(31), // more than 30 characters
        email: 'test@example.com',
      });

      const error = userWithLongUsername.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.username).toBeDefined();
    });
  });

  describe('Schema Properties', () => {
    it('should have correct schema structure', () => {
      const schema = User.schema;

      expect(schema.path('username')).toBeDefined();
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('notificationsEnabled')).toBeDefined();
      expect(schema.path('notificationTimes')).toBeDefined();
    });

    it('should not have password field (passwordless authentication)', () => {
      const schema = User.schema;
      expect(schema.path('password')).toBeUndefined();
    });

    it('should have timestamps enabled', () => {
      const schema = User.schema;
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have unique constraint on email', () => {
      const emailPath = User.schema.path('email') as any;
      expect(emailPath).toBeDefined();
      expect(emailPath.options?.unique).toBe(true);
    });

    it('should have unique constraint on username', () => {
      const usernamePath = User.schema.path('username') as any;
      expect(usernamePath).toBeDefined();
      expect(usernamePath.options?.unique).toBe(true);
    });
  });

  describe('Notification Settings', () => {
    it('should have default notification times in schema', () => {
      const notificationTimesPath = User.schema.path('notificationTimes') as any;
      expect(notificationTimesPath).toBeDefined();
      // Check that default exists (it's a function that returns the array)
      expect(notificationTimesPath.defaultValue).toBeDefined();
    });

    it('should validate notification time format', () => {
      const userWithInvalidTime = new User({
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: ['9:00', '3pm', '25:00'], // invalid formats
      });

      const error = userWithInvalidTime.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.notificationTimes).toBeDefined();
    });

    it('should accept valid notification times', () => {
      const customTimes = ['09:00', '15:00', '21:00'];
      const userWithValidTimes = new User({
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: customTimes,
      });

      const error = userWithValidTimes.validateSync();
      expect(error).toBeUndefined();
      expect(userWithValidTimes.notificationTimes).toEqual(customTimes);
    });

    it('should have notificationsEnabled default to true', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(user.notificationsEnabled).toBe(true);
    });

    it('should allow disabling notifications', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        notificationsEnabled: false,
      });

      expect(user.notificationsEnabled).toBe(false);
    });
  });

  describe('Schema Validation Rules', () => {
    it('should have required validators', () => {
      const schema = User.schema;

      const usernameValidators = schema.path('username').validators;
      const emailValidators = schema.path('email').validators;

      expect(usernameValidators.some((v: any) => v.type === 'required')).toBe(true);
      expect(emailValidators.some((v: any) => v.type === 'required')).toBe(true);
    });

    it('should have minlength validator on username', () => {
      const usernameValidators = User.schema.path('username').validators;
      expect(usernameValidators.some((v: any) => v.type === 'minlength')).toBe(true);
    });

    it('should have maxlength validator on username', () => {
      const usernameValidators = User.schema.path('username').validators;
      expect(usernameValidators.some((v: any) => v.type === 'maxlength')).toBe(true);
    });

    it('should have email validator', () => {
      const emailValidators = User.schema.path('email').validators;
      expect(
        emailValidators.some((v: any) => v.validator.name === 'isEmail' || v.type === 'regexp')
      ).toBe(true);
    });
  });
});
