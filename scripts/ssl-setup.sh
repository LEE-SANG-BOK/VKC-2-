#!/bin/bash
# SSL 인증서 설정 스크립트

DOMAIN=${1:-localhost}
EMAIL=${2:-admin@viet-kconnect.com}

echo "🔐 SSL 인증서 설정 시작 - 도메인: $DOMAIN"

# Let's Encrypt 인증서 생성 (실제 도메인용)
if [ "$DOMAIN" != "localhost" ]; then
    echo "📋 Let's Encrypt 인증서 생성 중..."
    docker run --rm -it \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/lib/letsencrypt:/var/lib/letsencrypt \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
else
    # 개발용 자체 서명 인증서 생성
    echo "🔧 개발용 자체 서명 인증서 생성 중..."
    mkdir -p ssl

    # 개인키 생성
    openssl genrsa -out ssl/server.key 2048

    # 인증서 서명 요청 생성
    openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=KR/ST=Seoul/L=Seoul/O=VietKConnect/CN=$DOMAIN"

    # 자체 서명 인증서 생성
    openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

    echo "✅ 자체 서명 인증서 생성 완료: ssl/server.crt, ssl/server.key"
fi

echo "🔒 SSL 설정 완료"