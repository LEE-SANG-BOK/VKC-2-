#!/usr/bin/env node

/**
 * GitHub 자동 이슈 생성 및 커밋 시스템
 * Agent 작업 완료 시 자동으로 이슈 생성 및 커밋
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// .env 파일 로드
config({ path: '/Users/bk/Desktop/viet-kconnect/.env' })

// 환경 변수 확인
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
const REPO_OWNER = 'leesangbok1'
const REPO_NAME = 'vkc'

if (!GITHUB_TOKEN) {
  console.warn('⚠️ GITHUB_TOKEN 환경 변수가 설정되지 않음 (GitHub 기능 비활성화)')
  console.log('   export GITHUB_TOKEN=your_token_here')
}

/**
 * Agent 작업 완료 확인
 */
function checkAgentCompletion() {
  const agentFiles = [
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-2-nextjs-structure.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-3-supabase-setup.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-4-database-schema.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-5-auth-system.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-6-social-login.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-7-crud-api.md',
    '/Users/bk/Desktop/viet-kconnect/docs/agents/agent-8-ui-components.md'
  ]

  const completedAgents = []
  const pendingAgents = []

  agentFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      const agentNumber = path.basename(file).match(/agent-(\d+)/)?.[1]

      // 더 정확한 완료 상태 감지
      if (content.includes('✅ 완료') ||
          content.includes('✅ **완료**') ||
          content.includes('Agent ' + agentNumber + ' 작업 완료') ||
          content.includes(`## ✅ Agent ${agentNumber} 작업 완료`)) {
        completedAgents.push(`Agent ${agentNumber}`)
      } else {
        pendingAgents.push(`Agent ${agentNumber}`)
      }
    }
  })

  return { completedAgents, pendingAgents }
}

/**
 * GitHub 이슈 생성
 */
async function createGitHubIssue(title, body, labels = []) {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        labels
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API 에러: ${response.status}`)
    }

    const issue = await response.json()
    console.log(`✅ 이슈 생성됨: #${issue.number} - ${title}`)
    console.log(`   URL: ${issue.html_url}`)
    return issue
  } catch (error) {
    console.error('❌ 이슈 생성 실패:', error.message)
    throw error
  }
}

/**
 * 커밋 및 푸시
 */
function commitAndPush(message, branch = 'main') {
  try {
    // 현재 브랜치 확인
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    console.log(`📂 현재 브랜치: ${currentBranch}`)

    // 변경사항 확인
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim()

    if (!status) {
      console.log('📝 커밋할 변경사항이 없습니다.')
      return false
    }

    console.log('📝 변경된 파일들:')
    console.log(status)

    // 스테이징 및 커밋
    execSync('git add .', { stdio: 'inherit' })

    const commitMessage = `${message}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`

    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
    console.log('✅ 커밋 완료')

    // 푸시 (main 브랜치가 아닌 경우에만)
    if (currentBranch !== 'main') {
      execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' })
      console.log('✅ 푸시 완료')
    }

    return true
  } catch (error) {
    console.error('❌ 커밋/푸시 실패:', error.message)
    throw error
  }
}

/**
 * Agent 작업 완료 처리
 */
async function processAgentCompletion() {
  console.log('🔍 Agent 작업 완료 상태 확인 중...')

  const { completedAgents, pendingAgents } = checkAgentCompletion()

  console.log('\n📊 Agent 작업 현황:')
  console.log('✅ 완료:', completedAgents.join(', ') || '없음')
  console.log('⏳ 진행중:', pendingAgents.join(', ') || '없음')

  // 새로 완료된 Agent가 있는지 확인
  const newCompletions = await checkForNewCompletions(completedAgents)

  if (newCompletions.length > 0) {
    console.log('\n🎉 새로 완료된 Agent:', newCompletions.join(', '))

    // 사용자에게 확인 요청
    const shouldProceed = await askUserConfirmation(newCompletions)

    if (shouldProceed) {
      // 커밋 수행
      const commitMessage = `feat: ${newCompletions.join(', ')} 작업 완료`
      const committed = commitAndPush(commitMessage)

      if (committed) {
        // GitHub 이슈 생성
        await createCompletionIssues(newCompletions)
      }
    } else {
      console.log('🚫 사용자가 자동 처리를 취소했습니다.')
    }
  } else {
    console.log('\n📝 새로 완료된 Agent가 없습니다.')
  }
}

/**
 * 새로 완료된 Agent 확인
 */
async function checkForNewCompletions(currentCompleted) {
  const lastProcessedFile = '/Users/bk/Desktop/viet-kconnect/.last-processed-agents'
  let lastProcessed = []

  if (fs.existsSync(lastProcessedFile)) {
    try {
      lastProcessed = JSON.parse(fs.readFileSync(lastProcessedFile, 'utf8'))
    } catch (error) {
      console.log('⚠️ 이전 처리 기록을 읽을 수 없음, 새로 시작합니다.')
    }
  }

  const newCompletions = currentCompleted.filter(agent => !lastProcessed.includes(agent))

  // 현재 상태 저장
  fs.writeFileSync(lastProcessedFile, JSON.stringify(currentCompleted, null, 2))

  return newCompletions
}

/**
 * 사용자 확인 요청
 */
async function askUserConfirmation(newCompletions) {
  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)

  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log(`\n❓ ${newCompletions.join(', ')} 작업이 완료되었습니다.`)
    console.log('   자동으로 커밋하고 GitHub 이슈를 생성하시겠습니까?')

    readline.question('   (y/N): ', (answer) => {
      readline.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * 완료 이슈 생성
 */
async function createCompletionIssues(completedAgents) {
  for (const agent of completedAgents) {
    const agentNumber = agent.match(/\d+/)?.[0]

    const title = `${agent} 작업 완료 보고`
    const body = `## 🎉 ${agent} 작업 완료

### 완료 내용
- [x] ${agent} 핵심 기능 구현
- [x] 테스트 및 검증
- [x] 문서화 완료

### 다음 단계
- [ ] 코드 리뷰
- [ ] 통합 테스트
- [ ] 배포 준비

### 관련 파일
- \`docs/agents/agent-${agentNumber}-*.md\`
- 구현된 컴포넌트 및 API

🤖 자동 생성된 이슈입니다.
`

    try {
      await createGitHubIssue(title, body, ['완료', 'agent', '자동생성'])
    } catch (error) {
      console.error(`❌ ${agent} 이슈 생성 실패:`, error.message)
    }
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 GitHub 자동 이슈 생성 시스템 시작\n')

  try {
    await processAgentCompletion()
    console.log('\n✅ 처리 완료')
  } catch (error) {
    console.error('\n❌ 처리 중 오류 발생:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main, processAgentCompletion, createGitHubIssue, commitAndPush }