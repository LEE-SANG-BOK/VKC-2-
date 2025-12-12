#!/usr/bin/env node
/**
 * Git 히스토리 기반 이슈 변환 스크립트
 *
 * Git 커밋 히스토리를 분석하여 누락된 이슈들을 자동으로 생성합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class HistoryToIssues {
    constructor(options = {}) {
        this.projectRoot = process.cwd();
        this.maxCommits = options.maxCommits || 50;
        this.excludePatterns = options.excludePatterns || [
            /^Merge /i,
            /^Revert /i,
            /^Initial commit/i,
            /^Update README/i,
            /^Add .gitignore/i,
            /^Version bump/i
        ];
        this.issues = [];
    }

    getCommitHistory() {
        console.log('📜 Git 커밋 히스토리 분석 중...\n');

        try {
            // 최근 커밋들 가져오기 (제한된 수)
            const gitLog = execSync(
                `git log --oneline --no-merges -${this.maxCommits} --pretty=format:"%H|%s|%an|%ad" --date=short`,
                { encoding: 'utf8' }
            );

            const commits = gitLog.trim().split('\n').map(line => {
                const [hash, message, author, date] = line.split('|');
                return { hash, message, author, date };
            });

            console.log(`📊 분석할 커밋 수: ${commits.length}개`);
            return commits;

        } catch (error) {
            console.error('❌ Git 히스토리를 가져올 수 없습니다:', error.message);
            return [];
        }
    }

    categorizeCommit(message) {
        const categories = {
            feature: {
                patterns: [/^feat/i, /^add/i, /^implement/i, /새.*기능/i, /기능.*추가/i],
                type: '기능 요청',
                labels: ['feature', 'enhancement'],
                priority: '보통'
            },
            bugfix: {
                patterns: [/^fix/i, /^bug/i, /^resolve/i, /버그.*수정/i, /오류.*해결/i],
                type: '버그 리포트',
                labels: ['bug', 'needs-fix'],
                priority: '높음'
            },
            docs: {
                patterns: [/^docs/i, /^documentation/i, /문서/i, /readme/i],
                type: '문서화 요청',
                labels: ['documentation', 'needs-docs'],
                priority: '낮음'
            },
            style: {
                patterns: [/^style/i, /^format/i, /스타일/i, /포맷/i],
                type: '기능 요청',
                labels: ['style', 'code-quality'],
                priority: '낮음'
            },
            refactor: {
                patterns: [/^refactor/i, /리팩터/i, /개선/i, /정리/i],
                type: '기능 요청',
                labels: ['refactor', 'code-quality'],
                priority: '보통'
            },
            test: {
                patterns: [/^test/i, /테스트/i, /spec/i],
                type: '기능 요청',
                labels: ['testing', 'quality-assurance'],
                priority: '보통'
            },
            chore: {
                patterns: [/^chore/i, /^update/i, /^upgrade/i, /^config/i, /설정/i, /업데이트/i],
                type: '기능 요청',
                labels: ['maintenance', 'chore'],
                priority: '낮음'
            }
        };

        for (const [category, config] of Object.entries(categories)) {
            if (config.patterns.some(pattern => pattern.test(message))) {
                return { category, ...config };
            }
        }

        // 기본 분류
        return {
            category: 'feature',
            type: '기능 요청',
            labels: ['enhancement'],
            priority: '보통'
        };
    }

    shouldExcludeCommit(message) {
        return this.excludePatterns.some(pattern => pattern.test(message));
    }

    generateIssueFromCommit(commit) {
        if (this.shouldExcludeCommit(commit.message)) {
            return null;
        }

        const category = this.categorizeCommit(commit.message);

        // 제목 생성 (커밋 메시지에서 타입 제거)
        let title = commit.message;
        const typeMatch = title.match(/^(\w+)(?:\(.+\))?\s*:\s*(.+)/);
        if (typeMatch) {
            title = typeMatch[2];
        }

        // 첫 글자 대문자화
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // 설명 생성
        const description = this.generateIssueDescription(commit, category);

        return {
            title,
            type: category.type,
            description,
            labels: [...category.labels, 'from-history'],
            priority: category.priority,
            commit: commit.hash,
            author: commit.author,
            date: commit.date
        };
    }

    generateIssueDescription(commit, category) {
        return `## 📋 작업 내용
${commit.message}

## 🏷️ 이슈 유형
${category.type}

## 📝 커밋 정보
- **커밋 해시**: \`${commit.hash}\`
- **작성자**: ${commit.author}
- **날짜**: ${commit.date}
- **분류**: ${category.category}

## 📊 자동 분석 결과
- **우선순위**: ${category.priority}
- **예상 라벨**: ${category.labels.join(', ')}

## ✅ 체크리스트
- [x] 개발 완료 (커밋됨)
- [ ] 이슈 검토 및 정리
- [ ] 관련 문서 업데이트
- [ ] 테스트 확인

## 🔗 관련 정보
이 이슈는 기존 커밋 히스토리에서 자동 생성되었습니다.
필요에 따라 추가 정보를 업데이트하거나 이슈를 닫아주세요.

---
*Git 히스토리 기반 자동 생성 이슈*`;
    }

    processCommits(commits) {
        console.log('🔄 커밋 분석 및 이슈 생성 중...\n');

        const issues = [];
        const stats = {
            total: commits.length,
            excluded: 0,
            generated: 0,
            byCategory: {}
        };

        commits.forEach((commit, index) => {
            console.log(`📝 [${index + 1}/${commits.length}] ${commit.message.substring(0, 60)}...`);

            const issue = this.generateIssueFromCommit(commit);

            if (issue) {
                issues.push(issue);
                stats.generated++;

                // 카테고리별 통계
                const category = this.categorizeCommit(commit.message).category;
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

                console.log(`   ✅ 이슈 생성: ${issue.title.substring(0, 50)}...`);
            } else {
                stats.excluded++;
                console.log(`   ⏭️  제외됨`);
            }
        });

        console.log('\n📊 분석 완료:');
        console.log(`   • 총 커밋: ${stats.total}개`);
        console.log(`   • 생성된 이슈: ${stats.generated}개`);
        console.log(`   • 제외된 커밋: ${stats.excluded}개`);

        console.log('\n📈 카테고리별 통계:');
        Object.entries(stats.byCategory).forEach(([category, count]) => {
            console.log(`   • ${category}: ${count}개`);
        });

        this.issues = issues;
        return { issues, stats };
    }

    generateGitHubScript(issues) {
        console.log('\n📝 GitHub 이슈 생성 스크립트 생성 중...');

        const commands = issues.map((issue, index) => {
            const labels = issue.labels.join(',');
            const body = issue.description.replace(/"/g, '\\"').replace(/\n/g, '\\n');

            return `
echo "📋 이슈 ${index + 1}/${issues.length} 생성 중: ${issue.title.substring(0, 40)}..."
gh issue create \\
  --title "${issue.title}" \\
  --body "${body}" \\
  --label "${labels}"

if [ $? -eq 0 ]; then
    echo "✅ 이슈 ${index + 1} 생성 완료"
else
    echo "❌ 이슈 ${index + 1} 생성 실패"
fi
echo ""`;
        });

        const script = `#!/bin/bash
# Git 히스토리 기반 이슈 자동 생성 스크립트
# 실행 전에 GitHub CLI가 설치되어 있고 인증되어 있는지 확인하세요.

echo "🚀 Git 히스토리 기반 이슈 생성을 시작합니다..."
echo "📊 생성할 이슈 수: ${issues.length}개"
echo ""

# GitHub CLI 설치 확인
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI가 설치되어 있지 않습니다."
    echo "설치 방법: https://cli.github.com/"
    exit 1
fi

# GitHub 인증 확인
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI 인증이 필요합니다."
    echo "다음 명령어를 실행하여 인증하세요: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI 준비 완료"
echo ""

# 사용자 확인
read -p "⚠️ ${issues.length}개의 이슈를 생성하시겠습니까? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 이슈 생성이 취소되었습니다."
    exit 0
fi

echo "🔄 이슈 생성 시작..."
echo ""

${commands.join('')}

echo "🎉 모든 이슈 생성이 완료되었습니다!"
echo "GitHub 저장소에서 생성된 이슈들을 확인하세요."`;

        return script;
    }

    generateReport(issues, stats) {
        const report = `# Git 히스토리 기반 이슈 생성 보고서

## 📊 분석 결과

- **분석 대상 커밋**: ${stats.total}개
- **생성된 이슈**: ${stats.generated}개
- **제외된 커밋**: ${stats.excluded}개
- **분석 날짜**: ${new Date().toLocaleString('ko-KR')}

## 📈 카테고리별 분포

${Object.entries(stats.byCategory).map(([category, count]) =>
    `- **${category}**: ${count}개`
).join('\n')}

## 📋 생성된 이슈 목록

${issues.map((issue, index) => `
### ${index + 1}. ${issue.title}

- **타입**: ${issue.type}
- **우선순위**: ${issue.priority}
- **라벨**: ${issue.labels.join(', ')}
- **커밋**: \`${issue.commit}\`
- **작성자**: ${issue.author}
- **날짜**: ${issue.date}
`).join('')}

## 🛠️ 이슈 생성 방법

1. **GitHub CLI 설치 및 인증**
   \`\`\`bash
   # GitHub CLI 설치 (macOS)
   brew install gh

   # 인증
   gh auth login
   \`\`\`

2. **이슈 생성 스크립트 실행**
   \`\`\`bash
   chmod +x scripts/create-issues.sh
   ./scripts/create-issues.sh
   \`\`\`

## 📝 권장 사항

1. **생성된 이슈 검토**: 자동 생성된 이슈들을 검토하고 필요시 수정
2. **중복 이슈 확인**: 기존 이슈와 중복되는 내용이 있는지 확인
3. **라벨 정리**: 프로젝트에 맞게 라벨을 조정
4. **마일스톤 할당**: 적절한 마일스톤에 이슈들을 할당

---
*이 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.*`;

        return report;
    }

    async main() {
        console.log('🔄 Git 히스토리 기반 이슈 생성 시스템\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        try {
            // Git 히스토리 가져오기
            const commits = this.getCommitHistory();

            if (commits.length === 0) {
                console.log('❌ 처리할 커밋이 없습니다.');
                return;
            }

            // 커밋 분석 및 이슈 생성
            const { issues, stats } = this.processCommits(commits);

            if (issues.length === 0) {
                console.log('\n❌ 생성할 이슈가 없습니다.');
                return;
            }

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // GitHub 스크립트 생성
            const script = this.generateGitHubScript(issues);
            const scriptPath = path.join(this.projectRoot, 'scripts', 'create-issues.sh');

            // scripts 디렉토리가 없으면 생성
            const scriptsDir = path.dirname(scriptPath);
            if (!fs.existsSync(scriptsDir)) {
                fs.mkdirSync(scriptsDir, { recursive: true });
            }

            fs.writeFileSync(scriptPath, script);
            execSync(`chmod +x "${scriptPath}"`);

            console.log(`✅ 이슈 생성 스크립트가 생성되었습니다: ${scriptPath}`);

            // 보고서 생성
            const report = this.generateReport(issues, stats);
            const reportPath = path.join(this.projectRoot, 'scripts', 'history-issues-report.md');
            fs.writeFileSync(reportPath, report);

            console.log(`📄 이슈 생성 보고서가 생성되었습니다: ${reportPath}`);

            console.log('\n🎉 Git 히스토리 기반 이슈 생성 시스템 설정이 완료되었습니다!');
            console.log('\n📝 다음 단계:');
            console.log('   1. GitHub CLI 설치 및 인증 (gh auth login)');
            console.log('   2. 생성된 스크립트 실행 (./scripts/create-issues.sh)');
            console.log('   3. GitHub 저장소에서 이슈 확인 및 정리');

        } catch (error) {
            console.error('❌ 스크립트 실행 중 오류:', error.message);
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const generator = new HistoryToIssues();
    generator.main().catch(error => {
        console.error('❌ 스크립트 실행 중 오류:', error);
        process.exit(1);
    });
}

module.exports = HistoryToIssues;