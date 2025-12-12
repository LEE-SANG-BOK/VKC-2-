import subprocess
import sys

# This script creates a GitHub issue using the gh CLI.
# It reads the title from 'issue_title.txt' and the body from 'issue_body.md'
# located in the same directory where the script is executed.

def create_issue():
    """
    Reads title and body from files and creates a GitHub issue.
    """
    title_file = 'issue_title.txt'
    body_file = 'issue_body.md'

    try:
        # Read title from issue_title.txt
        with open(title_file, 'r', encoding='utf-8') as f:
            title = f.read().strip()

        if not title:
            print("Error: Title is empty. Please provide a title in issue_title.txt.", file=sys.stderr)
            sys.exit(1)

        # Construct the gh command. Arguments are passed as a list
        # to avoid shell parsing issues.
        command = [
            'gh',
            'issue',
            'create',
            '--title',
            title,
            '--body-file',
            body_file
        ]

        # Execute the command
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )

        # gh issue create outputs the URL of the new issue to stdout
        print(result.stdout.strip())
        print("Successfully created GitHub issue.", file=sys.stderr)

    except FileNotFoundError as e:
        print(f"Error: Required file not found - {e.filename}", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print("Error executing 'gh' command:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    create_issue()
