import { Fragment } from "react";

/** Renders the agent's tiny markdown subset: **bold**, line breaks and "- " bullets. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = line.startsWith("- ");
        const body = (bullet ? line.slice(2) : line).split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? <b key={j}>{part.slice(2, -2)}</b> : <Fragment key={j}>{part}</Fragment>,
        );
        return (
          <div key={i} style={bullet ? { paddingLeft: 14, textIndent: -10 } : line === "" ? { height: 8 } : undefined}>
            {bullet && "· "}
            {body}
          </div>
        );
      })}
    </>
  );
}
