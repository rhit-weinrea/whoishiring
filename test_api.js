#!/usr/bin/env node

const API = process.env.API_URL || 'https://api.who-is-hiring.com/api/v1';
const TEST_USER = `testbot_${Date.now()}`;
const TEST_EMAIL = `${TEST_USER}@example.com`;
const TEST_PASS = 'TestPass123!';

let token = null;
let passed = 0;
let failed = 0;
const failures = [];

async function request(method, path, body, authToken) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
}

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
    failures.push(name + (detail ? ': ' + detail : ''));
  }
}

// ─── Test Suites ───

async function testJobBrowse() {
  console.log('\n--- Job Browsing ---');

  const all = await request('GET', '/jobs/browse');
  assert('Browse all jobs returns 200', all.status === 200);
  assert('Browse all jobs returns array', Array.isArray(all.json));
  assert('Browse all jobs has results', all.json?.length > 0, `got ${all.json?.length}`);

  const remote = await request('GET', '/jobs/browse?remote_filter=remote');
  assert('Remote filter returns 200', remote.status === 200);
  assert('Remote filter returns array', Array.isArray(remote.json));
  assert('Remote filter has results', remote.json?.length > 0, `got ${remote.json?.length}`);
  const allRemote = remote.json?.every(j => j.remote_status === 'remote');
  assert('All remote results have remote_status=remote', allRemote);

  const loc = await request('GET', '/jobs/browse?location_query=New%20York');
  assert('Location filter returns 200', loc.status === 200);
  assert('Location filter has results', loc.json?.length > 0, `got ${loc.json?.length}`);
  const allNY = loc.json?.every(j => (j.job_location || '').toLowerCase().includes('new york'));
  assert('All location results contain "New York"', allNY);

  const tech = await request('GET', '/jobs/browse?tech_filter=react');
  assert('Tech filter returns 200', tech.status === 200);
}

async function testJobSearch() {
  console.log('\n--- Job Text Search ---');

  const res = await request('GET', '/jobs/search/text?search_term=python');
  assert('Text search returns 200', res.status === 200);
  assert('Text search returns array', Array.isArray(res.json));
  assert('Text search has results', res.json?.length > 0, `got ${res.json?.length}`);

  const short = await request('GET', '/jobs/search/text?search_term=a');
  assert('Text search rejects short query (min_length=2)', short.status === 422);
}

async function testJobDetail() {
  console.log('\n--- Job Detail ---');

  const res = await request('GET', '/jobs/1');
  assert('Job detail returns 200', res.status === 200, `got ${res.status}: ${res.text?.substring(0, 100)}`);
  assert('Job detail has job_id', res.json?.job_id === 1);

  const missing = await request('GET', '/jobs/99999');
  assert('Missing job returns 404', missing.status === 404);
}

async function testRegister() {
  console.log('\n--- Registration ---');

  const res = await request('POST', '/auth/register', {
    email_address: TEST_EMAIL,
    password: TEST_PASS,
    username: TEST_USER,
  });
  assert('Register returns 201', res.status === 201, `got ${res.status}: ${res.text?.substring(0, 200)}`);
  assert('Register returns access_token', !!res.json?.access_token, `keys: ${Object.keys(res.json || {})}`);
  token = res.json?.access_token;

  // If register didn't return a token, login to get one
  if (!token) {
    console.log('  INFO  Falling back to login for token...');
    const login = await request('POST', '/auth/login', {
      username: TEST_USER,
      password: TEST_PASS,
    });
    token = login.json?.access_token;
    assert('Fallback login got token', !!token);
  }

  // Duplicate email
  const dupEmail = await request('POST', '/auth/register', {
    email_address: TEST_EMAIL,
    password: TEST_PASS,
    username: TEST_USER + '_other',
  });
  assert('Duplicate email returns 400', dupEmail.status === 400);
  assert('Duplicate email error message', dupEmail.json?.detail === 'Email already registered', dupEmail.json?.detail);

  // Duplicate username
  const dupUser = await request('POST', '/auth/register', {
    email_address: 'other_' + TEST_EMAIL,
    password: TEST_PASS,
    username: TEST_USER,
  });
  assert('Duplicate username returns 400', dupUser.status === 400);
  assert('Duplicate username error message', dupUser.json?.detail === 'Username unavailable', dupUser.json?.detail);
}

