import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "./authStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("mobile auth persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    });
  });

  it("stores credentials in the intended stores and restores them after restart", async () => {
    const user = {
      id: "1",
      name: "Forge User",
      email: "user@example.com",
      openId: "open-1",
    };
    const secureGet = SecureStore.getItemAsync as jest.MockedFunction<
      typeof SecureStore.getItemAsync
    >;
    const asyncGet = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;

    await useAuthStore.getState().setToken("secure-token");
    await useAuthStore.getState().setUser(user);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "authToken",
      "secure-token"
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(user)
    );

    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
    });
    secureGet.mockResolvedValue("secure-token");
    asyncGet.mockResolvedValue(JSON.stringify(user));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      isLoading: false,
      token: "secure-token",
      user,
    });
  });

  it("clears the secure token and persisted user on logout", async () => {
    await useAuthStore.getState().logout();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("authToken");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("user");
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });
});
