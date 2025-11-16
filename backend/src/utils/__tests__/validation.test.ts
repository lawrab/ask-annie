import { registerSchema, loginSchema, manualCheckinSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    describe('Success Cases', () => {
      it('should validate valid registration data', () => {
        const validData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should trim and lowercase email', () => {
        const data = {
          username: 'testuser',
          email: '  TEST@EXAMPLE.COM  ',
          password: 'Password123',
        };

        const { value } = registerSchema.validate(data);
        expect(value.email).toBe('test@example.com');
      });

      it('should trim username', () => {
        const data = {
          username: '  testuser  ',
          email: 'test@example.com',
          password: 'Password123',
        };

        const { value } = registerSchema.validate(data);
        expect(value.username).toBe('testuser');
      });

      it('should accept username at minimum length (3 chars)', () => {
        const data = {
          username: 'abc',
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept username at maximum length (30 chars)', () => {
        const data = {
          username: 'a'.repeat(30),
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept password with uppercase, lowercase, and number', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'MyPassword1',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeUndefined();
      });
    });

    describe('Error Cases - Username', () => {
      it('should reject missing username', () => {
        const data = {
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Username is required');
      });

      it('should reject username shorter than 3 characters', () => {
        const data = {
          username: 'ab',
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Username must be at least 3 characters');
      });

      it('should reject username longer than 30 characters', () => {
        const data = {
          username: 'a'.repeat(31),
          email: 'test@example.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Username must not exceed 30 characters');
      });
    });

    describe('Error Cases - Email', () => {
      it('should reject missing email', () => {
        const data = {
          username: 'testuser',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Email is required');
      });

      it('should reject invalid email format', () => {
        const data = {
          username: 'testuser',
          email: 'not-an-email',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Please provide a valid email address');
      });

      it('should reject email without domain', () => {
        const data = {
          username: 'testuser',
          email: 'test@',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Please provide a valid email address');
      });

      it('should reject email without @', () => {
        const data = {
          username: 'testuser',
          email: 'testexample.com',
          password: 'Password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Please provide a valid email address');
      });
    });

    describe('Error Cases - Password', () => {
      it('should reject missing password', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Password is required');
      });

      it('should reject password shorter than 8 characters', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Pass1',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Password must be at least 8 characters');
      });

      it('should reject password without uppercase letter', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('uppercase');
      });

      it('should reject password without lowercase letter', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'PASSWORD123',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('lowercase');
      });

      it('should reject password without number', () => {
        const data = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'PasswordABC',
        };

        const { error } = registerSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('number');
      });
    });
  });

  describe('loginSchema', () => {
    describe('Success Cases', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        const { error } = loginSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should trim and lowercase email', () => {
        const data = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'anypassword',
        };

        const { value } = loginSchema.validate(data);
        expect(value.email).toBe('test@example.com');
      });

      it('should accept any password (no strength validation for login)', () => {
        const data = {
          email: 'test@example.com',
          password: '123',
        };

        const { error } = loginSchema.validate(data);
        expect(error).toBeUndefined();
      });
    });

    describe('Error Cases', () => {
      it('should reject missing email', () => {
        const data = {
          password: 'anypassword',
        };

        const { error } = loginSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Email is required');
      });

      it('should reject invalid email format', () => {
        const data = {
          email: 'not-an-email',
          password: 'anypassword',
        };

        const { error } = loginSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Please provide a valid email address');
      });

      it('should reject missing password', () => {
        const data = {
          email: 'test@example.com',
        };

        const { error } = loginSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Password is required');
      });
    });
  });

  describe('manualCheckinSchema', () => {
    describe('Success Cases', () => {
      it('should validate valid manual check-in data', () => {
        const validData = {
          structured: {
            symptoms: {
              headache: 'severe',
              fatigue: 7,
              dizzy: true,
            },
            activities: ['walking', 'reading'],
            triggers: ['stress', 'lack of sleep'],
            notes: 'Felt worse after lunch',
          },
        };

        const { error } = manualCheckinSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should accept empty arrays for activities and triggers', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept empty notes', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept symptoms with string values', () => {
        const data = {
          structured: {
            symptoms: {
              mood: 'good',
              energy: 'low',
            },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept symptoms with number values', () => {
        const data = {
          structured: {
            symptoms: {
              pain: 7,
              temperature: 98.6,
            },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept symptoms with boolean values', () => {
        const data = {
          structured: {
            symptoms: {
              nausea: true,
              dizzy: false,
            },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should accept mixed symptom value types', () => {
        const data = {
          structured: {
            symptoms: {
              pain: 8,
              mood: 'bad',
              dizzy: true,
            },
            activities: ['exercise'],
            triggers: ['weather'],
            notes: 'Bad day overall',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeUndefined();
      });
    });

    describe('Error Cases', () => {
      it('should reject missing structured object', () => {
        const data = {};

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('structured');
      });

      it('should reject missing symptoms', () => {
        const data = {
          structured: {
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('symptoms');
      });

      it('should reject missing activities', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('activities');
      });

      it('should reject missing triggers', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('triggers');
      });

      it('should reject missing notes', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            triggers: [],
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
        expect(error?.message).toContain('notes');
      });

      it('should reject invalid symptom value type (array)', () => {
        const data = {
          structured: {
            symptoms: {
              headache: ['severe'], // Arrays not allowed
            },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });

      it('should reject invalid symptom value type (object)', () => {
        const data = {
          structured: {
            symptoms: {
              headache: { level: 'severe' }, // Objects not allowed
            },
            activities: [],
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });

      it('should reject non-array activities', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: 'walking', // Should be array
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });

      it('should reject non-array triggers', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            triggers: 'stress', // Should be array
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });

      it('should reject non-string activity items', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: ['walking', 123], // Numbers not allowed
            triggers: [],
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });

      it('should reject non-string trigger items', () => {
        const data = {
          structured: {
            symptoms: { headache: 5 },
            activities: [],
            triggers: ['stress', true], // Booleans not allowed
            notes: '',
          },
        };

        const { error } = manualCheckinSchema.validate(data);
        expect(error).toBeDefined();
      });
    });
  });
});
