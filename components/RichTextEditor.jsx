"use client";

import { useEffect, useRef } from "react";

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write product description...",
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function command(name, commandValue = null) {
    editorRef.current?.focus();

    document.execCommand(
      name,
      false,
      commandValue
    );

    onChange?.(
      editorRef.current?.innerHTML || ""
    );
  }

  function addLink() {
    const url = window.prompt(
      "Enter link URL"
    );

    if (!url) return;

    command("createLink", url);
  }

  function handleInput() {
    onChange?.(
      editorRef.current?.innerHTML || ""
    );
  }

  return (
    <div className="arone-rich-editor">

      <div className="arone-editor-toolbar">

        <button
          type="button"
          onClick={() =>
            command("formatBlock", "h2")
          }
          title="Heading"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => command("bold")}
          title="Bold"
        >
          <b>B</b>
        </button>

        <button
          type="button"
          onClick={() => command("italic")}
          title="Italic"
        >
          <i>I</i>
        </button>

        <button
          type="button"
          onClick={() =>
            command("underline")
          }
          title="Underline"
        >
          <u>U</u>
        </button>

        <button
          type="button"
          onClick={() =>
            command("strikeThrough")
          }
          title="Strike"
        >
          S
        </button>

        <button
          type="button"
          onClick={() =>
            command(
              "insertUnorderedList"
            )
          }
          title="Bullet List"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            command(
              "insertOrderedList"
            )
          }
          title="Numbered List"
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            command("justifyLeft")
          }
          title="Left"
        >
          ≡
        </button>

        <button
          type="button"
          onClick={() =>
            command("justifyCenter")
          }
          title="Center"
        >
          ≡
        </button>

        <button
          type="button"
          onClick={() =>
            command("justifyRight")
          }
          title="Right"
        >
          ≡
        </button>

        <button
          type="button"
          onClick={addLink}
          title="Link"
        >
          🔗
        </button>

        <button
          type="button"
          onClick={() =>
            command("unlink")
          }
          title="Remove Link"
        >
          ⛓
        </button>

        <button
          type="button"
          onClick={() =>
            command(
              "removeFormat"
            )
          }
          title="Clear Formatting"
        >
          Tx
        </button>

      </div>

      <div
        ref={editorRef}
        className="arone-editor-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
      />

    </div>
  );
}