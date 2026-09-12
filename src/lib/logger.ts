type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {}),
  };
  const output = JSON.stringify(payload);
  if (level === "error") {
    console.error(output);
    return;
  }
  if (level === "warn") {
    console.warn(output);
    return;
  }
  console.info(output);
}
