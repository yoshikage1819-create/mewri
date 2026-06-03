import {
  LOCAL_DEMO_SAFETY_PANEL_ID,
  LOCAL_DEMO_SAFETY_POINTS,
  LOCAL_DEMO_SAFETY_SUMMARY,
  LOCAL_DEMO_SAFETY_SUMMARY_ID
} from "./local-demo-ui";

export function LocalDemoSafetyNotice() {
  return (
    <details className="demoSafetyNotice" aria-labelledby={LOCAL_DEMO_SAFETY_SUMMARY_ID}>
      <summary id={LOCAL_DEMO_SAFETY_SUMMARY_ID}>
        {LOCAL_DEMO_SAFETY_SUMMARY}
        <span className="demoSafetyToggleHint" aria-hidden="true" />
      </summary>
      <ul id={LOCAL_DEMO_SAFETY_PANEL_ID} aria-label="安全案内の内容">
        {LOCAL_DEMO_SAFETY_POINTS.map((point) => (
          <li key={point.title}>
            <p className="demoSafetyPointTitle">{point.title}</p>
            <p className="demoSafetyPointBody">{point.body}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
