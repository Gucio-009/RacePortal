import { createApp } from "./app.js";
import { archivePastEvents } from "./lib/archive.js";

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, async () => {
  console.log(`RACEPORTAL API listening on :${port}`);
  try {
    await archivePastEvents();
  } catch (e) {
    console.error("archivePastEvents failed", e);
  }
  // daily auto-archive
  setInterval(
    () => {
      archivePastEvents().catch((e) => console.error("archivePastEvents failed", e));
    },
    24 * 60 * 60 * 1000,
  );
});
