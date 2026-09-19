import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { ApiSubject } from "@/types/onboarding";
import { PracticeConfigurator } from "./practice-configurator";

const SUBJECTS: ApiSubject[] = [
  { id: "uuid-eng", code: "ENG", name: "Use of English" },
  { id: "uuid-mth", code: "MTH", name: "Mathematics" },
  { id: "uuid-phy", code: "PHY", name: "Physics" },
  { id: "uuid-chm", code: "CHM", name: "Chemistry" },
];

/** The clickable card surface that wraps a subject's toggle and its stepper. */
function subjectCard(name: string): HTMLElement {
  const row = screen.getByRole("button", { name }).parentElement;
  if (!row?.parentElement) throw new Error(`No subject card found for ${name}`);
  return row.parentElement;
}

const subjectToggle = (name: string) => screen.getByRole("button", { name });

const questionInput = (subjectName: string) =>
  screen.getByLabelText(
    `Questions for ${subjectName}`,
  ) as HTMLInputElement;

const stepQuestions = (subjectName: string, direction: "Increase" | "Decrease") =>
  fireEvent.click(
    screen.getByRole("button", {
      // The stepper derives its accessible name from its label, lower-cased.
      name: `${direction} questions for ${subjectName.toLowerCase()}`,
    }),
  );

const timeInput = () =>
  screen.getByLabelText("Duration in minutes") as HTMLInputElement;

/** The mobile bar states the derived totals in one place. */
const totalsText = () =>
  screen.getByText(/^\d+ questions$/).textContent ?? "";

function renderConfigurator(subjects: ApiSubject[] = SUBJECTS) {
  const onStart = vi.fn();
  render(<PracticeConfigurator subjects={subjects} onStart={onStart} />);
  return { onStart };
}

/**
 * These tests render the full setup (base-ui Dialog/Drawer included), which is
 * noticeably slower when the whole suite runs in parallel — hence the timeout.
 */
