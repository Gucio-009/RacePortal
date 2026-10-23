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

RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system spring \
    && adduser --system --ingroup spring spring
COPY --from=build /build/target/raceportal-backend.jar ./app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/uploads \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh \
    && chown -R spring:spring /app
USER root

EXPOSE 4000

ENV JAVA_OPTS=""
ENTRYPOINT ["/app/docker-entrypoint.sh"]
