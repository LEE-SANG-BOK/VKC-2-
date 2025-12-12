import sys
import os
import re
from datetime import datetime

def create_issue():
    """
    Creates a new issue markdown file from command-line arguments.
    """
    if len(sys.argv) < 4:
        print("사용법: python create_issue.py \"<제목>\" \"<유형>\" \"<설명>\"")
        print("유형: 버그 리포트, 기능 요청, 코드 리팩토링, 문서, 기타")
        return

    title = sys.argv[1]
    issue_type = sys.argv[2]
    description = sys.argv[3]

    try:
        # Get the absolute path to the project root directory
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(project_root, 'GITHUB_ISSUE_CREATE_TEMPLATE.md')

        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()

        # Replace title and description
        issue_content = template.replace('[여기에 한 줄로 요약된 이슈 제목을 작성하세요]', title)
        issue_content = issue_content.replace('[여기에 이슈에 대한 자세한 설명을 작성하세요. 무엇을, 왜 제안하는지 명확하게 기술합니다.]', description)

        # Check the correct issue type box
        # This regex ensures we only check the box for the specified type
        issue_content = re.sub(f'- \[ \] {re.escape(issue_type)}', f'- [x] {issue_type}', issue_content)

        # If it's not a bug report, remove the bug report section
        if '버그 리포트' not in issue_type:
            issue_content = re.sub(r'---(\n|.)*### 버그 리포트의 경우 \(For Bug Reports\)[\s\S]*', '', issue_content)

        # Generate a unique, descriptive filename
        slug_title = re.sub(r'[\s\W]+', '-', title.lower()).strip('-')
        timestamp = datetime.now().strftime('%Y%m%d')
        filename = f"ISSUE-{timestamp}-{slug_title}.md"
        
        # Save the file in the project root
        output_path = os.path.join(project_root, filename)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(issue_content)
            
        print(f"성공적으로 이슈 파일을 생성했습니다: {output_path}")

    except FileNotFoundError:
        print(f"오류: 템플릿 파일을 찾을 수 없습니다. '{template_path}'")
    except Exception as e:
        print(f"오류가 발생했습니다: {e}")

if __name__ == "__main__":
    create_issue()
