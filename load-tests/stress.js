import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);

export const options = {
  stages: [
    { duration: '1m', target: 500 },   // warm up
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '2m', target: 3000 },
    { duration: '2m', target: 4000 },  // peak stress
    { duration: '3m', target: 4000 },  // sustain stress
    { duration: '2m', target: 0 },     // ramp down — observe recovery
    { duration: '1m', target: 0 },     // hold at 0 to confirm recovery
  ],
  thresholds: {
    // Relaxed thresholds — goal is to find breaking point, not enforce SLA
    http_req_duration: ['p(90)<3000', 'p(95)<5000'],
    http_req_failed: ['rate<0.15'],
    errors: ['rate<0.15'],
    login_duration: ['p(95)<6000'],
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
    timeout: '10s',
    tags: { name: 'landing' },
  });
  check(landingRes, {
    'landing: status 200': (r) => r.status === 200,
    'landing: no 5xx': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(Math.random() * 1.5 + 0.5);

  // GET /api/jobs — job listings
  const jobsRes = http.get(`${BASE_URL}/api/jobs`, {
    headers: HEADERS,
    timeout: '10s',
    tags: { name: 'jobs' },
  });
  check(jobsRes, {
    'jobs: status 200': (r) => r.status === 200,
    'jobs: no 5xx': (r) => r.status < 500,
    'jobs: returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body?.data) || Array.isArray(body?.jobs);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(Math.random() * 1.5 + 0.5);

  // POST /api/auth/login — candidate login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, LOGIN_PAYLOAD, {
    headers: HEADERS,
    timeout: '15s',
    tags: { name: 'login' },
  });
  loginDuration.add(Date.now() - loginStart);
  check(loginRes, {
    'login: not 5xx': (r) => r.status < 500,
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(Math.random() * 2 + 0.5);

  // GET /api/companies — company listings
  const companiesRes = http.get(`${BASE_URL}/api/companies`, {
    headers: HEADERS,
    timeout: '10s',
    tags: { name: 'companies' },
  });
  check(companiesRes, {
    'companies: status 200': (r) => r.status === 200,
    'companies: no 5xx': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(Math.random() * 1.5 + 0.5);
}
