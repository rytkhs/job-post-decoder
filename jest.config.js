const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリへのパス
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // テストファイルのパターンを指定
  testMatch: ['**/__tests__/**/*.test.(js|jsx|ts|tsx)'],
  // テスト環境のセットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // テスト環境
  testEnvironment: 'node',
  // モジュール名のエイリアス
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};

// createJestConfigを使用することによって、next/jestが提供する設定とユーザー定義の設定がマージされる
module.exports = createJestConfig(customJestConfig);
