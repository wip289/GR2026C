import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
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
    'landing: body not empty': (r) => r.body.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // GET /api/jobs — job listings
  const jobsRes = http.get(`${BASE_URL}/api/jobs`, {
    headers: HEADERS,
    tags: { name: 'jobs' },
  });
  check(jobsRes, {
    'jobs: status 200': (r) => r.status === 200,
    'jobs: returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body?.data) || Array.isArray(body?.jobs);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // POST /api/auth/login — candidate login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, LOGIN_PAYLOAD, {
    headers: HEADERS,
    tags: { name: 'login' },
  });
  loginDuration.add(Date.now() - loginStart);
  check(loginRes, {
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login: has json body': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // GET /api/companies — company listings
  const companiesRes = http.get(`${BASE_URL}/api/companies`, {
    headers: HEADERS,
    tags: { name: 'companies' },
  });
  check(companiesRes, {
    'companies: status 200': (r) => r.status === 200,
    'companies: returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body?.data) || Array.isArray(body?.companies);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);
}
