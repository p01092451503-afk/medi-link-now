/**
 * 중앙 환경변수 관리 모듈
 * 모든 환경변수는 이 파일을 통해 접근합니다.
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = import.meta.env[key] as string | undefined;
  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `[Config] 필수 환경변수 "${key}"가 설정되지 않았습니다.\n` +
      `.env 파일에 ${key}=<값> 형태로 추가해주세요.\n` +
      `.env.example 파일을 참고하세요.`
    );
  }
  return value || '';
}

export const config = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
    projectId: getEnvVar('VITE_SUPABASE_PROJECT_ID'),
  },
  kakao: {
    mapApiKey: getEnvVar('VITE_KAKAO_MAP_API_KEY', false),
  },
} as const;

/**
 * 앱 시작 시 호출하여 필수 환경변수를 검증합니다.
 * 누락된 변수가 있으면 명확한 에러 메시지와 함께 실패합니다.
 */
export function validateEnv(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID',
  ];

  const missing = requiredVars.filter(
    (key) => !import.meta.env[key] || (import.meta.env[key] as string).trim() === ''
  );

  if (missing.length > 0) {
    const message = [
      '🚨 필수 환경변수가 누락되었습니다:',
      ...missing.map((key) => `  - ${key}`),
      '',
      '.env.example 파일을 참고하여 .env 파일을 생성해주세요.',
    ].join('\n');

    console.error(message);
    throw new Error(message);
  }

  // 선택적 변수 경고
  const optionalVars = ['VITE_KAKAO_MAP_API_KEY'];
  const missingOptional = optionalVars.filter(
    (key) => !import.meta.env[key] || (import.meta.env[key] as string).trim() === ''
  );

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️ 선택적 환경변수가 설정되지 않았습니다 (일부 기능이 제한될 수 있습니다):\n` +
      missingOptional.map((key) => `  - ${key}`).join('\n')
    );
  }
}
