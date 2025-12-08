import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

const jobs = [
  { code: 'D2', title: '유학(D-2)', visa_type: 'D2', min_salary: null, locale: 'vi', description: '대학/대학원 유학' },
  { code: 'D10', title: '구직(D-10)', visa_type: 'D10', min_salary: null, locale: 'vi', description: '구직 활동' },
  { code: 'E7-1', title: '전문인력(E-7-1)', visa_type: 'E7', min_salary: 32000000, locale: 'vi', description: '전문 직군' },
  { code: 'E7-2', title: '서비스/사무(E-7-2)', visa_type: 'E7', min_salary: 28000000, locale: 'vi', description: '서비스·사무 직군' },
  { code: 'F2', title: '거주(F-2)', visa_type: 'F2', min_salary: null, locale: 'vi', description: '거주 자격' },
  { code: 'D2', title: '유학(D-2)', visa_type: 'D2', min_salary: null, locale: 'ko', description: '대학교/대학원 유학' },
  { code: 'D10', title: '구직(D-10)', visa_type: 'D10', min_salary: null, locale: 'ko', description: '구직 활동' },
  { code: 'E7-1', title: '전문인력(E-7-1)', visa_type: 'E7', min_salary: 32000000, locale: 'ko', description: '전문 직군' },
  { code: 'E7-2', title: '서비스/사무(E-7-2)', visa_type: 'E7', min_salary: 28000000, locale: 'ko', description: '서비스/사무 직군' },
  { code: 'F2', title: '거주(F-2)', visa_type: 'F2', min_salary: null, locale: 'ko', description: '거주 자격' },
  { code: 'D2', title: 'Study (D-2)', visa_type: 'D2', min_salary: null, locale: 'en', description: 'University/graduate study' },
  { code: 'D10', title: 'Job Seeking (D-10)', visa_type: 'D10', min_salary: null, locale: 'en', description: 'Job search' },
  { code: 'E7-1', title: 'Professional (E-7-1)', visa_type: 'E7', min_salary: 32000000, locale: 'en', description: 'Professional roles' },
  { code: 'E7-2', title: 'Service/Clerical (E-7-2)', visa_type: 'E7', min_salary: 28000000, locale: 'en', description: 'Service/clerical roles' },
  { code: 'F2', title: 'Residence (F-2)', visa_type: 'F2', min_salary: null, locale: 'en', description: 'Residence permit' },
];

const requirements = [
  { visa_type: 'D10', requirement: '유학(D-2) 수료 또는 만료 예정', weight: 90, locale: 'vi' },
  { visa_type: 'D10', requirement: '구직 활동 계획/포트폴리오', weight: 70, locale: 'vi' },
  { visa_type: 'E7', requirement: '고용계약서(연봉 기준 충족)', weight: 100, locale: 'vi' },
  { visa_type: 'E7', requirement: '고용기업 내국인 5인 이상, 고용요건 충족', weight: 90, locale: 'vi' },
  { visa_type: 'E7', requirement: '전공/경력 일치 증빙(학위, 경력증명)', weight: 80, locale: 'vi' },
  { visa_type: 'F2', requirement: '소득/점수제 요건 충족', weight: 80, locale: 'vi' },
  { visa_type: 'D10', requirement: '유학(D-2) 수료 또는 만료 예정', weight: 90, locale: 'ko' },
  { visa_type: 'D10', requirement: '구직 활동 계획/포트폴리오', weight: 70, locale: 'ko' },
  { visa_type: 'E7', requirement: '고용계약서(연봉 기준 충족)', weight: 100, locale: 'ko' },
  { visa_type: 'E7', requirement: '고용기업 내국인 5인 이상, 고용요건 충족', weight: 90, locale: 'ko' },
  { visa_type: 'E7', requirement: '전공/경력 일치 증빙(학위, 경력증명)', weight: 80, locale: 'ko' },
  { visa_type: 'E7', requirement: 'TOPIK 4급 이상 또는 사내 한국어 테스트 통과', weight: 70, locale: 'ko' },
  { visa_type: 'E7', requirement: '사업자등록증, 4대보험 가입증명 등 기업 서류 준비', weight: 60, locale: 'ko' },
  { visa_type: 'F2', requirement: '소득/점수제 요건 충족', weight: 80, locale: 'ko' },
  { visa_type: 'D10', requirement: 'Completion or expiry of D-2 study', weight: 90, locale: 'en' },
  { visa_type: 'D10', requirement: 'Job search plan/portfolio', weight: 70, locale: 'en' },
  { visa_type: 'E7', requirement: 'Employment contract (salary meets threshold)', weight: 100, locale: 'en' },
  { visa_type: 'E7', requirement: 'Employer meets headcount and hiring requirements', weight: 90, locale: 'en' },
  { visa_type: 'E7', requirement: 'Proof of matching major/experience', weight: 80, locale: 'en' },
  { visa_type: 'E7', requirement: 'TOPIK 4+ or internal Korean test passed', weight: 70, locale: 'en' },
  { visa_type: 'E7', requirement: 'Business registration, social insurance docs ready', weight: 60, locale: 'en' },
  { visa_type: 'F2', requirement: 'Income/points requirements met', weight: 80, locale: 'en' },
];

async function main() {
  await sql.begin(async (tx) => {
    await tx`delete from visa_jobs where locale in ('vi','ko','en')`;
    await tx`delete from visa_requirements where locale in ('vi','ko','en')`;
    await tx`insert into visa_jobs ${tx(jobs)}`;
    await tx`insert into visa_requirements ${tx(requirements)}`;
  });
  console.log('Seeded visa_jobs and visa_requirements');
  await sql.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch {}
  process.exit(1);
});
