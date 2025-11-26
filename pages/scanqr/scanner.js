// If this page was opened with a tableId in the URL, let qr.js handle it.
try {
  const p = new URLSearchParams(window.location.search);
  if (p.get("tableId")) {
    console.log("scanner.js: tableId present in URL, skipping camera scanner.");
    throw "SKIP_SCANNER";
  }
} catch (e) {
  if (e === "SKIP_SCANNER") {
    // Do not initialize the scanner when tableId is already provided.
  } else {
    // proceed normally
  }
}

const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

function setTableSession(tableNumber) {
  const cleanTableId = String(tableNumber).replace(/\D/g, "");
  if (!cleanTableId) return false;
  const maxAge = 60 * 10; // 10 minutes
  const tableLabel = `Table ${cleanTableId}`;
  const tableMail = `table${cleanTableId}@dinedelight.tech`;
  document.cookie = "id=;path=/;max-age=0";
  document.cookie = "name=;path=/;max-age=0";
  document.cookie = "mail=;path=/;max-age=0";
  document.cookie = "role=;path=/;max-age=0";
  document.cookie = `name=${encodeURIComponent(tableLabel)};path=/;max-age=${maxAge}`;
  document.cookie = `id=${encodeURIComponent(cleanTableId)};path=/;max-age=${maxAge}`;
  document.cookie = `mail=${encodeURIComponent(tableMail)};path=/;max-age=${maxAge}`;
  document.cookie = `role=table;path=/;max-age=${maxAge}`;
  window.location.href = "../menu/index.html";
  return true;
}

function extractTableFromText(text) {
  if (!text) return null;
  const t = text.trim();
  // Matches: table12@dinedelight.tech, 12@dinedelight.tech, table12, 12
  let m = t.match(/table(\d+)/i);
  if (m) return m[1];
  m = t.match(/^(\d+)@dinedelight\.tech\/?$/i);
  if (m) return m[1];
  m = t.match(/^(\d+)$/);
  if (m) return m[1];
  return null;
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    try { video.muted = true; } catch (e) {}
    video.play();

    requestAnimationFrame(tick);
  } catch (err) {
    console.error("Camera error:", err);
    alert("Cannot access camera. Please allow camera permission.");
  }
}

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" });

    if (code && code.data) {
      console.log("QR detected:", code.data);

      const val = (code.data || "").trim();
      // 1) If URL contains ?tableId=, handle directly to avoid extra redirect
      try {
        const u = new URL(val);
        const tid = u.searchParams.get("tableId");
        if (tid && setTableSession(tid)) return;
        // If it's some other URL, just navigate to it (legacy flow may handle it)
        window.location.href = val;
        return;
      } catch (_) {
        // not a URL; fall through to text patterns
      }

      // 2) If plain text matches table patterns, set session directly
      const tableNum = extractTableFromText(val);
      if (tableNum && setTableSession(tableNum)) return;

      // 3) Otherwise, show a helpful message
      alert("Unsupported QR format. Please scan a Dine Delight table QR.");
      return; // stop scanning after success
    }
  }

  requestAnimationFrame(tick);
}

// Only start camera if not skipped due to tableId param
if (!new URLSearchParams(window.location.search).get("tableId")) {
  startCamera();
}
