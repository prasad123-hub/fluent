import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ScenarioLibrary } from "./library";
import type { LibraryScenario, LibraryTheme } from "./types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const themes: LibraryTheme[] = [
  {
    id: "daily-life",
    slug: "daily-life",
    title: "Daily Life",
    description: "Everyday talk.",
    icon: "Coffee",
  },
  {
    id: "interviews",
    slug: "interviews",
    title: "Interviews",
    description: "HR and panels.",
    icon: "UserCheck",
  },
];

function scenario(over: Partial<LibraryScenario>): LibraryScenario {
  return {
    id: "daily-introduce-yourself",
    themeId: "daily-life",
    themeTitle: "Daily Life",
    title: "Introducing yourself to a new flatmate",
    description: "You've just moved into a shared flat in Pune.",
    difficulty: "A2",
    mode: "roleplay",
    persona: {
      name: "Rohan Deshmukh",
      role: "your new flatmate",
      personality: "chatty",
      accent: "Indian English",
    },
    agentOpeningLine: "Hey! You must be the new flatmate.",
    learnerGoal: "Introduce yourself clearly.",
    successCriteria: ["States name", "Asks two questions"],
    keyVocabulary: ["hometown", "commute", "roommate"],
    usefulPhrases: ["I'm originally from Nashik.", "What about you?", "Shall we sort the Wi-Fi?"],
    commonMistakesToWatch: ["Myself Prasad (→ I'm Prasad)"],
    suggestedDurationMin: 6,
    tags: ["popular"],
    custom: false,
    ...over,
  };
}

const scenarios = [
  scenario({}),
  scenario({
    id: "interview-hr-screening",
    themeId: "interviews",
    themeTitle: "Interviews",
    title: "HR screening call",
    difficulty: "B1",
    mode: "interview",
  }),
];

function renderLibrary(customs: LibraryScenario[] = []) {
  return render(
    <ScenarioLibrary
      themes={themes}
      scenarios={scenarios}
      customScenarios={customs}
      favouriteIds={["interview-hr-screening"]}
      defaultDifficulty="B1"
    />,
  );
}

describe("ScenarioLibrary", () => {
  it("renders theme sections, counts and the create card", () => {
    renderLibrary();
    expect(screen.getByRole("heading", { name: /^Scenarios/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Daily Life/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Interviews/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /My scenarios/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Create your own/ }).length).toBeGreaterThan(0);
  });

  it("filters by search and difficulty", () => {
    renderLibrary();
    fireEvent.change(screen.getByLabelText("Search scenarios"), { target: { value: "screening" } });
    expect(screen.getByRole("button", { name: /Open HR screening call/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open Introducing yourself/ }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search scenarios"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("radio", { name: "A2" }));
    expect(screen.getByRole("button", { name: /Open Introducing yourself/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open HR screening call/ }),
    ).not.toBeInTheDocument();
  });

  it("shows only favourites when toggled", () => {
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: /Favourites/ }));
    expect(screen.getByRole("button", { name: /Open HR screening call/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open Introducing yourself/ }),
    ).not.toBeInTheDocument();
  });

  it("opens the detail sheet with a Practice this link", () => {
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: /Open Introducing yourself/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Rohan Deshmukh")).toBeInTheDocument();
    expect(within(dialog).getByText("Introduce yourself clearly.")).toBeInTheDocument();
    expect(within(dialog).getByText("hometown")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Practice this/ })).toHaveAttribute(
      "href",
      "/practice?scenario=daily-introduce-yourself",
    );
  });

  it("lists custom scenarios without a favourite control", () => {
    renderLibrary([
      scenario({
        id: "cm123",
        themeId: "custom",
        themeTitle: "My scenarios",
        title: "Meeting my CEO at an offsite",
        custom: true,
        prompt: "I'm meeting my CEO",
      }),
    ]);
    const open = screen.getByRole("button", { name: /Open Meeting my CEO/ });
    expect(open).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Add to favourites|Remove from favourites/ }),
    ).toHaveLength(2);
    fireEvent.click(open);
    expect(
      within(screen.getByRole("dialog")).getByRole("link", { name: /Practice this/ }),
    ).toHaveAttribute("href", "/practice?scenario=cm123");
  });

  it("opens the create dialog from the header button", () => {
    renderLibrary();
    fireEvent.click(screen.getAllByRole("button", { name: /Create your own/ })[0]!);
    expect(screen.getByRole("dialog", { name: /Create your own scenario/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Describe a situation in plain English/),
    ).toBeInTheDocument();
  });
});
