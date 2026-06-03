"use client";

import { useState } from "react";
import {
  formatFeedbackCharCount,
  LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID,
  LOCAL_DEMO_FEEDBACK_CLEAR_LABEL,
  LOCAL_DEMO_FEEDBACK_INTRO,
  LOCAL_DEMO_FEEDBACK_INTRO_ID,
  LOCAL_DEMO_FEEDBACK_LABEL,
  LOCAL_DEMO_FEEDBACK_MAX_CHARS,
  LOCAL_DEMO_FEEDBACK_PLACEHOLDER,
  LOCAL_DEMO_FEEDBACK_SECTION_LABEL,
  LOCAL_DEMO_FEEDBACK_TEXTAREA_ID
} from "./local-demo-ui";

export function LocalDemoFeedbackNote() {
  const [note, setNote] = useState("");

  return (
    <section className="demoFeedbackNote" aria-label={LOCAL_DEMO_FEEDBACK_SECTION_LABEL}>
      <p className="demoFeedbackIntro" id={LOCAL_DEMO_FEEDBACK_INTRO_ID}>
        {LOCAL_DEMO_FEEDBACK_INTRO}
      </p>
      <label className="demoFeedbackField" htmlFor={LOCAL_DEMO_FEEDBACK_TEXTAREA_ID}>
        <span>{LOCAL_DEMO_FEEDBACK_LABEL}</span>
        <textarea
          id={LOCAL_DEMO_FEEDBACK_TEXTAREA_ID}
          name="local-demo-feedback-note"
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, LOCAL_DEMO_FEEDBACK_MAX_CHARS))}
          placeholder={LOCAL_DEMO_FEEDBACK_PLACEHOLDER}
          rows={4}
          maxLength={LOCAL_DEMO_FEEDBACK_MAX_CHARS}
          aria-describedby={`${LOCAL_DEMO_FEEDBACK_INTRO_ID} ${LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID}`}
        />
      </label>
      <div className="demoFeedbackMeta">
        <output
          className="demoFeedbackCharCount"
          id={LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID}
          htmlFor={LOCAL_DEMO_FEEDBACK_TEXTAREA_ID}
          aria-live="polite"
        >
          {formatFeedbackCharCount(note.length, LOCAL_DEMO_FEEDBACK_MAX_CHARS)}
        </output>
        <button
          type="button"
          className="ghostButton"
          disabled={note.length === 0}
          aria-controls={LOCAL_DEMO_FEEDBACK_TEXTAREA_ID}
          onClick={() => setNote("")}
        >
          {LOCAL_DEMO_FEEDBACK_CLEAR_LABEL}
        </button>
      </div>
    </section>
  );
}
