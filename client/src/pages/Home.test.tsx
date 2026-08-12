import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
  }),
}));

vi.mock("@/const", () => ({
  getLoginUrl: () => "/login",
  getSignUpUrl: () => "/signup",
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

describe("Home landing page", () => {
  it("presents accountable product messaging without fictional social proof or paid-plan CTAs", () => {
    render(<Home />);

    expect(
      screen.getByText("Built around GitHub-backed Jekyll workflows")
    ).toBeInTheDocument();
    expect(screen.getByText("Current availability")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Android distribution and paid packaging are not advertised/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/What our users are saying/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Start Pro Trial")).not.toBeInTheDocument();
  });
});
