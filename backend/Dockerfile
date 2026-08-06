#
# backend/Dockerfile — obraz API RacePortal (Spring Boot / Java 21).
#
# Multi-stage:
#   1) build (maven:3.9-eclipse-temurin-21) — go-offline zależności, package JAR
#      z pominięciem testów (-DskipTests; testy lecą osobno przez scripts/test-api.sh).
#   2) runtime (eclipse-temurin:21-jre) — non-root user `spring`, jar na :4000.
#
# Compose ustawia profil `docker`, JDBC do serwisu mysql, SMTP→mailhog, SEED_ENABLED.
#
# Pomysł (alt): Spring Boot layered JAR / buildpacks (paketo) zamiast ręcznego Dockerfile;
# albo GraalVM native image pod mniejsze cold-start.
#
# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN addgroup --system spring && adduser --system --ingroup spring spring
COPY --from=build /build/target/raceportal-backend.jar ./app.jar
RUN chown -R spring:spring /app
USER spring

EXPOSE 4000

ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
