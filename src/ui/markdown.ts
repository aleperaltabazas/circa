export type MdNode = string | { tag: "em" | "strong" | "u"; children: MdNode[] };

type Mark = { delim: string; tag: "em" | "strong" | "u" };

// Order matters: try longer delimiters first so `**` wins over `*`.
const MARKS: Mark[] = [
  { delim: "**", tag: "strong" },
  { delim: "__", tag: "u" },
  { delim: "*", tag: "em" },
];

export function parseMarkdown(input: string): MdNode[] {
  const out: MdNode[] = [];
  let buf = "";

  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = "";
    }
  };

  let i = 0;
  while (i < input.length) {
    const c = input[i];

    // Escape: backslash followed by any char emits that char literally.
    if (c === "\\" && i + 1 < input.length) {
      buf += input[i + 1];
      i += 2;
      continue;
    }

    let handled = false;
    for (const mark of MARKS) {
      if (input.startsWith(mark.delim, i)) {
        const closeIdx = findClose(input, i + mark.delim.length, mark.delim);
        if (closeIdx !== -1) {
          flush();
          const inner = input.slice(i + mark.delim.length, closeIdx);
          out.push({ tag: mark.tag, children: parseMarkdown(inner) });
          i = closeIdx + mark.delim.length;
        } else {
          // Opening delim has no close — emit it literally and advance past it.
          // Don't try shorter delims at the same position; that creates spurious empty marks.
          buf += mark.delim;
          i += mark.delim.length;
        }
        handled = true;
        break;
      }
    }
    if (handled) continue;

    buf += c;
    i++;
  }

  flush();
  return out;
}

function findClose(input: string, start: number, delim: string): number {
  let i = start;
  while (i < input.length) {
    // Skip escaped pairs so `\*` doesn't close an italic.
    if (input[i] === "\\" && i + 1 < input.length) {
      i += 2;
      continue;
    }
    // When looking for a single `*`, skip over `**` so we don't split bold.
    if (delim === "*" && input.startsWith("**", i)) {
      i += 2;
      continue;
    }
    if (input.startsWith(delim, i)) return i;
    i++;
  }
  return -1;
}
