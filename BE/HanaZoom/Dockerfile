FROM gradle:7.6.1-jdk17 AS build

WORKDIR /app

# 의존성 캐시를 위해 build.gradle과 settings.gradle만 먼저 복사
COPY build.gradle settings.gradle ./
COPY gradle gradle

# 의존성 다운로드 (메모리 제한 설정)
RUN gradle dependencies --no-daemon --build-cache \
    -Dorg.gradle.jvmargs="-Xmx512m -XX:MaxMetaspaceSize=256m"

# 나머지 소스 복사
COPY . .
RUN gradle build -x test --no-daemon --build-cache \
    -Dorg.gradle.jvmargs="-Xmx512m -XX:MaxMetaspaceSize=256m"

FROM openjdk:17-slim

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"] 