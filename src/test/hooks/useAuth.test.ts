import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
  },
}));

describe("useAuth", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockSession = { user: mockUser, access_token: "token-abc" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
  });

  it("should start with loading state", () => {
    const { result } = renderHook(() => useAuth());
    // Initially loading or quickly resolves
    expect(result.current.user).toBeNull();
  });

  it("should set user when session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      cb("SIGNED_IN", mockSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("should handle signOut correctly", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));

    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signOut();
    expect(error).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should handle signIn correctly", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signIn("test@example.com", "password");
    expect(error).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
  });

  it("should handle signIn error", async () => {
    const authError = { message: "Invalid login credentials" };
    mockSignInWithPassword.mockResolvedValue({ error: authError });

    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signIn("bad@example.com", "wrong");
    expect(error).toEqual(authError);
  });

  it("should handle signUp correctly", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    const { error } = await result.current.signUp("new@example.com", "password123");
    expect(error).toBeNull();
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "password123",
      })
    );
  });

  it("should be unauthenticated when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
