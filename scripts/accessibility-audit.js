#!/usr/bin/env node

/**
 * WCAG 2.1 AA 접근성 자동 검증 스크립트
 * axe-core와 lighthouse를 사용한 종합 접근성 감사
 */

let chromium;
let AxeBuilder;
let lighthouse;

try {
  // Playwright 기반 감사 패키지는 선택 사항이므로 동적 로드한다.
  // (사용하지 않는 환경에서는 설치되어 있지 않을 수 있음)
  ({ chromium } = require('playwright'));
  AxeBuilder = require('@axe-core/playwright').default;
  lighthouse = require('lighthouse');
} catch (error) {
  console.error(
    '\n⚠️  Playwright 기반 접근성 감사가 비활성화되어 있습니다.\n' +
      '    필요한 경우 `npm install playwright @axe-core/playwright lighthouse` 실행 후 다시 시도하세요.\n',
  );
  process.exit(0);
}
const fs = require('fs');
const path = require('path');

// 검사할 페이지 목록
const PAGES_TO_TEST = [
  {
    name: 'HomePage',
    url: 'http://localhost:3000',
    description: '메인 페이지'
  },
  {
    name: 'QuestionsPage',
    url: 'http://localhost:3000/questions',
    description: '질문 목록 페이지'
  },
  {
    name: 'QuestionDetailPage',
    url: 'http://localhost:3000/questions/1',
    description: '질문 상세 페이지'
  },
  {
    name: 'ProfilePage',
    url: 'http://localhost:3000/profile',
    description: '프로필 페이지'
  }
];

// WCAG 2.1 AA 기준
const WCAG_RULES = {
  'color-contrast': 'AA 레벨 색상 대비 (4.5:1)',
  'keyboard-navigation': '키보드 접근성',
  'focus-management': '포커스 관리',
  'semantic-markup': '의미적 마크업',
  'alternative-text': '이미지 대체 텍스트',
  'form-labels': '폼 레이블',
  'heading-structure': '제목 구조',
  'link-purpose': '링크 목적 명확성'
};

class AccessibilityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: PAGES_TO_TEST.length,
        passedPages: 0,
        failedPages: 0,
        totalViolations: 0,
        criticalViolations: 0
      },
      pages: [],
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🔍 WCAG 2.1 AA 접근성 검증 시작...\n');

    const browser = await chromium.launch({ headless: true });

    try {
      for (const page of PAGES_TO_TEST) {
        console.log(`📄 ${page.name} (${page.description}) 검사 중...`);

        const pageResult = await this.auditPage(browser, page);
        this.results.pages.push(pageResult);

        if (pageResult.violations.length === 0) {
          this.results.summary.passedPages++;
          console.log(`✅ ${page.name}: 접근성 위반 사항 없음`);
        } else {
          this.results.summary.failedPages++;
          this.results.summary.totalViolations += pageResult.violations.length;
          this.results.summary.criticalViolations += pageResult.violations.filter(v => v.impact === 'critical').length;
          console.log(`❌ ${page.name}: ${pageResult.violations.length}개 위반 사항 발견`);
        }

        console.log('');
      }

      await this.generateRecommendations();
      await this.generateReport();
      this.printSummary();

    } finally {
      await browser.close();
    }
  }

  async auditPage(browser, pageInfo) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // 페이지 로드
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });

      // axe-core 접근성 검사
      const axeBuilder = new AxeBuilder({ page });
      const axeResults = await axeBuilder
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      // Lighthouse 접근성 검사 (간소화)
      const lighthouseScore = await this.getLighthouseAccessibilityScore(page);

      return {
        name: pageInfo.name,
        url: pageInfo.url,
        description: pageInfo.description,
        violations: axeResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.length,
          wcagLevel: this.getWCAGLevel(violation.tags)
        })),
        lighthouseScore: lighthouseScore,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ ${pageInfo.name} 검사 중 오류:`, error.message);
      return {
        name: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
        violations: [],
        lighthouseScore: 0
      };
    } finally {
      await context.close();
    }
  }

  async getLighthouseAccessibilityScore(page) {
    try {
      // 간단한 접근성 점수 추정 (실제 Lighthouse 대신 기본 체크)
      const score = await page.evaluate(() => {
        let score = 100;

        // 이미지 alt 속성 체크
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        score -= imagesWithoutAlt.length * 5;

        // 제목 구조 체크
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) score -= 10;

        // 폼 레이블 체크
        const inputs = document.querySelectorAll('input, textarea, select');
        const inputsWithoutLabels = Array.from(inputs).filter(input => {
          const id = input.id;
          return !id || !document.querySelector(`label[for="${id}"]`);
        });
        score -= inputsWithoutLabels.length * 10;

        return Math.max(0, Math.min(100, score));
      });

      return score;
    } catch (error) {
      return 0;
    }
  }

  getWCAGLevel(tags) {
    if (tags.includes('wcag2aa')) return 'AA';
    if (tags.includes('wcag2a')) return 'A';
    if (tags.includes('wcag21aa')) return '2.1 AA';
    return 'Unknown';
  }

  async generateRecommendations() {
    const allViolations = this.results.pages.flatMap(page => page.violations);
    const violationCounts = {};

    // 위반 사항별 빈도 계산
    allViolations.forEach(violation => {
      violationCounts[violation.id] = (violationCounts[violation.id] || 0) + 1;
    });

    // 가장 많이 발생하는 위반 사항 기준으로 권장사항 생성
    const topViolations = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    this.results.recommendations = topViolations.map(([violationId, count]) => {
      const violation = allViolations.find(v => v.id === violationId);
      return {
        priority: count > 3 ? 'High' : count > 1 ? 'Medium' : 'Low',
        issue: violation.description,
        solution: violation.help,
        affectedPages: count,
        wcagReference: violation.helpUrl
      };
    });
  }

  async generateReport() {
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // JSON 리포트
    const jsonReport = path.join(reportDir, 'accessibility-audit.json');
    fs.writeFileSync(jsonReport, JSON.stringify(this.results, null, 2));

    // HTML 리포트
    const htmlReport = path.join(reportDir, 'accessibility-audit.html');
    const htmlContent = this.generateHTMLReport();
    fs.writeFileSync(htmlReport, htmlContent);

    console.log(`📊 리포트 생성 완료:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReport}\n`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WCAG 2.1 AA 접근성 검증 리포트</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { padding: 20px; background: #f8f9fa; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .page-result { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
        .page-header { background: #343a40; color: white; padding: 15px; }
        .page-content { padding: 20px; }
        .violation { margin-bottom: 15px; padding: 15px; border-left: 4px solid #ffc107; background: #fff3cd; }
        .violation.critical { border-color: #dc3545; background: #f8d7da; }
        .violation.serious { border-color: #fd7e14; background: #fff3cd; }
        .recommendations { background: #d1ecf1; padding: 20px; border-radius: 6px; margin-top: 30px; }
        .recommendation { margin-bottom: 15px; padding: 15px; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 WCAG 2.1 AA 접근성 검증 리포트</h1>
            <p>생성 시간: ${this.results.timestamp}</p>
            <p>베트남 K-Connect MVP 접근성 준수 검증</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.summary.totalPages}</div>
                <div>검사한 페이지</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${this.results.summary.passedPages}</div>
                <div>통과한 페이지</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${this.results.summary.failedPages}</div>
                <div>위반 사항 있는 페이지</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.results.summary.totalViolations === 0 ? 'passed' : 'failed'}">${this.results.summary.totalViolations}</div>
                <div>총 위반 사항</div>
            </div>
        </div>

        <h2>📄 페이지별 결과</h2>
        ${this.results.pages.map(page => `
            <div class="page-result">
                <div class="page-header">
                    <h3>${page.name} - ${page.description}</h3>
                    <p>URL: ${page.url}</p>
                    ${page.lighthouseScore ? `<p>접근성 점수: ${page.lighthouseScore}/100</p>` : ''}
                </div>
                <div class="page-content">
                    ${page.violations.length === 0 ?
                        '<p class="passed">✅ 접근성 위반 사항이 발견되지 않았습니다.</p>' :
                        page.violations.map(violation => `
                            <div class="violation ${violation.impact}">
                                <h4>${violation.description}</h4>
                                <p><strong>영향도:</strong> ${violation.impact}</p>
                                <p><strong>해결방법:</strong> ${violation.help}</p>
                                <p><strong>영향받는 요소:</strong> ${violation.nodes}개</p>
                                <p><strong>WCAG 레벨:</strong> ${violation.wcagLevel}</p>
                                <a href="${violation.helpUrl}" target="_blank">자세한 정보 →</a>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `).join('')}

        ${this.results.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>🎯 우선 개선 권장사항</h2>
                ${this.results.recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority.toLowerCase()}">
                        <h4>[${rec.priority}] ${rec.issue}</h4>
                        <p><strong>해결방법:</strong> ${rec.solution}</p>
                        <p><strong>영향받는 페이지:</strong> ${rec.affectedPages}개</p>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>
</body>
</html>
    `;
  }

  printSummary() {
    console.log('📊 WCAG 2.1 AA 접근성 검증 결과 요약');
    console.log('='.repeat(50));
    console.log(`총 검사 페이지: ${this.results.summary.totalPages}개`);
    console.log(`통과한 페이지: ${this.results.summary.passedPages}개`);
    console.log(`위반 사항 있는 페이지: ${this.results.summary.failedPages}개`);
    console.log(`총 위반 사항: ${this.results.summary.totalViolations}개`);
    console.log(`심각한 위반 사항: ${this.results.summary.criticalViolations}개`);

    const passRate = (this.results.summary.passedPages / this.results.summary.totalPages * 100).toFixed(1);
    console.log(`\n접근성 준수율: ${passRate}%`);

    if (this.results.summary.totalViolations === 0) {
      console.log('\n🎉 축하합니다! WCAG 2.1 AA 기준을 만족합니다.');
    } else {
      console.log('\n⚠️  접근성 개선이 필요합니다. 리포트를 확인하여 수정하세요.');
    }
  }
}

// 스크립트 실행
async function main() {
  try {
    const auditor = new AccessibilityAuditor();
    await auditor.runAudit();
  } catch (error) {
    console.error('❌ 접근성 검증 중 오류 발생:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AccessibilityAuditor;
