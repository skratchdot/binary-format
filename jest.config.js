module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  snapshotSerializers: ['jest-buffer-snapshot-serializer'],
  // collectCoverage: true,
  // collectCoverageFrom: ['src/**/*.[jt]s?(x)', '!src/examples/**/*'],
  coverageReporters: ['text', 'text-summary', 'html', 'json', 'lcovonly'],
};
