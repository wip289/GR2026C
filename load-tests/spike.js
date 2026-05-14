import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);

export const options = {
  // Spike pattern: baseline → sudden spike → back to baseline
  stages: [
    { duration: '1m', target: 100 },   // baseline
    { duration: '30s', target: 100 },  // hold baseline
    { duration: '10s', target: 4000 }, // spike!
    { duration: '3m', target: 4000 },  // sustain spike
    { duration: '10s', target: 100 },  // drop back
    { duration: '3m', target: 100 },   // recovery — watch for cascading failures
    { duration: '1m', target: 0 },     // wind down
  ],
  thresholds: {
    // During a spike the goal is availability, not latency
    http_req_failed: ['rate<0.20'],
    errors: ['rate<0.20'],
    // Alert if latency doesn't recover within 2 min after spike drops
    http_req_duration: ['p(95)<8000'],
    login_duration: ['p(95)<10000'],
  },
};

const BASE_URL = __ENV.RAILWAY_APP_URL || 'http://localhost:3000';

const LOGIN_PAYLOAD = JSON.stringify({
  email: 'test@candidate.com',
  password: 'testpassword123',
});

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export default function () {
  // GET / — landing page
  const landingRes = http.get(`${BASE_URL}/`, {
    timeout: '15s',
    tags: { name: 'landing' },
  });
  const landingOk = check(landingRes, {
    'landing: status 200': (r) => r.status === 200,
    'landing: no 5xx': (r) => r.status < 500,
    'landing: not timeout': (r) => r.status !== 0,
  });
  if (!landingOk) errorRate.add(1);

  sleep(0.5);

  // GET /api/jobs — job listings
  const jobsRes = http.get(`${BASE_URL}/api/jobs`, {
    headers: HEADERS,
    timeout: '15s',
    tags: { name: 'jobs' },
  });
  const jobsOk = check(jobsRes, {
    'jobs: status 200': (r) => r.status === 200,
    'jobs: no 5xx': (r) => r.status < 500,
    'jobs: not timeout': (r) => r.status !== 0,
  });
  if (!jobsOk) errorRate.add(1);

  sleep(0.5);

  // POST /api/auth/login — candidate login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, LOGIN_PAYLOAD, {
    headers: HEADERS,
    timeout: '20s',
    tags: { name: 'login' },
  });
  loginDuration.add(Date.now() - loginStart);
  const loginOk = check(loginRes, {
    'login: not 5xx': (r) => r.status < 500,
    'login: not timeout': (r) => r.status !== 0,
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  if (!loginOk) errorRate.add(1);

  sleep(0.5);

  // GET /api/companies — company listings
  const companiesRes = http.get(`${BASE_URL}/api/companies`, {
    headers: HEADERS,
    timeout: '15s',
    tags: { name: 'companies' },
  });
  const companiesOk = check(companiesRes, {
    'companies: status 200': (r) => r.status === 200,
    'companies: no 5xx': (r) => r.status < 500,
    'companies: not timeout': (r) => r.status !== 0,
  });
  if (!companiesOk) errorRate.add(1);

  sleep(0.5);
}
