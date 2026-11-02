# O contexto de build e a pasta backend/: docker build -t marketfaesa-backend backend
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN ./mvnw -B -q package -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre-alpine
COPY --from=build /app/target/*.jar /app.jar
USER nobody
EXPOSE 8080
# O padrao da JVM (25% da memoria do conteiner) e pouco nos planos pequenos
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app.jar"]
