import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// The /design-system gallery (ARCHITECTURE §7.4): a dev/design aid that renders
// the ADR-010 color tokens, the Inter type scale, and the first batch of
// shadcn/ui primitives so the team can visually QA them across light/dark.
// It renders through the AppLayout shell (nested under the pathless `_app`
// layout route). The theme is now driven by the canonical header switcher
// (TICKET-005) — the TICKET-004 in-page demo toggle was removed.
export const Route = createFileRoute("/_app/design-system")({
  component: DesignSystemPage,
});

// --- Color tokens (Section 1) -----------------------------------------------

// Curated list of the ADR-010 / shadcn core tokens. Each swatch renders with
// the real token utilities so switching theme recolors it live (proves the
// tokens are theme-driven, not hard-coded). Pairs render fg-on-bg; standalone
// tokens (border/input/ring) render as a bordered chip.
interface ColorToken {
  name: string;
  // Tailwind utility classes that paint the swatch using the token.
  className: string;
  note: string;
}

const COLOR_PAIRS: readonly ColorToken[] = [
  {
    name: "background / foreground",
    className: "bg-background text-foreground",
    note: "Page canvas + default text",
  },
  {
    name: "card / card-foreground",
    className: "bg-card text-card-foreground",
    note: "Raised content surfaces",
  },
  {
    name: "popover / popover-foreground",
    className: "bg-popover text-popover-foreground",
    note: "Floating menus, selects",
  },
  {
    name: "primary / primary-foreground",
    className: "bg-primary text-primary-foreground",
    note: "Primary actions, emphasis",
  },
  {
    name: "secondary / secondary-foreground",
    className: "bg-secondary text-secondary-foreground",
    note: "Secondary actions",
  },
  {
    name: "muted / muted-foreground",
    className: "bg-muted text-muted-foreground",
    note: "Subdued fills + helper text",
  },
  {
    name: "accent / accent-foreground",
    className: "bg-accent text-accent-foreground",
    note: "Hover + highlight states",
  },
  {
    name: "destructive / destructive-foreground",
    className: "bg-destructive text-destructive-foreground",
    note: "Errors, destructive actions",
  },
] as const;

// Standalone tokens used for lines/edges/focus rather than fills.
const COLOR_LINES: readonly ColorToken[] = [
  { name: "border", className: "bg-border", note: "Default edges + dividers" },
  { name: "input", className: "bg-input", note: "Form control borders" },
  { name: "ring", className: "bg-ring", note: "Focus rings" },
] as const;

// --- Typography scale (Section 2) -------------------------------------------

interface TypeSample {
  className: string;
  label: string;
  note: string;
  sample: string;
}

const TYPE_SCALE: readonly TypeSample[] = [
  {
    className: "text-4xl font-bold tracking-tight",
    label: "Display / text-4xl · 700",
    note: "Marketing / empty-state hero",
    sample: "Build a quiz in minutes",
  },
  {
    className: "text-2xl font-semibold tracking-tight",
    label: "H1 / text-2xl · 600",
    note: "Page title",
    sample: "Untitled questionnaire",
  },
  {
    className: "text-xl font-semibold",
    label: "H2 / text-xl · 600",
    note: "Section heading",
    sample: "Questions",
  },
  {
    className: "text-lg font-medium",
    label: "H3 / text-lg · 500",
    note: "Sub-section / card title",
    sample: "Answer options",
  },
  {
    className: "text-base",
    label: "Body / text-base · 400",
    note: "Default paragraph copy",
    sample: "Add a question, then give respondents a few ways to answer it.",
  },
  {
    className: "text-sm text-muted-foreground",
    label: "Small · muted / text-sm · 400",
    note: "Caption / helper text",
    sample: "Respondents won't see this note.",
  },
] as const;

const WEIGHT_SAMPLES: readonly { weight: string; className: string }[] = [
  { weight: "Regular · 400", className: "font-normal" },
  { weight: "Medium · 500", className: "font-medium" },
  { weight: "Semibold · 600", className: "font-semibold" },
  { weight: "Bold · 700", className: "font-bold" },
] as const;

// --- Small presentational helpers -------------------------------------------

// Section wrapper: an indexed eyebrow + heading + intro. The index reflects the
// gallery's real three-part structure, not decoration.
function Section({
  index,
  title,
  intro,
  children,
}: {
  index: string;
  title: string;
  intro: string;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-muted-foreground text-xs tracking-widest">
          {index}
        </span>
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="max-w-prose text-muted-foreground text-sm">{intro}</p>
      </div>
      {children}
    </section>
  );
}

// A labeled showcase block for a single primitive. Batch-2 primitives slot in
// by adding more of these — no structural rework needed.
function Showcase({
  name,
  note,
  children,
}: {
  name: string;
  note: string;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{name}</CardTitle>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {children}
      </CardContent>
    </Card>
  );
}

// --- Page -------------------------------------------------------------------

