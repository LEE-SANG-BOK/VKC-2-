#!/bin/bash
# 자동 배포 스크립트

set -e

echo "🚀 Viet K-Connect 자동 배포 시작"

# 환경 변수 확인
if [ -z "$PRODUCTION_SERVER" ]; then
    echo "⚠️ PRODUCTION_SERVER 환경변수를 설정하세요"
    exit 1
fi

# 1. 프로덕션 빌드
echo "📦 프로덕션 빌드 생성 중..."
npm run build

# 2. Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드 중..."
docker build -t viet-kconnect:latest .
docker tag viet-kconnect:latest viet-kconnect:$(date +%Y%m%d-%H%M%S)

# 3. 기존 컨테이너 중지 및 제거
echo "🛑 기존 서비스 중지 중..."
docker-compose down || true

# 4. 새 컨테이너 시작
echo "🟢 새 서비스 시작 중..."
docker-compose up -d

# 5. 헬스 체크
echo "🔍 서비스 상태 확인 중..."
sleep 10

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 배포 성공! 서비스가 정상 동작 중입니다."
else
    echo "❌ 배포 실패! 서비스 상태를 확인하세요."
    docker-compose logs
    exit 1
fi

# 6. 사용하지 않는 이미지 정리
echo "🧹 정리 작업 중..."
docker image prune -f

echo "🎉 배포 완료!"
echo "📱 접속 주소: http://localhost:3000"
echo "🔧 관리자: http://localhost:3000/admin.html"