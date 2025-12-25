export const isE2ETestMode = () =>
  process.env.E2E_TEST_MODE === '1' || process.env.E2E_TEST_MODE === 'true';

