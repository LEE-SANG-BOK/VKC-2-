#!/usr/bin/env node

// Viet K-Connect API Test Script
// Tests all API endpoints after Supabase setup

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Simple HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Viet K-Connect API Endpoints');
  console.log('=====================================\n');

  const tests = [
    {
      name: 'GET /api/questions - List questions',
      url: `${BASE_URL}/api/questions`,
      expected: 200
    },
    {
      name: 'GET /api/questions?page=1&limit=5 - Paginated questions',
      url: `${BASE_URL}/api/questions?page=1&limit=5`,
      expected: 200
    },
    {
      name: 'GET /api/categories - List categories',
      url: `${BASE_URL}/api/categories`,
      expected: 200
    },
    {
      name: 'GET /api/auth/session - Check auth session',
      url: `${BASE_URL}/api/auth/session`,
      expected: [200, 401] // Either OK or Unauthorized is fine
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      const result = await makeRequest(test.url);

      const statusOK = Array.isArray(test.expected)
        ? test.expected.includes(result.status)
        : result.status === test.expected;

      if (statusOK) {
        console.log(`✅ PASS - Status: ${result.status}`);

        // Additional validation for specific endpoints
        if (test.url.includes('/api/questions')) {
          if (result.data && result.data.data && result.data.pagination) {
            console.log(`   📊 Data: ${result.data.data.length} questions, pagination included`);
          } else {
            console.log(`   ⚠️  Response format may be incorrect`);
          }
        }

        passed++;
      } else {
        console.log(`❌ FAIL - Expected: ${test.expected}, Got: ${result.status}`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL - Request failed: ${error.message}`);
      failed++;
    }

    console.log('');
  }

  console.log('📈 Test Results');
  console.log('==============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Supabase setup is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your Supabase configuration.');
    console.log('Common issues:');
    console.log('- Environment variables not set correctly');
    console.log('- Database schema not applied');
    console.log('- Development server not running (npm run dev)');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    console.log('❌ Development server not running.');
    console.log('Please start the server first: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await testAPI();
}

main().catch(console.error);