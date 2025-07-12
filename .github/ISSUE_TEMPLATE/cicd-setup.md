---
name: "CI/CD 파이프라인 구축"
about: "GitHub Actions와 AWS를 활용한 CI/CD 파이프라인 구축"
title: "[Infra] GitHub Actions와 AWS ECR/EC2를 활용한 CI/CD 파이프라인 구축"
labels: ["infra", "enhancement"]
---

## 목적

HanaZoom 프로젝트의 지속적 통합/배포(CI/CD) 파이프라인을 구축하여 개발 및 배포 프로세스를 자동화하고 효율화합니다.

## 구현 내용

### 1. GitHub Actions 워크플로우 설정

- [x] GitHub Actions 워크플로우 파일 생성 (`.github/workflows/deploy.yml`)
- [ ] 브랜치별 빌드/배포 전략 구현
  - `main` 브랜치: 프로덕션 환경 배포
  - `infra/*`, `feature/*`, `develop` 브랜치: 개발 환경 배포
- [ ] Docker 이미지 빌드 및 ECR 푸시 자동화
- [ ] 환경별(prod/dev) 태그 전략 구현

### 2. AWS 인프라 설정

- [ ] ECR 레포지토리 생성
  - [ ] `hanazoom-backend` 레포지토리
  - [ ] `hanazoom-frontend` 레포지토리
- [ ] EC2 인스턴스 설정
  - [ ] 프로덕션 환경 EC2 설정
  - [ ] 개발 환경 EC2 설정
- [ ] IAM 사용자 및 권한 설정
  - [ ] ECR 접근 권한
  - [ ] EC2 접근 권한

### 3. 보안 설정

- [ ] GitHub Secrets 설정
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `PROD_EC2_HOST`
  - [ ] `DEV_EC2_HOST`
  - [ ] `EC2_USERNAME`
  - [ ] `EC2_SSH_KEY`

### 4. 배포 환경 구성

- [x] Docker Compose 설정 파일 수정
- [ ] 환경 변수 설정
  - [ ] 프로덕션 환경 변수
  - [ ] 개발 환경 변수
- [ ] 로깅 및 모니터링 설정

## 기대 효과

1. 자동화된 빌드/배포 프로세스로 개발 생산성 향상
2. 환경별 독립적인 배포로 안정적인 서비스 운영
3. Docker 기반 일관된 실행 환경 제공
4. 롤백 및 버전 관리 용이성 확보

## 작업 브랜치

- 브랜치명: `infra/cicd-setup`

## 테스트 계획

1. 각 브랜치별 워크플로우 동작 확인
2. 환경별(prod/dev) 배포 검증
3. 롤백 시나리오 테스트
4. 보안 설정 검증

## 주의사항

- 프로덕션 배포는 `main` 브랜치에서만 수행
- 민감한 정보는 반드시 GitHub Secrets를 통해 관리
- EC2 인스턴스의 보안 그룹 설정 확인 필요

## 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [AWS ECR 사용 가이드](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