async function testLogin() {
  console.log('\n--- Login ---');

  const res = await request('POST', '/auth/login', {
    username: TEST_USER,
    password: TEST_PASS,
  });
  assert('Login returns 200', res.status === 200, `got ${res.status}: ${res.text?.substring(0, 200)}`);
  assert('Login returns access_token', !!res.json?.access_token);
  token = res.json?.access_token;

  // Wrong password
  const bad = await request('POST', '/auth/login', {
    username: TEST_USER,
    password: 'WrongPassword999',
  });
  assert('Wrong password returns 401', bad.status === 401);
  assert('Wrong password error message', bad.json?.detail === 'Invalid credentials', bad.json?.detail);

  // Non-existent user
  const noUser = await request('POST', '/auth/login', {
    username: 'nonexistent_user_xyz_999',
    password: 'anything',
  });
  assert('Non-existent user returns 401', noUser.status === 401);
}

async function testProfile() {
  console.log('\n--- Profile ---');

  const res = await request('GET', '/auth/profile', null, token);
  assert('Profile returns 200', res.status === 200, `got ${res.status}: ${res.text?.substring(0, 200)}`);
  assert('Profile has username', res.json?.username === TEST_USER, `got ${res.json?.username}`);
  assert('Profile has email', res.json?.email_address === TEST_EMAIL);

  // No auth
  const noAuth = await request('GET', '/auth/profile');
  assert('Profile without token returns 401', noAuth.status === 401);
}

async function testEmailUpdate() {
  console.log('\n--- Email Update ---');

  const newEmail = `updated_${TEST_EMAIL}`;
  const res = await request('PUT', '/auth/email', { email_address: newEmail }, token);
  assert('Email update returns 200', res.status === 200, `got ${res.status}: ${res.text?.substring(0, 200)}`);
  assert('Email updated correctly', res.json?.email_address === newEmail, `got ${res.json?.email_address}`);

  // Revert
  const revert = await request('PUT', '/auth/email', { email_address: TEST_EMAIL }, token);
  assert('Email revert returns 200', revert.status === 200, `got ${revert.status}: ${revert.text?.substring(0, 200)}`);

  // Same email (no-op)
  const same = await request('PUT', '/auth/email', { email_address: TEST_EMAIL }, token);
  assert('Same email returns 200 (no-op)', same.status === 200, `got ${same.status}: ${same.text?.substring(0, 200)}`);
}

async function testPreferences() {
  console.log('\n--- Preferences ---');

  const get = await request('GET', '/preferences/my-preferences', null, token);
  assert('Get preferences returns 200', get.status === 200, `got ${get.status}: ${get.text?.substring(0, 200)}`);
  assert('New user notification_enabled defaults to false', get.json?.notification_enabled === false, `got ${get.json?.notification_enabled}`);
  assert('New user remote_only defaults to false', get.json?.remote_only === false);

  // Update preferences with notifications off
  const put = await request('PUT', '/preferences/my-preferences', {
    preferred_locations: ['New York'],
    preferred_tech_stack: ['Python', 'React'],
    remote_only: true,
    visa_sponsorship_only: false,
    keywords_to_match: ['backend'],
    notification_enabled: false,
  }, token);
  assert('Update preferences returns 200', put.status === 200, `got ${put.status}: ${put.text?.substring(0, 200)}`);
  assert('Updated remote_only', put.json?.remote_only === true);
  assert('Updated locations', Array.isArray(put.json?.preferred_locations));
  assert('No email sent when notifications stay off', !put.json?.email_status, `got email_status=${put.json?.email_status}`);

  // Enable notifications (should trigger confirmation email attempt)
  const enable = await request('PUT', '/preferences/my-preferences', {
    preferred_locations: ['New York'],
    preferred_tech_stack: ['Python', 'React'],
    remote_only: true,
    visa_sponsorship_only: false,
    keywords_to_match: ['backend'],
    notification_enabled: true,
  }, token);
  assert('Enable notifications returns 200', enable.status === 200, `got ${enable.status}: ${enable.text?.substring(0, 200)}`);
  assert('Email status present (SMTP attempted)',
    enable.json?.email_status === 'sent' || enable.json?.email_status?.startsWith('failed'),
    `got email_status=${enable.json?.email_status || 'none (should_confirm was false)'}`);

  // No auth
  const noAuth = await request('GET', '/preferences/my-preferences');
  assert('Preferences without token returns 401', noAuth.status === 401);
}

