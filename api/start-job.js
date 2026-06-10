export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Video URL required" });
    }

    const response = await fetch(
      "https://api.github.com/repos/leafcau-eng/auto-clipper/actions/workflows/run.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref: "v2",
          inputs: { youtube_url: url }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ success: false, github_error: text });
    }

    return res.status(200).json({ success: true, message: "Workflow started!" });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
