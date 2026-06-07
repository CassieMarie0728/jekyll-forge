import React, { createContext, useContext, useState } from "react";

// Local Site type to avoid importing from drizzle/schema on the client
export type SiteInfo = {
  id: number;
  owner: string;
  repo: string;
  defaultBranch?: string | null;
  selectedBranch?: string | null;
  rootPath?: string | null;
  isJekyll?: boolean | null;
  isFavorite?: boolean | null;
  timezone?: string | null;
  defaultLayout?: string | null;
  defaultAssetPath?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type WorkspaceContextType = {
  activeSite: SiteInfo | null;
  setActiveSite: (site: SiteInfo | null) => void;
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeSite: null,
  setActiveSite: () => {},
  activeBranch: "main",
  setActiveBranch: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeSite, setActiveSite] = useState<SiteInfo | null>(null);
  const [activeBranch, setActiveBranch] = useState("main");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <WorkspaceContext.Provider value={{
      activeSite, setActiveSite,
      activeBranch, setActiveBranch,
      commandPaletteOpen, setCommandPaletteOpen,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
