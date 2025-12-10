async function generate() {
  const text = document.getElementById("text").value;
  const voice = document.getElementById("voice").value;

  const res = await fetch("https://frabjous-gecko-bedc34.netlify.app/.netlify/functions/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice })
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  document.getElementById("audio").src = url;
}
