FROM gradle:7.6.1-jdk17 AS build

WORKDIR /app

# Gradle wrapper와 설정 파일 먼저 복사 (캐시 최적화)
COPY gradle gradle
COPY gradlew gradlew.bat build.gradle settings.gradle gradle.properties ./

# 의존성 다운로드 (병렬 처리 + 메모리 최적화)
RUN ./gradlew dependencies --no-daemon --build-cache --parallel \
    -Dorg.gradle.jvmargs="-Xmx1g -XX:MaxMetaspaceSize=512m" \
    -Dorg.gradle.parallel=true \
    -Dorg.gradle.caching=true

# 소스 코드 복사 (의존성 캐시 후)
COPY src src

# 빌드 실행 (병렬 + 캐시 활용)
RUN ./gradlew build -x test --no-daemon --build-cache --parallel \
    -Dorg.gradle.jvmargs="-Xmx1g -XX:MaxMetaspaceSize=512m" \
    -Dorg.gradle.parallel=true \
    -Dorg.gradle.caching=true \
    -Dorg.gradle.configureondemand=true

FROM openjdk:17-slim

WORKDIR /app

# JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"] 