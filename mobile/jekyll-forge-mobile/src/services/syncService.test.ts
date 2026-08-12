jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));

jest.mock("./offlineStorage", () => ({
  offlineStorage: {
    addToSyncQueue: jest.fn(),
    getSyncQueue: jest.fn().mockResolvedValue([]),
    removeFromSyncQueue: jest.fn(),
    updateSyncQueueItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { syncService } from "./syncService";
import { offlineStorage } from "./offlineStorage";

const mockGetSyncQueue = offlineStorage.getSyncQueue as jest.MockedFunction<
  typeof offlineStorage.getSyncQueue
>;
const mockUpdateSyncQueueItem =
  offlineStorage.updateSyncQueueItem as jest.MockedFunction<
    typeof offlineStorage.updateSyncQueueItem
  >;

describe("mobile offline sync recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockGetSyncQueue.mockResolvedValue([
      {
        id: "queued-update",
        action: "update",
        data: { id: 3, markdown: "offline change" },
        timestamp: 0,
        retries: 2,
        status: "pending",
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves a terminally failed operation for user recovery", async () => {
    syncService.configureProcessor(async () => {
      throw new Error("Network request rejected");
    });

    await syncService.setOnlineStatus(true);

    expect(mockUpdateSyncQueueItem).toHaveBeenCalledWith("queued-update", {
      retries: 3,
      status: "failed",
      lastError: "Network request rejected",
    });
  });
});
