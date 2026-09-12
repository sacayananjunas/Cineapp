const appBaseUrl = process.env.APP_BASE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appBaseUrl) {
  console.error("APP_BASE_URL is required.");
  process.exit(1);
}

if (!cronSecret) {
  console.error("CRON_SECRET is required.");
  process.exit(1);
}

const endpoint = `${appBaseUrl.replace(/\/$/, "")}/api/cron/release-seat-holds`;

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${cronSecret}`,
  },
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Seat hold release failed: ${response.status} ${response.statusText}`);
  console.error(body);
  process.exit(1);
}

const body = await response.text();
console.log("Seat hold release succeeded.");
console.log(body);
