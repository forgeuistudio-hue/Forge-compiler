import { ForgeGraph } from "../types";

/**
 * Forge Golden Test Suite
 * Canonical prompts and expected DSL structures for stability validation.
 */

export interface GoldenTest {
  name: string;
  prompt: string;
  expectedDSL?: Partial<ForgeGraph>;
  expectedJSX?: string;
  assertions?: {
    containsClasses?: string[];
    containsNodes?: string[];
  };
}

export const GOLDEN_TEST_SUITE: GoldenTest[] = [
  {
    name: "SaaS Dashboard Header",
    prompt: "A professional SaaS dashboard header with a search bar, a notification bell icon, and a user profile section with an avatar and name.",
    assertions: {
      containsClasses: ["flex-row", "justify-between", "items-center", "gap-["],
      containsNodes: ["input", "custom", "image", "text"]
    }
  },
  {
    name: "Pricing Card",
    prompt: "A modern pricing card with a blue header, three feature list items, and a primary 'Get Started' button.",
    assertions: {
      containsClasses: ["flex-col", "bg-[", "font-bold", "p-["],
      containsNodes: ["container", "text", "button"]
    }
  },
  {
    name: "Login Form",
    prompt: "A simple login card with a title, an email input, and a primary login button.",
    assertions: {
      containsClasses: ["flex-col", "gap-["],
      containsNodes: ["text", "input", "button"]
    }
  },
  {
    name: "Navigation Bar",
    prompt: "A responsive navigation bar with a logo on the left and four links on the right.",
    assertions: {
      containsClasses: ["flex-row", "justify-between"],
      containsNodes: ["container", "text"]
    }
  },
  {
    name: "Feature Grid",
    prompt: "A 3-column feature grid where each item has an icon, a title, and a short description.",
    assertions: {
      containsClasses: ["flex-row", "gap-["],
      containsNodes: ["container", "custom", "text"]
    }
  }
];
