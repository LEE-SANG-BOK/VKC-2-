#!/usr/bin/env python3
"""
자동 GitHub 이슈 생성 에이전트

Git commit 메시지를 분석하여 적절한 GitHub 이슈를 자동으로 생성합니다.
"""

import json
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional

class AutoIssueAgent:
    def __init__(self):
        self.commit_patterns = {
            'feat': ('기능 요청', 'enhancement'),
            'fix': ('버그 리포트', 'bug'),
            'docs': ('문서화 요청', 'documentation'),
            'style': ('기능 요청', 'enhancement'),
            'refactor': ('기능 요청', 'enhancement'),
            'test': ('기능 요청', 'testing'),
            'chore': ('기능 요청', 'maintenance')
        }

        self.priority_keywords = {
            'urgent': '긴급',
            'critical': '긴급',
            'hotfix': '긴급',
            'high': '높음',
            'important': '높음',
            'medium': '보통',
            'low': '낮음',
            'minor': '낮음'
        }

    def analyze_commit_message(self, commit_message: str) -> Dict:
        """커밋 메시지를 분석하여 이슈 정보를 추출합니다."""

        # 커밋 메시지에서 타입 추출
        type_match = re.match(r'^(\w+)(?:\(.+\))?\s*:\s*(.+)', commit_message)

        if type_match:
            commit_type = type_match.group(1).lower()
            description = type_match.group(2)
        else:
            commit_type = 'feat'
            description = commit_message

        # 이슈 타입 결정
        issue_type, label = self.commit_patterns.get(commit_type, ('기능 요청', 'enhancement'))

        # 우선순위 결정
        priority = self._determine_priority(commit_message)

        # 제목 생성
        title = self._generate_title(commit_type, description)

        # 설명 생성
        structured_description = self._generate_description(
            commit_message, issue_type, commit_type
        )

        # 라벨 생성
        labels = self._generate_labels(commit_type, priority)

        return {
            "title": title,
            "type": issue_type,
            "description": structured_description,
            "labels": labels,
            "milestone": None,
            "template_used": True
        }

    def _determine_priority(self, commit_message: str) -> str:
        """커밋 메시지에서 우선순위를 결정합니다."""
        message_lower = commit_message.lower()

        for keyword, priority in self.priority_keywords.items():
            if keyword in message_lower:
                return priority

        return '보통'

    def _generate_title(self, commit_type: str, description: str) -> str:
        """이슈 제목을 생성합니다."""
        title = description.strip()

        # 첫 글자 대문자화
        if title:
            title = title[0].upper() + title[1:]

        return title

    def _generate_description(self, commit_message: str, issue_type: str, commit_type: str) -> str:
        """구조화된 이슈 설명을 생성합니다."""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        description = f"""
## 📋 작업 내용
{commit_message}

## 🏷️ 이슈 유형
{issue_type}

## 📝 세부 사항
- **생성 시간**: {current_time}
- **자동 생성**: Git Hook을 통한 자동 이슈 생성
- **템플릿**: {issue_type} 템플릿 사용

## ✅ 체크리스트
- [ ] 요구사항 분석 완료
- [ ] 개발 계획 수립
- [ ] 구현 완료
- [ ] 테스트 완료
- [ ] 문서 업데이트
- [ ] 코드 리뷰 완료

## 🔗 관련 정보
자동 생성된 이슈입니다. 필요에 따라 추가 정보를 업데이트해 주세요.
        """

        return description.strip()

    def _generate_labels(self, commit_type: str, priority: str) -> List[str]:
        """라벨을 생성합니다."""
        labels = ['auto-generated']

        # 커밋 타입에 따른 라벨
        type_labels = {
            'feat': ['feature', 'enhancement'],
            'fix': ['bug', 'needs-fix'],
            'docs': ['documentation', 'needs-docs'],
            'style': ['style', 'code-quality'],
            'refactor': ['refactor', 'code-quality'],
            'test': ['testing', 'quality-assurance'],
            'chore': ['maintenance', 'chore']
        }

        if commit_type in type_labels:
            labels.extend(type_labels[commit_type])

        # 우선순위 라벨
        if priority == '긴급':
            labels.append('urgent')
        elif priority == '높음':
            labels.append('high-priority')

        return labels

def main():
    """메인 함수"""
    if len(sys.argv) < 2:
        print("Usage: python auto_issue_agent.py <commit_message>")
        sys.exit(1)

    commit_message = sys.argv[1]

    try:
        agent = AutoIssueAgent()
        result = agent.analyze_commit_message(commit_message)

        # JSON으로 출력
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        # 에러가 발생해도 JSON 형태로 출력
        error_result = {
            "title": f"자동 이슈 생성 실패: {commit_message}",
            "type": "기능 요청",
            "description": f"자동 이슈 생성 중 오류가 발생했습니다.\n\n에러: {str(e)}\n\n원본 커밋: {commit_message}",
            "labels": ["auto-generated", "error"],
            "milestone": None,
            "template_used": False
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()