#!/bin/bash

# 시스템 업데이트
sudo yum update -y

# Docker 설치
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 프로젝트 디렉토리 생성
mkdir -p /home/ec2-user/HanaZoom

# 환경 변수 파일 생성
touch /home/ec2-user/HanaZoom/.env

# Docker 자동 시작 설정
sudo systemctl enable docker

# 메모리 설정
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 로그 디렉토리 생성
sudo mkdir -p /var/log/hanazoom
sudo chown -R ec2-user:ec2-user /var/log/hanazoom 