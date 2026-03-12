import { vi } from "vitest";

// Mock Supabase channel for broadcast
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
  send: vi.fn().mockResolvedValue({}),
};

// Chainable query builder mock
const createQueryBuilder = (data: any = null, error: any = null) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve) => resolve({ data: data ? [data] : [], error })),
  };
  // Make it thenable for await
  Object.defineProperty(builder, "then", {
    value: (resolve: any) => resolve({ data: data ? (Array.isArray(data) ? data : [data]) : [], error }),
  });
  return builder;
};

export const createMockSupabase = () => ({
  from: vi.fn(() => createQueryBuilder()),
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
});

export { mockChannel, createQueryBuilder };
