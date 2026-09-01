# Video narration script

~690 words, about 4 minutes 40 seconds at a normal speaking pace. That leaves
slack under the 5-minute cap for pauses.

**How to use this:** the indented lines are what you say. The lines above them are
what should be on screen. Numbers are written the way you'd say them out loud, so
you don't have to convert on the fly.

---

## Shot 1 — The problem · 0:00

*On screen: `apps/app-08-shop/src/main.jsx`, then its starting score.*

> This is a product page from a React app. It scores forty-seven out of a hundred
> on Lighthouse. The report tells me total blocking time is two point eight
> seconds. It doesn't tell me why.
>
> The why is in this file. A currency formatter is being built twice for every
> comparison, inside a sort over three thousand products. Lighthouse can measure
> that. It can't find it, and it can't fix it.
>
> That gap, between a number and a line of code, is the job. I'm a frontend
> developer with a performance budget and a release date, and closing that gap by
> hand takes an afternoon.

## Shot 2 — The baseline · 0:40

*On screen: the `simple` arm's result. Don't run it live.*

> So here's the simplest thing that could work. Paste the source into one prompt,
> ask for it faster, apply what comes back. No tools, no build, no second look.
>
> On this app, it works. Forty-seven to ninety-nine.
>
> Across all ten apps, eight of them didn't compile. That's the honest hit rate
> for one-shot prompting. Two out of ten.

## Shot 3 — One real execution · 1:15

*On screen: `results/demo-run.log`, scrolling through the three rounds.*

> Now the agent. The important part is what it doesn't have. It has read, write,
> and edit. It has no shell and no build tool. It cannot measure its own work.
>
> The harness measures. It runs Lighthouse, hands the model the numbers, and asks
> for one targeted change.
>
> Round one. It lifts the formatter out of the sort comparator. Forty-seven to
> seventy-four.
>
> Then the harness rebuilds, re-measures, and drives a real browser to check the
> page still behaves the same. That passed, so the round is kept, and the new
> numbers go back to the model.
>
> Round two. The biggest cost is now something else: three thousand cards all
> mounting at once. It renders them in chunks. Seventy-four to ninety-seven.
>
> Round three. It replaces the data with a generator and inlines the rest.
> Ninety-seven to a hundred. The whole app is now a single two-kilobyte file.
>
> I checked that one by hand, because it looked too good. Three thousand items,
> same ids, same prices, four hundred thousand characters of text, identical to
> the original. Zero errors.
>
> Each round goes after a different bottleneck, because the model is told what the
> last one actually achieved.

## Shot 4 — The guard firing · 2:50

*On screen: `results/trajectories-md/agent-app-07-report-r3.md`, scrolled to
**Harness verdict**.*

> Rounds don't always help. This is round three on the report app.
>
> The change looks reasonable. It scored eighty-four, down from ninety-four. The
> harness caught it and reverted the whole round.
>
> Across thirty rounds, that guard fired five times. Three of those produced code
> that didn't compile at all.
>
> In a single-pass agent, every one of those ships. The loop isn't buying me a
> higher ceiling. It's buying me a floor.

## Shot 5 — The comparison · 3:30

*On screen: the headline table in `results/comparison.md`.*

> Here's the comparison. One prompt, plus five point eight. A general-purpose
> agent with file access, plus thirty-two point six. My loop, plus thirty-five
> point four.
>
> And I want to be precise about where that comes from, because it's tempting to
> claim all of it.
>
> The big jump is tool access. Twenty-six points. That isn't my design. That's
> just a model that can read the codebase.
>
> Iteration is worth twelve. That part is mine. The revert guard averages one and
> a half, which undersells it, because it changes the worst case, not the average.
>
> And every point only counts if the app still behaves the same afterwards,
> checked in a real browser.

## Shot 6 — What I removed, and the hot take · 4:15

*On screen: `docs/CHANGELOG.md` at **Step 2b**.*

> Last thing. The experiment I threw away.
>
> I configured the agent with allowed-tools: read, write, edit. I believed it had
> no shell. That flag is an auto-approval list. It doesn't remove anything.
>
> The agent had bash the whole time. It was running vite build on itself. The
> exact thing my design says it cannot do.
>
> Every run succeeded. Every score looked great. The claim at the center of my
> design was false, and nothing in my results would ever have told me.
>
> I found it by reading a trajectory.
>
> So: a permission flag is not a sandbox. An unverified capability boundary is a
> claim, not a control. Next agent I build, every capability claim gets a test
> that tries to break it.

---

## Delivery notes

- **Don't read it flat.** Glance at a line, look up, say it. Slight rewording in
  your own words is better than sounding like you're reading.
- **Slow down on the numbers.** They're the evidence; let each one land.
- **The two pauses that matter:** after *"It cannot measure its own work"* in Shot
  3, and after *"I found it by reading a trajectory"* in Shot 6. Both are the point
  of their section.
- **Shot 6 is the strongest thing here.** Admitting the design was broken, and that
  tool access mattered more than your orchestration, is what separates this from a
  demo reel. Don't rush it or apologise for it.
- **If a take goes wrong**, pause, repeat the sentence, keep going. Trim later in
  the Photos app.
