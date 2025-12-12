#!/usr/bin/env node
/**
 * 스마트 커밋 확인 시스템
 *
 * 커밋 전에 변경사항을 분석하고 적절한 커밋 메시지를 제안하며,
 * 위험도를 평가하여 사용자에게 확인을 요청합니다.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class SmartCommitConfirm {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async analyzeChanges() {
        console.log('🔍 변경사항 분석 중...\n');

        try {
            // Git 상태 확인
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            const diffStats = execSync('git diff --stat', { encoding: 'utf8' });
            const diffNumstat = execSync('git diff --numstat', { encoding: 'utf8' });

            const changes = this.parseGitStatus(status);
            const stats = this.parseGitStats(diffNumstat);

            return {
                changes,
                stats,
                diffStats: diffStats.trim()
            };
        } catch (error) {
            console.error('❌ Git 정보를 가져올 수 없습니다:', error.message);
            return null;
        }
    }

    parseGitStatus(status) {
        const lines = status.trim().split('\n').filter(line => line);
        const changes = {
            modified: [],
            added: [],
            deleted: [],
            renamed: [],
            copied: []
        };

        lines.forEach(line => {
            const statusCode = line.substring(0, 2);
            const filename = line.substring(3);

            if (statusCode.includes('M')) changes.modified.push(filename);
            if (statusCode.includes('A')) changes.added.push(filename);
            if (statusCode.includes('D')) changes.deleted.push(filename);
            if (statusCode.includes('R')) changes.renamed.push(filename);
            if (statusCode.includes('C')) changes.copied.push(filename);
        });

        return changes;
    }

    parseGitStats(numstat) {
        const lines = numstat.trim().split('\n').filter(line => line);
        let totalAdded = 0;
        let totalDeleted = 0;
        const fileStats = [];

        lines.forEach(line => {
            const [added, deleted, filename] = line.split('\t');
            const addedNum = added === '-' ? 0 : parseInt(added, 10);
            const deletedNum = deleted === '-' ? 0 : parseInt(deleted, 10);

            totalAdded += addedNum;
            totalDeleted += deletedNum;

            fileStats.push({
                filename,
                added: addedNum,
                deleted: deletedNum
            });
        });

        return {
            totalAdded,
            totalDeleted,
            fileStats
        };
    }

    assessRisk(changes, stats) {
        let risk = 0;
        const factors = [];

        // 파일 수에 따른 위험도
        const totalFiles = Object.values(changes).flat().length;
        if (totalFiles > 10) {
            risk += 3;
            factors.push(`많은 파일 변경 (${totalFiles}개)`);
        } else if (totalFiles > 5) {
            risk += 2;
            factors.push(`여러 파일 변경 (${totalFiles}개)`);
        }

        // 변경량에 따른 위험도
        const totalChanges = stats.totalAdded + stats.totalDeleted;
        if (totalChanges > 1000) {
            risk += 3;
            factors.push(`대량 변경 (${totalChanges} lines)`);
        } else if (totalChanges > 500) {
            risk += 2;
            factors.push(`중간 변경 (${totalChanges} lines)`);
        }

        // 삭제된 파일이 많은 경우
        if (changes.deleted.length > 5) {
            risk += 2;
            factors.push(`많은 파일 삭제 (${changes.deleted.length}개)`);
        }

        // 중요 파일 변경
        const criticalFiles = [
            'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
            'Dockerfile', 'docker-compose.yml',
            '.gitignore', '.env', '.env.local'
        ];

        const modifiedCritical = Object.values(changes).flat()
            .filter(file => criticalFiles.some(critical => file.includes(critical)));

        if (modifiedCritical.length > 0) {
            risk += 2;
            factors.push(`중요 파일 변경: ${modifiedCritical.join(', ')}`);
        }

        return {
            level: risk > 5 ? 'HIGH' : risk > 2 ? 'MEDIUM' : 'LOW',
            score: risk,
            factors
        };
    }

    suggestCommitMessage(changes, stats) {
        const suggestions = [];

        // 타입 추천
        let type = 'chore';
        if (changes.added.length > changes.modified.length) {
            type = 'feat';
        } else if (changes.modified.some(file => file.includes('fix') || file.includes('bug'))) {
            type = 'fix';
        } else if (changes.modified.some(file => file.includes('.md') || file.includes('README'))) {
            type = 'docs';
        } else if (changes.modified.length > 0) {
            type = 'feat';
        }

        // 스코프 추천
        const scopes = new Set();
        Object.values(changes).flat().forEach(file => {
            const parts = file.split('/');
            if (parts.length > 1) {
                scopes.add(parts[0]);
            }
        });

        const scope = scopes.size === 1 ? Array.from(scopes)[0] : '';

        // 메시지 생성
        const scopeText = scope ? `(${scope})` : '';

        if (changes.deleted.length > 5) {
            suggestions.push(`${type}${scopeText}: 프로젝트 정리 및 불필요한 파일 제거`);
        }

        if (changes.added.length > 0 && changes.modified.length > 0) {
            suggestions.push(`${type}${scopeText}: 새 기능 추가 및 기존 코드 개선`);
        } else if (changes.added.length > 0) {
            suggestions.push(`${type}${scopeText}: 새 기능 및 파일 추가`);
        } else if (changes.modified.length > 0) {
            suggestions.push(`${type}${scopeText}: 기존 기능 개선 및 수정`);
        }

        suggestions.push(`${type}${scopeText}: 코드 업데이트 및 개선`);

        return suggestions;
    }

    displayAnalysis(changes, stats, risk, suggestions) {
        console.log('📊 변경사항 분석 결과\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 변경된 파일 요약
        console.log('📁 파일 변경 요약:');
        if (changes.added.length > 0) console.log(`  ✅ 추가: ${changes.added.length}개`);
        if (changes.modified.length > 0) console.log(`  📝 수정: ${changes.modified.length}개`);
        if (changes.deleted.length > 0) console.log(`  🗑️  삭제: ${changes.deleted.length}개`);
        if (changes.renamed.length > 0) console.log(`  🔄 이름변경: ${changes.renamed.length}개`);

        console.log('');

        // 변경량 통계
        console.log('📈 변경량 통계:');
        console.log(`  ➕ 추가된 줄: ${stats.totalAdded}`);
        console.log(`  ➖ 삭제된 줄: ${stats.totalDeleted}`);
        console.log(`  📊 총 변경량: ${stats.totalAdded + stats.totalDeleted} lines`);

        console.log('');

        // 위험도 평가
        const riskEmoji = risk.level === 'HIGH' ? '🚨' : risk.level === 'MEDIUM' ? '⚠️' : '✅';
        console.log(`${riskEmoji} 위험도 평가: ${risk.level} (점수: ${risk.score})`);
        if (risk.factors.length > 0) {
            console.log('  위험 요소:');
            risk.factors.forEach(factor => console.log(`    • ${factor}`));
        }

        console.log('');

        // 커밋 메시지 제안
        console.log('💡 추천 커밋 메시지:');
        suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion}`);
        });

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    async askConfirmation(risk) {
        const riskEmoji = risk.level === 'HIGH' ? '🚨' : risk.level === 'MEDIUM' ? '⚠️' : '✅';

        return new Promise((resolve) => {
            this.rl.question(`\n${riskEmoji} 커밋을 진행하시겠습니까? (y/N): `, (answer) => {
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }

    async askCommitMessage(suggestions) {
        console.log('\n📝 커밋 메시지를 선택하거나 직접 입력하세요:');
        console.log('   숫자를 입력하면 제안된 메시지를 사용합니다.');
        console.log('   직접 메시지를 입력할 수도 있습니다.\n');

        return new Promise((resolve) => {
            this.rl.question('커밋 메시지: ', (answer) => {
                const num = parseInt(answer, 10);
                if (num >= 1 && num <= suggestions.length) {
                    resolve(suggestions[num - 1]);
                } else {
                    resolve(answer.trim());
                }
            });
        });
    }

    async main() {
        console.log('🚀 스마트 커밋 확인 시스템\n');

        const analysis = await this.analyzeChanges();
        if (!analysis) {
            this.rl.close();
            process.exit(1);
        }

        const { changes, stats } = analysis;
        const risk = this.assessRisk(changes, stats);
        const suggestions = this.suggestCommitMessage(changes, stats);

        this.displayAnalysis(changes, stats, risk, suggestions);

        // 고위험 커밋의 경우 확인 요청
        if (risk.level === 'HIGH') {
            const confirmed = await this.askConfirmation(risk);
            if (!confirmed) {
                console.log('\n❌ 커밋이 취소되었습니다.');
                this.rl.close();
                process.exit(0);
            }
        }

        // 커밋 메시지 입력
        const commitMessage = await this.askCommitMessage(suggestions);

        if (!commitMessage.trim()) {
            console.log('\n❌ 커밋 메시지가 비어있습니다. 커밋이 취소되었습니다.');
            this.rl.close();
            process.exit(0);
        }

        // 커밋 실행
        try {
            console.log('\n⏳ 커밋 실행 중...');
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            console.log('\n✅ 커밋이 성공적으로 완료되었습니다!');
        } catch (error) {
            console.log('\n❌ 커밋 실행 중 오류가 발생했습니다:', error.message);
            this.rl.close();
            process.exit(1);
        }

        this.rl.close();
    }
}

// 스크립트 실행
if (require.main === module) {
    const smartCommit = new SmartCommitConfirm();
    smartCommit.main().catch(error => {
        console.error('❌ 스크립트 실행 중 오류:', error);
        process.exit(1);
    });
}

module.exports = SmartCommitConfirm;