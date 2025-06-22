#!/bin/bash

# 시스템 업데이트
sudo yum update -y

# Docker 설치
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo yum install -y unzip
unzip awscliv2.zip
sudo ./aws/install

# 프로젝트 디렉토리 생성
mkdir -p ~/HanaZoom
cd ~/HanaZoom

# AWS 자격증명 설정 (이 부분은 수동으로 설정해야 함)
mkdir -p ~/.aws

# 환경 변수 파일 생성
cat << EOF > ~/HanaZoom/.env
# Docker Registry
ECR_REGISTRY=268556604739.dkr.ecr.ap-northeast-2.amazonaws.com

# Environment
ENV_SUFFIX=prod

# Image Tags
IMAGE_TAG=latest

# Database Settings
DB_USERNAME=hanazoom_user
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_secure_root_password

# Application Settings
SPRING_PROFILES_ACTIVE=prod
NODE_ENV=production
EOF

# 로그 디렉토리 생성
sudo mkdir -p /var/log/hanazoom
sudo chown -R ec2-user:ec2-user /var/log/hanazoom

# Docker 로그 로테이션 설정
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# Docker 재시작
sudo systemctl restart docker

echo "EC2 초기 설정이 완료되었습니다."
echo "다음 단계:"
echo "1. AWS 자격증명 설정: aws configure"
echo "2. ECR 로그인"
echo "3. docker-compose.yml 파일 다운로드"
echo "4. 환경 변수 파일 수정" 