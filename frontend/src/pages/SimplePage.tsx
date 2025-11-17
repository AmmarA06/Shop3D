/**
 * Super simple test page to verify React is working
 */
export default function SimplePage() {
  return (
    <div style={{ padding: "40px", background: "#f0f0f0", minHeight: "100vh" }}>
      <h1 style={{ color: "green", fontSize: "48px" }}>React is Working!</h1>
      <p style={{ fontSize: "24px", marginTop: "20px" }}>
        If you can see this, the app is rendering correctly.
      </p>
      <div style={{ marginTop: "40px", background: "white", padding: "20px", borderRadius: "8px" }}>
        <h2>Next Steps:</h2>
        <ul style={{ fontSize: "18px", lineHeight: "1.6" }}>
          <li>Go to <a href="/test-viewer" style={{ color: "blue" }}>/test-viewer</a> for the 3D viewer</li>
          <li>Check the browser console (F12) for any errors</li>
        </ul>
      </div>
    </div>
  );
}
