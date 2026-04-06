"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

type Props = {
  /** Contenu initial — utiliser `key={…}` sur le composant pour forcer un nouveau montage (IA / chargement). */
  initialHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ProposalRichEditor({
  initialHtml,
  onChange,
  disabled,
  placeholder,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Rédigez votre proposition technique…",
      }),
    ],
    content: initialHtml || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-white/15 bg-black/40 min-h-[220px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-black/40 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/30">
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none px-3 py-3 min-h-[220px] [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-gray-100 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h3]:text-base"
      />
    </div>
  );
}
