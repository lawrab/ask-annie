# Common Code Patterns

## Backend Patterns

### Standard Route
router.post('/endpoint',
  authenticate,
  validate(schema),
  async (req, res) => {
    try {
      const result = await service.method(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

### Test Pattern
describe('POST /api/endpoint', () => {
  it('should handle authenticated requests', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/endpoint')
      .set('Authorization', 'Bearer ' + token)
      .send(validData)
      .expect(201);
    expect(res.body).toHaveProperty('id');
  });
});

## Frontend Patterns

### Component with Design System
import { Button, Card } from '@/components/ui';

export const Feature = () => {
  return (
    <Card>
      <Button variant="primary">Action</Button>
    </Card>
  );
};

### Zustand Store
import { create } from 'zustand';

export const useStore = create((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