function DesignSystemPage(): ReactElement {
  return (
    <div className="flex flex-col gap-12">
      {/* Header. The theme is controlled by the canonical header switcher. */}
      <header className="flex flex-col gap-1">
        <span className="font-mono text-muted-foreground text-xs tracking-widest">
          DESIGN SYSTEM
        </span>
        <h1 className="font-semibold text-3xl tracking-tight">
          Tokens, type &amp; components
        </h1>
        <p className="max-w-prose text-muted-foreground text-sm">
          A living reference for the questionnaire creator. Use the header theme
          switcher to check every token and component in light and dark.
        </p>
      </header>

      <Separator />

      {/* Section 1 — Colors */}
      <Section
        index="01 · COLORS"
        title="Color tokens"
        intro="Every swatch is painted by its ADR-010 token, so toggling the theme recolors all of them live. The token name is the label — that is the vocabulary you reach for in class names."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COLOR_PAIRS.map((token) => (
            <div
              key={token.name}
              className={`flex flex-col gap-1 rounded-lg border p-4 ${token.className}`}
            >
              <span className="font-medium font-mono text-sm">
                {token.name}
              </span>
              <span className="text-xs opacity-80">{token.note}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {COLOR_LINES.map((token) => (
            <div
              key={token.name}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground"
            >
              <span
                className={`size-8 shrink-0 rounded-md ${token.className}`}
                aria-hidden
              />
              <span className="flex flex-col">
                <span className="font-medium font-mono text-sm">
                  {token.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {token.note}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      {/* Section 2 — Typography */}
      <Section
        index="02 · TYPOGRAPHY"
        title="Inter type scale"
        intro="Inter (400 / 500 / 600 / 700) is the single family across the app. Each step below pairs the rendered sample with its intended role."
      >
        <div className="flex flex-col divide-y rounded-lg border">
          {TYPE_SCALE.map((entry) => (
            <div
              key={entry.label}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <p className={entry.className}>{entry.sample}</p>
              <span className="shrink-0 font-mono text-muted-foreground text-xs">
                {entry.label} — {entry.note}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 rounded-lg border p-4">
          {WEIGHT_SAMPLES.map((entry) => (
            <div key={entry.weight} className="flex flex-col gap-1">
              <span className={`text-lg ${entry.className}`}>Aa Gg 123</span>
              <span className="font-mono text-muted-foreground text-xs">
                {entry.weight}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      {/* Section 3 — Components */}
      <Section
        index="03 · COMPONENTS"
        title="First-batch primitives"
        intro="The form + layout foundations upcoming pages reuse. Each block shows a primitive's variants/states plus a one-line usage note. Batch-2 overlays (Dialog, Tooltip, etc.) slot in as more blocks here."
      >
        <Showcase name="Button" note="Actions across the app.">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </Showcase>

        <Showcase
          name="Input + Label"
          note="Text fields with an associated label."
        >
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Label htmlFor="ds-title">Questionnaire title</Label>
            <Input id="ds-title" placeholder="e.g. Onboarding survey" />
          </div>
        </Showcase>

        <Showcase name="Textarea" note="Multi-line copy and long answers.">
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Label htmlFor="ds-desc">Description</Label>
            <Textarea id="ds-desc" placeholder="What is this quiz about?" />
          </div>
        </Showcase>

        <Showcase name="Select" note="Single choice from a list of options.">
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Label htmlFor="ds-type">Question type</Label>
            <Select>
              <SelectTrigger id="ds-type" className="w-full">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single choice</SelectItem>
                <SelectItem value="multiple">Multiple choice</SelectItem>
                <SelectItem value="text">Free text</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Showcase>

        <Showcase
          name="Checkbox"
          note="Multi-select questionnaire answers. Each option is a padded, bordered container that highlights the whole row on hover (matches the RadioGroup answer pattern)."
        >
          <div className="grid w-full gap-3">
            <Label className="cursor-pointer items-center gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Checkbox defaultChecked />
              Red
            </Label>
            <Label className="cursor-pointer items-center gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Checkbox />
              Green
            </Label>
            <Label className="cursor-pointer items-center gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
              <Checkbox />
              Blue
            </Label>
            <Label className="cursor-not-allowed items-center gap-3 rounded-lg border border-input p-4 opacity-60">
              <Checkbox disabled />
              Locked option
            </Label>
          </div>
        </Showcase>

        <Showcase
          name="RadioGroup"
          note="One choice from a small, visible set. Each option is a padded, bordered container that highlights the whole row on hover."
        >
          <RadioGroup defaultValue="one" className="gap-3">
            <Label className="cursor-pointer items-center gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
              <RadioGroupItem value="one" />
              One at a time
            </Label>
            <Label className="cursor-pointer items-center gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
              <RadioGroupItem value="all" />
              All questions on one page
            </Label>
          </RadioGroup>
        </Showcase>

        <Showcase name="Switch" note="Instant on/off behavior toggles.">
          <Label className="cursor-pointer gap-2">
            <Switch defaultChecked />
            Paginated
          </Label>
          <Label className="cursor-pointer gap-2">
            <Switch />
            Fixed answer order
          </Label>
        </Showcase>

        <Showcase name="Card" note="The primary content container.">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Customer feedback</CardTitle>
              <CardDescription>Survey · 8 questions</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Cards group a single unit of content — a question, a result, or a
              questionnaire in a list.
            </CardContent>
          </Card>
        </Showcase>

        <Showcase name="Tabs" note="Switch between sections of one surface.">
          <Tabs defaultValue="questions" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent
              value="questions"
              className="pt-2 text-muted-foreground text-sm"
            >
              Build and reorder questions.
            </TabsContent>
            <TabsContent
              value="settings"
              className="pt-2 text-muted-foreground text-sm"
            >
              Control behavior and access.
            </TabsContent>
            <TabsContent
              value="results"
              className="pt-2 text-muted-foreground text-sm"
            >
              Review responses.
            </TabsContent>
          </Tabs>
        </Showcase>

        <Showcase name="Badge" note="Compact status and category labels.">
          <Badge>Published</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="outline">Quiz</Badge>
          <Badge variant="destructive">Archived</Badge>
        </Showcase>

        <Showcase name="Separator" note="A quiet divider between content.">
          <div className="flex w-full max-w-sm flex-col gap-2">
            <span className="text-sm">Above the line</span>
            <Separator />
            <span className="text-muted-foreground text-sm">
              Below the line
            </span>
          </div>
        </Showcase>
      </Section>
    </div>
  );
}
