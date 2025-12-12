import sys
import json
import re

def guess_issue_type(description):
    """Heuristic to guess the issue type from the description."""
    desc_lower = description.lower()
    if any(keyword in desc_lower for keyword in ['버그', '수정', '고침', 'fix', 'bug', 'error']):
        return '버그 리포트'
    if any(keyword in desc_lower for keyword in ['추가', '개발', '구현', 'add', 'feature', 'implement']):
        return '기능 요청'
    if any(keyword in desc_lower for keyword in ['리팩토링', '개선', 'refactor', 'improve', 'optimize']):
        return '코드 리팩토링'
    if any(keyword in desc_lower for keyword in ['문서', '정리', 'doc', 'documentation', 'template']):
        return '문서'
    return '기타'

def guess_labels(description):
    """Heuristic to guess labels from the description."""
    desc_lower = description.lower()
    labels = []

    # Mapping keywords to labels
    label_map = {
        'bug': ['bug'],
        '수정': ['bug'],
        '고침': ['bug'],
        'fix': ['bug'],
        'error': ['bug'],
        '문제': ['bug'], 
        '오류': ['bug'], 

        '기능': ['기능', 'enhancement'],
        'feature': ['기능', 'enhancement'],
        '추가': ['기능', 'enhancement'],
        '개발': ['기능', 'enhancement'],
        '구현': ['기능', 'enhancement'], 
        '설정': ['기능', 'enhancement'], 
        '시스템': ['기능', 'enhancement'], 
        '완성': ['기능', 'enhancement'], 
        'implement': ['기능', 'enhancement'],

        '리팩토링': ['코드 리팩토링', 'enhancement'], 
        '개선': ['enhancement'], 
        'refactor': ['코드 리팩토링', 'enhancement'],
        'improve': ['enhancement'],
        'optimize': ['enhancement'],
        '성능': ['enhancement'],
        '대응': ['enhancement'], 
        '최적화': ['enhancement'], 

        '문서': ['다큐멘테이션', 'documentation'],
        'doc': ['다큐멘테이션', 'documentation'],
        'template': ['다큐멘테이션', 'documentation'],
        '정리': ['다큐멘테이션', 'documentation'],
        '템플릿': ['다큐멘테이션', 'documentation'], 
        '관리': ['다큐멘테이션', 'documentation'], 

        'backend': ['backend'],
        '백엔드': ['backend'],
        'frontend': ['frontend'],
        '프론트엔드': ['frontend'],

        '테스트': ['테스트'],
        'test': ['테스트'],

        # Other specific labels from the user's list
        'duplicate': ['duplicate'],
        'invalid': ['invalid'],
        'question': ['question'],
        'help wanted': ['help wanted'],
        'good first issue': ['good first issue'],
        'wontfix': ['wontfix'],
        '보통': ['보통'],
        '복잡': ['복잡'],
        '쉬움': ['쉬움'],
    }

    # Check for keywords and add labels
    for keyword, suggested_labels in label_map.items():
        if keyword in desc_lower:
            labels.extend(suggested_labels)

    # Remove duplicates and return
    return list(set(labels))

def generate_issue_proposal(task_description):
    """
    Generates a structured issue proposal from a task description.
    """
    title = task_description.strip().split('\n')[0]
    issue_type = guess_issue_type(task_description)
    description = task_description
    labels = guess_labels(task_description) # New: guess labels

    proposal = {
        "title": title,
        "type": issue_type,
        "description": description,
        "labels": labels # New: include labels
    }

    print(json.dumps(proposal, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        full_description = " ".join(sys.argv[1:])
        generate_issue_proposal(full_description)
    else:
        print(json.dumps({"error": "No task description provided.", "usage": "python auto_issue_agent.py \"<task description>\""}))
