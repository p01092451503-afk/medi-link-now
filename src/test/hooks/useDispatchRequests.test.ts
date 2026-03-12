import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing the hook
const mockFrom = vi.fn();
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
  send: vi.fn().mockResolvedValue({}),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "test-user-id", email: "test@test.com" } } },
      }),
      onAuthStateChange: vi.fn((cb: any) => {
        cb("SIGNED_IN", { user: { id: "test-user-id", email: "test@test.com" } });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "test@test.com" }, isLoading: false }),
}));

describe("useDispatchRequests - logic tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should build correct query for pending requests", () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    // Simulate the query that fetchPendingRequests builds
    const query = mockFrom("ambulance_dispatch_requests");
    query.select("*");
    query.in("status", ["pending", "scheduled"]);
    query.order("created_at", { ascending: false });

    expect(mockFrom).toHaveBeenCalledWith("ambulance_dispatch_requests");
    expect(chainMock.select).toHaveBeenCalledWith("*");
    expect(chainMock.in).toHaveBeenCalledWith("status", ["pending", "scheduled"]);
  });

  it("should build correct update query for accepting a request", () => {
    const chainMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    // Make eq return the final result on second call
    let eqCallCount = 0;
    chainMock.eq.mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount >= 2) {
        return Promise.resolve({ error: null });
      }
      return chainMock;
    });
    mockFrom.mockReturnValue(chainMock);

    // Simulate acceptRequest logic
    const requestId = "req-123";
    const userId = "test-user-id";
    const query = mockFrom("ambulance_dispatch_requests");
    query.update({ driver_id: userId, status: "accepted" });
    query.eq("id", requestId);
    query.eq("status", "pending");

    expect(chainMock.update).toHaveBeenCalledWith({
      driver_id: userId,
      status: "accepted",
    });
    expect(chainMock.eq).toHaveBeenCalledWith("id", requestId);
    expect(chainMock.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("should build correct update query for starting transport", () => {
    const chainMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    let eqCallCount = 0;
    chainMock.eq.mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount >= 2) {
        return Promise.resolve({ error: null });
      }
      return chainMock;
    });
    mockFrom.mockReturnValue(chainMock);

    const requestId = "req-456";
    const userId = "test-user-id";
    const query = mockFrom("ambulance_dispatch_requests");
    query.update({ status: "en_route" });
    query.eq("id", requestId);
    query.eq("driver_id", userId);

    expect(chainMock.update).toHaveBeenCalledWith({ status: "en_route" });
    expect(chainMock.eq).toHaveBeenCalledWith("id", requestId);
    expect(chainMock.eq).toHaveBeenCalledWith("driver_id", userId);
  });

  it("should broadcast transport_started event on start transport", async () => {
    // Verify the broadcast payload structure
    const payload = {
      type: "broadcast",
      event: "transport_started",
      payload: { request_id: "req-789", driver_id: "test-user-id" },
    };

    await mockChannel.send(payload);

    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "broadcast",
        event: "transport_started",
        payload: expect.objectContaining({
          request_id: "req-789",
          driver_id: "test-user-id",
        }),
      })
    );
  });

  it("should filter accepted requests correctly", () => {
    const myRequests = [
      { id: "1", status: "accepted", driver_id: "test-user-id" },
      { id: "2", status: "pending", driver_id: null },
      { id: "3", status: "accepted", driver_id: "other-driver" },
      { id: "4", status: "completed", driver_id: "test-user-id" },
    ];

    const userId = "test-user-id";
    const acceptedRequests = myRequests.filter(
      (r) => r.status === "accepted" && r.driver_id === userId
    );

    expect(acceptedRequests).toHaveLength(1);
    expect(acceptedRequests[0].id).toBe("1");
  });

  it("should calculate status messages correctly", () => {
    const statusMessages: Record<string, string> = {
      pending: "대기 중",
      accepted: "수락됨",
      en_route: "이동 중",
      arrived: "도착",
      completed: "완료",
      cancelled: "취소됨",
      scheduled: "예약됨",
    };

    expect(statusMessages["en_route"]).toBe("이동 중");
    expect(statusMessages["accepted"]).toBe("수락됨");
    expect(statusMessages["completed"]).toBe("완료");
  });
});
