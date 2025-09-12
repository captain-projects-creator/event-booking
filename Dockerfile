# ---- build stage ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# copy pom first to leverage Docker layer cache for dependencies
COPY pom.xml .
# copy sources
COPY src ./src

# build the jar (skip tests for faster builds)
RUN mvn -B -DskipTests clean package

# ---- runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# copy jar from builder (assumes single jar in target)
COPY --from=builder /build/target/*.jar app.jar

# expose the port your Spring app uses (you indicated 8083)
EXPOSE 8083

ENTRYPOINT ["java","-jar","/app/app.jar"]