"use client";

import {
  useEditor,
  EditorContent,
  Editor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { menuBarStateSelector } from "./menuBarState";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Underline,
} from "lucide-react";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import TextAlign from "@tiptap/extension-text-align";

export function DocumentEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    autofocus: true,
    editable: true,
    editorProps: {
    attributes: {
      class: 'w-full h-full max-h-screen',
    },
  },
  });

  if (!editor) return null;

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        role="presentation"
        className="flex w-full flex-1 bg-muted mx-2 mb-2 mt-5"
      />
      {/* <div className="flex flex-1 bg-muted mx-2 mb-2 rounded p-2"> */}
      {/* </div> */}
    </>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  return (
    <div className="flex items-center justify-center py-1 w-full">
      <ButtonGroup>
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState.canBold}
          variant={editorState.isBold ? "default" : "ghost"}
          size={"icon"}
        >
          <Bold />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState.canItalic}
          variant={editorState.isItalic ? "default" : "ghost"}
          size={"icon"}
        >
          <Italic />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState.canStrike}
          variant={editorState.isStrike ? "default" : "ghost"}
          size={"icon"}
        >
          <Strikethrough />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editorState.canUnderline}
          variant={editorState.isUnderline ? "default" : "ghost"}
          size={"icon"}
        >
          <Underline />
        </Button>
        <ButtonGroupSeparator />
        <Button
          onClick={() => editor.chain().focus().toggleTextAlign("left").run()}
          disabled={!editorState.canTextStart}
          variant={editorState.isTextStart ? "default" : "ghost"}
          size={"icon"}
        >
          <TextAlignStart />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleTextAlign("center").run()}
          disabled={!editorState.canTextCenter}
          variant={editorState.isTextCenter ? "default" : "ghost"}
          size={"icon"}
        >
          <TextAlignCenter />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleTextAlign("right").run()}
          disabled={!editorState.canTextEnd}
          variant={editorState.isTextEnd ? "default" : "ghost"}
          size={"icon"}
        >
          <TextAlignEnd />
        </Button>
      </ButtonGroup>
    </div>
  );
}
