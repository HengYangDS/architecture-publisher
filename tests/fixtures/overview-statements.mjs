/**
 * Overview statements for the minimal model's two parts, Alpha (`a`) and Beta (`b`): one that holds every kind of
 * block an overview states, so a test of the model or of the page meets each of them once.
 */
export const everyBlock = () => ({
  claim: "Two parts, and the one call between them",
  lead: "Alpha calls Beta once a request has passed its check; nothing else crosses between them.",
  course: {
    steps: [
      {
        id: "ask",
        label: "Ask",
        note: "a request arrives",
        text: "A request names what it wants and who asks.",
      },
      {
        id: "work",
        label: "Work",
        note: "two requests at a time",
        tracks: 2,
        stations: [
          { id: "check", label: "Check", note: "the request is admitted" },
          { id: "call", part: "a", note: "it calls" },
          { id: "answer", part: "b", note: "it answers" },
        ],
        text: "Two requests may be worked at once, each on its own track.",
      },
      {
        id: "keep",
        label: "Keep",
        note: "the record is written",
        text: "The answer and its request are kept together.",
      },
    ],
    lines: [{ from: "keep", to: ["ask"], label: "a kept answer may be asked for again" }],
  },
  courses: [
    {
      title: "One call, checked",
      stations: [
        { id: "in", label: "In", note: "the request" },
        { id: "judge", label: "Judge" },
        { id: "out", label: "Out", note: "the answer" },
      ],
      pass: { after: "judge", label: "pass" },
      aside: { from: "judge", label: "refused: nothing is called" },
      text: "A refused request is answered at once with its reason.",
    },
  ],
  facts: [
    {
      title: "What Alpha holds",
      items: [
        ["state", "none between two calls"],
        ["limit", "one call at a time"],
      ],
    },
    {
      title: "Who decides",
      columns: ["What", "Who"],
      rows: [
        ["The call", "Alpha"],
        ["The answer", "Beta"],
      ],
    },
    {
      title: "Around it",
      lists: [
        { title: "Before", items: [["setup", "once, by hand"]] },
        { title: "After", items: [["review", "every week"]] },
      ],
    },
  ],
});
