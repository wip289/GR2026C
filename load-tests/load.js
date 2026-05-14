import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const jobsRequestCount = new Counter('jobs_requests');

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // ramp up to 500
    { duration: '2m', target: 1000 },  // ramp up to 1000
    { duration: '2m', target: 2000 },  // ramp up to full load
    { duration: '3m', target: 2000 },  // sustain peak
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(90)<1000', 'p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.05'],
    login_duration: ['p(95)<3000'],
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
  const landingRes = http.get(`${BASE_URL}/`, { tags: { name: 'landing' } });
  check(landingRes, {
    'landing: status 200': (r) => r.status === 200,
    'landing: response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(Math.random() * 2 + 1);

  // GET /api/jobs — job listings
  const jobsRes = http.get(`${BASE_URL}/api/jobs`, {
    headers: HEADERS,
    tags: { name: 'jobs' },
  });
  jobsRequestCount.add(1);
  check(jobsRes, {
    'jobs: status 200': (r) => r.status === 200,
    'jobs: response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(Math.random() * 2 + 1);

  // POST /api/auth/login — candidate login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, LOGIN_PAYLOAD, {
    headers: HEADERS,
    tags: { name: 'login' },
  });
  loginDuration.add(Date.now() - loginStart);
  check(loginRes, {
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login: response time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(Math.random() * 3 + 1);

  // GET /api/companies — company listings
  const companiesRes = http.get(`${BASE_URL}/api/companies`, {
    headers: HEADERS,
    tags: { name: 'companies' },
  });
  check(companiesRes, {
    'companies: status 200': (r) => r.status === 200,
    'companies: response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(Math.random() * 2 + 1);
}