describe("PracticeConfigurator", { timeout: 30_000 }, () => {
  it("starts every enrolled subject at the default question count", () => {
    renderConfigurator();

    expect(subjectToggle("Use of English")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(questionInput("Physics").value).toBe("10");
    expect(totalsText()).toContain("40 questions");
    expect(timeInput().value).toBe("40");
  });

  it("selects and deselects a subject from anywhere on its card", () => {
    renderConfigurator();

    fireEvent.click(subjectCard("Physics"));

    expect(subjectToggle("Physics")).toHaveAttribute("aria-pressed", "false");
    expect(questionInput("Physics").value).toBe("0");
    expect(totalsText()).toContain("30 questions");
    // The suggested time keeps following the question total.
    expect(timeInput().value).toBe("30");

    fireEvent.click(subjectCard("Physics"));

    expect(subjectToggle("Physics")).toHaveAttribute("aria-pressed", "true");
    expect(questionInput("Physics").value).toBe("10");
    expect(totalsText()).toContain("40 questions");
  });

  it("changes a subject's count from its stepper without toggling the subject", () => {
    renderConfigurator();

    stepQuestions("Physics", "Increase");

    expect(subjectToggle("Physics")).toHaveAttribute("aria-pressed", "true");
    expect(questionInput("Physics").value).toBe("11");
    expect(totalsText()).toContain("41 questions");
    expect(timeInput().value).toBe("41");

    stepQuestions("Physics", "Decrease");

    expect(questionInput("Physics").value).toBe("10");
  });

  it("deselects a subject at a count of 0 and reselects it by counting up", () => {
    renderConfigurator();

    for (let step = 0; step < 10; step += 1) {
      stepQuestions("Physics", "Decrease");
    }

    expect(questionInput("Physics").value).toBe("0");
    expect(subjectToggle("Physics")).toHaveAttribute("aria-pressed", "false");
    expect(totalsText()).toContain("30 questions");

    stepQuestions("Physics", "Increase");

    expect(subjectToggle("Physics")).toHaveAttribute("aria-pressed", "true");
    expect(totalsText()).toContain("31 questions");
  });

  it("will not select a fifth subject until one is deselected", () => {
    renderConfigurator([
      ...SUBJECTS,
      { id: "uuid-bio", code: "BIO", name: "Biology" },
    ]);

    expect(subjectToggle("Biology")).toBeDisabled();
    expect(questionInput("Biology")).toBeDisabled();

    fireEvent.click(subjectCard("Chemistry"));

    expect(subjectToggle("Biology")).toBeEnabled();
    fireEvent.click(subjectCard("Biology"));

    expect(subjectToggle("Biology")).toHaveAttribute("aria-pressed", "true");
    expect(subjectToggle("Chemistry")).toHaveAttribute("aria-pressed", "false");
    expect(totalsText()).toContain("40 questions");
  });

  it("keeps a chosen time when question counts change, and can reset it", () => {
    renderConfigurator();

    fireEvent.click(screen.getByRole("button", { name: "15 min" }));
    expect(timeInput().value).toBe("15");
    expect(
      screen.getByRole("button", { name: "15 min" }),
    ).toHaveAttribute("aria-pressed", "true");

    // The explicit choice is sticky: later question changes must not move it.
    stepQuestions("Physics", "Increase");
    expect(timeInput().value).toBe("15");
    expect(totalsText()).toContain("41 questions");

    fireEvent.click(screen.getByRole("button", { name: /reset to suggested/i }));

    expect(timeInput().value).toBe("41");
  });

  it("accepts an exact time typed into the time stepper", () => {
    renderConfigurator();

    fireEvent.change(timeInput(), { target: { value: "7" } });
    fireEvent.blur(timeInput());

    expect(timeInput().value).toBe("7");
    stepQuestions("Physics", "Increase");
    expect(timeInput().value).toBe("7");
  });

  it("blocks starting until at least one subject is selected", () => {
    renderConfigurator();

    for (const name of ["Use of English", "Mathematics", "Physics", "Chemistry"]) {
      fireEvent.click(subjectCard(name));
    }

    expect(totalsText()).toContain("0 questions");
    expect(
      screen.getAllByText("Select at least one subject to practice.").length,
    ).toBeGreaterThan(0);
    for (const button of screen.getAllByRole("button", {
      name: /review & start/i,
    })) {
      expect(button).toBeDisabled();
    }
  });

  it("starts the practice from the shared confirmation", () => {
    const { onStart } = renderConfigurator();

    const [desktopTrigger] = screen.getAllByRole("button", {
      name: /review & start/i,
    });
    fireEvent.click(desktopTrigger);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Subject breakdown")).toBeInTheDocument();
    expect(within(dialog).getByText("Use of English")).toBeInTheDocument();
    // Questions and minutes are both 40 for the default setup.
    expect(within(dialog).getAllByText("40")).toHaveLength(2);

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Start Practice" }),
    );

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({
      subjects: [
        { subjectCode: "ENG", questionCount: 10 },
        { subjectCode: "MTH", questionCount: 10 },
        { subjectCode: "PHY", questionCount: 10 },
        { subjectCode: "CHM", questionCount: 10 },
      ],
      totalTimeMinutes: 40,
    });
  });

  it("returns to the setup screen from Edit", () => {
    const { onStart } = renderConfigurator();

    const [desktopTrigger] = screen.getAllByRole("button", {
      name: /review & start/i,
    });
    fireEvent.click(desktopTrigger);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));

    expect(onStart).not.toHaveBeenCalled();
    expect(screen.queryByText("Subject breakdown")).not.toBeInTheDocument();
  });

  it("confirms in the mobile drawer with the same content", () => {
    const { onStart } = renderConfigurator();

    const triggers = screen.getAllByRole("button", {
      name: /review & start/i,
    });
    fireEvent.click(triggers[triggers.length - 1]);

    // The Drawer variant renders the shared confirmation content.
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Subject breakdown")).toBeInTheDocument();

    fireEvent.click(
      within(drawer).getByRole("button", { name: "Start Practice" }),
    );

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