async function testSavedJobs() {
  console.log('\n--- Saved Jobs ---');

  const list = await request('GET', '/saved-jobs/my-saved-jobs', null, token);
  assert('List saved jobs returns 200', list.status === 200, `got ${list.status}: ${list.text?.substring(0, 200)}`);
  assert('Saved jobs is array', Array.isArray(list.json));

  // Save a job
  const save = await request('POST', '/saved-jobs/save', { job_posting_id: 1 }, token);
  assert('Save job returns 201', save.status === 201, `got ${save.status}: ${save.text?.substring(0, 200)}`);
  const savedId = save.json?.saved_id;
  assert('Save job returns saved_id', !!savedId, `got ${JSON.stringify(save.json)?.substring(0, 200)}`);
  assert('Save job includes posting_rel', !!save.json?.posting_rel, 'posting_rel missing');

  // Duplicate save
  if (save.status === 201) {
    const dup = await request('POST', '/saved-jobs/save', { job_posting_id: 1 }, token);
    assert('Duplicate save returns 400', dup.status === 400);
  }

  // List again
  const list2 = await request('GET', '/saved-jobs/my-saved-jobs', null, token);
  assert('Saved jobs count increased', list2.json?.length > list.json?.length);

  // Unsave
  if (savedId) {
    const unsave = await request('DELETE', `/saved-jobs/${savedId}`, null, token);
    assert('Unsave job returns 204', unsave.status === 204, `got ${unsave.status}`);

    // Verify removed
    const list3 = await request('GET', '/saved-jobs/my-saved-jobs', null, token);
    assert('Saved jobs count back to original', list3.json?.length === list.json?.length);
  }

  // No auth
  const noAuth = await request('GET', '/saved-jobs/my-saved-jobs');
  assert('Saved jobs without token returns 401', noAuth.status === 401);
}

async function testLocationSuggest() {
  console.log('\n--- Location Suggestions ---');

  const res = await request('GET', '/locations/suggest?query=New&limit=3', null, token);
  assert('Location suggest returns 200', res.status === 200, `got ${res.status}: ${res.text?.substring(0, 200)}`);
  assert('Location suggest returns array', Array.isArray(res.json));
  assert('Location suggest has results', res.json?.length > 0, `got ${res.json?.length}`);
}

async function cleanup() {
  console.log('\n--- Cleanup ---');

  const del = await request('DELETE', '/preferences/my-preferences', null, token);
  assert('Delete preferences returns 204', del.status === 204, `got ${del.status}`);

  console.log(`\n  (Test user "${TEST_USER}" left in DB — delete manually if needed)`);
}

// ─── Runner ───

async function main() {
  console.log(`\nAPI Test Suite — ${API}`);
  console.log(`Test user: ${TEST_USER}`);
  console.log('='.repeat(60));

  try {
    await testJobBrowse();
    await testJobSearch();
    await testJobDetail();
    await testRegister();
    await testLogin();
    await testProfile();
    await testEmailUpdate();
    await testPreferences();
    await testSavedJobs();
    await testLocationSuggest();
    await cleanup();
  } catch (err) {
    console.error('\n  FATAL ERROR:', err.message);
    failed++;
    failures.push('Fatal: ' + err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    failures.forEach(f => console.log(`    - ${f}`));
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

main();
