"use client";

import DOMPurify from "isomorphic-dompurify";

type Props = {
  html: string;
  className?: string;
};

/** Affiche du HTML utilisateur (propositions) de façon assainie. */
export function SafeHtml({ html, className }: Props) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
  });
  return (
    <div
      className={
        className ??
        "prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 [&_a]:text-amber-300"
      }
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export function isProbablyHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}
