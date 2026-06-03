import { LOCAL_DEMO_SAFETY_POINTS, LOCAL_DEMO_SAFETY_SUMMARY } from "./local-demo-ui";

export function LocalDemoSafetyNotice() {
  return (
    <details className="demoSafetyNotice">
      <summary>{LOCAL_DEMO_SAFETY_SUMMARY}</summary>
      <ul>
        {LOCAL_DEMO_SAFETY_POINTS.map((point) => (
          <li key={point.title}>
            <strong>{point.title}</strong>
            <span>{point.body}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
