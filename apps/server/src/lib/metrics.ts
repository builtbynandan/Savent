interface Metric {
  count: number;
  durationSeconds: number;
}

const requests = new Map<string, Metric>();

function normalisePath(path: string) {
  return path
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

function labels(method: string, path: string, status: number) {
  return `method="${method}",path="${normalisePath(path)}",status="${status}"`;
}

export function observeRequest(
  method: string,
  path: string,
  status: number,
  durationSeconds: number,
) {
  const key = labels(method, path, status);
  const metric = requests.get(key) ?? { count: 0, durationSeconds: 0 };
  metric.count += 1;
  metric.durationSeconds += durationSeconds;
  requests.set(key, metric);
}

export function renderMetrics() {
  const lines = [
    '# HELP savent_http_requests_total Total completed HTTP requests.',
    '# TYPE savent_http_requests_total counter',
  ];

  for (const [key, metric] of requests) {
    lines.push(`savent_http_requests_total{${key}} ${metric.count}`);
  }

  lines.push(
    '# HELP savent_http_request_duration_seconds_sum Total request duration in seconds.',
    '# TYPE savent_http_request_duration_seconds_sum counter',
  );
  for (const [key, metric] of requests) {
    lines.push(
      `savent_http_request_duration_seconds_sum{${key}} ${metric.durationSeconds.toFixed(6)}`,
    );
  }

  lines.push(
    '# HELP savent_process_uptime_seconds Process uptime in seconds.',
    '# TYPE savent_process_uptime_seconds gauge',
    `savent_process_uptime_seconds ${process.uptime().toFixed(3)}`,
  );
  return `${lines.join('\n')}\n`;
}
