"use client";

import { useState } from "react";
import {
  formatFeedbackCharCount,
  LOCAL_DEMO_FEEDBACK_CLEAR_LABEL,
  LOCAL_DEMO_FEEDBACK_INTRO,
  LOCAL_DEMO_FEEDBACK_LABEL,
  LOCAL_DEMO_FEEDBACK_MAX_CHARS,
  LOCAL_DEMO_FEEDBACK_PLACEHOLDER
} from "./local-demo-ui";

export function LocalDemoFeedbackNote() {
  const [note, setNote] = useState("");

  return (
    <section className="demoFeedbackNote" aria-label="デモの感想メモ">
      <p className="demoFeedbackIntro">{LOCAL_DEMO_FEEDBACK_INTRO}</p>
      <label className="demoFeedbackField">
        <span>{LOCAL_DEMO_FEEDBACK_LABEL}</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, LOCAL_DEMO_FEEDBACK_MAX_CHARS))}
          placeholder={LOCAL_DEMO_FEEDBACK_PLACEHOLDER}
          rows={4}
          maxLength={LOCAL_DEMO_FEEDBACK_MAX_CHARS}
        />
      </label>
      <div className="demoFeedbackMeta">
        <p role="status" aria-live="polite">
          {formatFeedbackCharCount(note.length, LOCAL_DEMO_FEEDBACK_MAX_CHARS)}
        </p>
        <button type="button" className="ghostButton" disabled={note.length === 0} onClick={() => setNote("")}>
          {LOCAL_DEMO_FEEDBACK_CLEAR_LABEL}
        </button>
      </div>
    </section>
  );
}
