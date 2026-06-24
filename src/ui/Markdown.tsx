import { Fragment, ReactNode } from "react";
import { parseMarkdown, MdNode } from "./markdown";

function render(nodes: MdNode[]): ReactNode {
  return nodes.map((node, i) => {
    if (typeof node === "string") return <Fragment key={i}>{node}</Fragment>;
    const Tag = node.tag;
    return <Tag key={i}>{render(node.children)}</Tag>;
  });
}

export function Markdown({ children }: { children: string }) {
  return <>{render(parseMarkdown(children))}</>;
}
