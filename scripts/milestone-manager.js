#!/usr/bin/env node
/**
 * 마일스톤 자동 관리 시스템
 *
 * 프로젝트 상태를 분석하여 적절한 마일스톤을 생성하고 관리합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MilestoneManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.milestones = [];
    }

    analyzeProject() {
        console.log('🔍 프로젝트 분석 중...\n');

        const analysis = {
            packageInfo: this.getPackageInfo(),
            gitInfo: this.getGitInfo(),
            fileStructure: this.analyzeFileStructure(),
            issueCount: this.estimateIssueCount()
        };

        return analysis;
    }

    getPackageInfo() {
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return {
                    name: packageJson.name || 'Unknown',
                    version: packageJson.version || '0.1.0',
                    description: packageJson.description || '',
                    dependencies: Object.keys(packageJson.dependencies || {}),
                    devDependencies: Object.keys(packageJson.devDependencies || {})
                };
            }
        } catch (error) {
            console.warn('⚠️ package.json을 읽을 수 없습니다:', error.message);
        }

        return null;
    }

    getGitInfo() {
        try {
            const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
            const lastCommit = execSync('git log -1 --format="%h %s"', { encoding: 'utf8' }).trim();
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

            return {
                commitCount: parseInt(commitCount, 10),
                lastCommit,
                currentBranch: branch
            };
        } catch (error) {
            console.warn('⚠️ Git 정보를 가져올 수 없습니다:', error.message);
            return null;
        }
    }

    analyzeFileStructure() {
        const structure = {
            totalFiles: 0,
            sourceFiles: 0,
            testFiles: 0,
            configFiles: 0,
            docFiles: 0
        };

        try {
            const files = execSync('find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.next/*"', { encoding: 'utf8' })
                .split('\n')
                .filter(f => f.trim());

            structure.totalFiles = files.length;

            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                const filename = path.basename(file).toLowerCase();

                if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c'].includes(ext)) {
                    structure.sourceFiles++;
                } else if (filename.includes('test') || filename.includes('spec') || file.includes('/test/')) {
                    structure.testFiles++;
                } else if (['.json', '.yml', '.yaml', '.toml', '.config.js'].includes(ext) || filename.includes('config')) {
                    structure.configFiles++;
                } else if (['.md', '.txt', '.rst'].includes(ext)) {
                    structure.docFiles++;
                }
            });
        } catch (error) {
            console.warn('⚠️ 파일 구조 분석 실패:', error.message);
        }

        return structure;
    }

    estimateIssueCount() {
        // 파일 수와 복잡도를 기반으로 예상 이슈 수 계산
        const { sourceFiles, totalFiles } = this.analyzeFileStructure();

        // 기본적으로 소스 파일 5개당 1개의 이슈 + 총 파일 수의 10%
        const estimatedIssues = Math.max(Math.floor(sourceFiles / 5) + Math.floor(totalFiles * 0.1), 5);

        return Math.min(estimatedIssues, 50); // 최대 50개
    }

    generateMilestones(analysis) {
        console.log('📋 마일스톤 생성 중...\n');

        const today = new Date();
        const milestones = [];

        // 1. 프로젝트 초기 설정
        milestones.push({
            title: '🚀 프로젝트 초기 설정',
            description: '프로젝트 기본 구조 설정 및 개발 환경 구축',
            dueDate: this.addDays(today, 14),
            state: 'open'
        });

        // 2. 핵심 기능 개발
        milestones.push({
            title: '⚡ 핵심 기능 개발',
            description: '주요 기능 구현 및 기본 사용자 인터페이스 개발',
            dueDate: this.addDays(today, 30),
            state: 'open'
        });

        // 3. 테스트 및 품질 보증
        milestones.push({
            title: '🧪 테스트 및 품질 보증',
            description: '단위 테스트, 통합 테스트 및 코드 품질 개선',
            dueDate: this.addDays(today, 45),
            state: 'open'
        });

        // 4. 성능 최적화
        milestones.push({
            title: '🚄 성능 최적화',
            description: '시스템 성능 개선 및 사용자 경험 향상',
            dueDate: this.addDays(today, 60),
            state: 'open'
        });

        // 5. 출시 준비
        milestones.push({
            title: '🎯 출시 준비',
            description: '문서 정리, 배포 준비 및 최종 검토',
            dueDate: this.addDays(today, 75),
            state: 'open'
        });

        this.milestones = milestones;
        return milestones;
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    generateGitHubCommands() {
        console.log('📝 GitHub CLI 명령어 생성 중...\n');

        const commands = this.milestones.map(milestone => {
            const dueDate = this.formatDate(milestone.dueDate);
            return `gh api repos/:owner/:repo/milestones \\
  --method POST \\
  --field title="${milestone.title}" \\
  --field description="${milestone.description}" \\
  --field due_on="${dueDate}T23:59:59Z" \\
  --field state="${milestone.state}"`;
        });

        return commands;
    }

    generateScript() {
        const commands = this.generateGitHubCommands();

        const script = `#!/bin/bash
# 마일스톤 자동 생성 스크립트
# 실행 전에 GitHub CLI가 설치되어 있고 인증되어 있는지 확인하세요.

echo "🚀 마일스톤 생성을 시작합니다..."
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

${commands.map((cmd, index) => `
echo "📋 마일스톤 ${index + 1} 생성 중..."
${cmd}
if [ $? -eq 0 ]; then
    echo "✅ 마일스톤 ${index + 1} 생성 완료"
else
    echo "❌ 마일스톤 ${index + 1} 생성 실패"
fi
echo ""
`).join('')}

echo "🎉 모든 마일스톤 생성이 완료되었습니다!"
echo "GitHub 저장소에서 마일스톤을 확인하세요."`;

        return script;
    }

    generateReport(analysis) {
        const report = `# 프로젝트 마일스톤 관리 보고서

## 📊 프로젝트 분석 결과

### 기본 정보
${analysis.packageInfo ? `
- **프로젝트명**: ${analysis.packageInfo.name}
- **버전**: ${analysis.packageInfo.version}
- **설명**: ${analysis.packageInfo.description}
` : '- package.json 정보 없음'}

### Git 정보
${analysis.gitInfo ? `
- **총 커밋 수**: ${analysis.gitInfo.commitCount}
- **현재 브랜치**: ${analysis.gitInfo.currentBranch}
- **최근 커밋**: ${analysis.gitInfo.lastCommit}
` : '- Git 정보 없음'}

### 파일 구조
- **총 파일 수**: ${analysis.fileStructure.totalFiles}
- **소스 파일**: ${analysis.fileStructure.sourceFiles}
- **테스트 파일**: ${analysis.fileStructure.testFiles}
- **설정 파일**: ${analysis.fileStructure.configFiles}
- **문서 파일**: ${analysis.fileStructure.docFiles}

### 예상 이슈 수
- **예상 이슈 수**: ${analysis.issueCount}개

## 📋 생성된 마일스톤

${this.milestones.map((milestone, index) => `
### ${index + 1}. ${milestone.title}

- **설명**: ${milestone.description}
- **마감일**: ${this.formatDate(milestone.dueDate)}
- **상태**: ${milestone.state}
`).join('')}

## 🛠️ 마일스톤 생성 방법

1. **GitHub CLI 설치 및 인증**
   \`\`\`bash
   # GitHub CLI 설치 (macOS)
   brew install gh

   # 인증
   gh auth login
   \`\`\`

2. **마일스톤 생성 스크립트 실행**
   \`\`\`bash
   chmod +x scripts/create-milestones.sh
   ./scripts/create-milestones.sh
   \`\`\`

## 📈 권장 사항

1. **정기적인 마일스톤 검토**: 매주 진행 상황을 검토하고 필요시 조정
2. **이슈 분배**: 각 마일스톤에 적절한 수의 이슈를 할당
3. **우선순위 관리**: 중요도에 따라 이슈의 우선순위를 설정
4. **진행률 모니터링**: 마일스톤별 완료율을 정기적으로 확인

---
*이 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.*`;

        return report;
    }

    async main() {
        console.log('🎯 마일스톤 자동 관리 시스템\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        try {
            // 프로젝트 분석
            const analysis = this.analyzeProject();

            // 마일스톤 생성
            const milestones = this.generateMilestones(analysis);

            // 결과 출력
            console.log('📋 생성된 마일스톤:');
            milestones.forEach((milestone, index) => {
                console.log(`\n${index + 1}. ${milestone.title}`);
                console.log(`   📅 마감일: ${this.formatDate(milestone.dueDate)}`);
                console.log(`   📝 설명: ${milestone.description}`);
            });

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // 스크립트 생성
            const script = this.generateScript();
            const scriptPath = path.join(this.projectRoot, 'scripts', 'create-milestones.sh');

            // scripts 디렉토리가 없으면 생성
            const scriptsDir = path.dirname(scriptPath);
            if (!fs.existsSync(scriptsDir)) {
                fs.mkdirSync(scriptsDir, { recursive: true });
            }

            fs.writeFileSync(scriptPath, script);
            execSync(`chmod +x "${scriptPath}"`);

            console.log(`✅ 마일스톤 생성 스크립트가 생성되었습니다: ${scriptPath}`);

            // 보고서 생성
            const report = this.generateReport(analysis);
            const reportPath = path.join(this.projectRoot, 'scripts', 'milestone-report.md');
            fs.writeFileSync(reportPath, report);

            console.log(`📄 마일스톤 관리 보고서가 생성되었습니다: ${reportPath}`);

            console.log('\n🎉 마일스톤 관리 시스템 설정이 완료되었습니다!');
            console.log('\n📝 다음 단계:');
            console.log('   1. GitHub CLI 설치 및 인증 (gh auth login)');
            console.log('   2. 생성된 스크립트 실행 (./scripts/create-milestones.sh)');
            console.log('   3. GitHub 저장소에서 마일스톤 확인');

        } catch (error) {
            console.error('❌ 마일스톤 관리 시스템 설정 중 오류:', error.message);
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const manager = new MilestoneManager();
    manager.main().catch(error => {
        console.error('❌ 스크립트 실행 중 오류:', error);
        process.exit(1);
    });
}

module.exports = MilestoneManager;