# ===== ETAPA 1: Construcción =====
FROM maven:3.9.15-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar dependencias primero (cache de Docker)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ===== ETAPA 2: Ejecución =====
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copiar JAR desde etapa de construcción
COPY --from=build /app/target/*.jar app.jar

# Puerto expuesto
EXPOSE 8080

# Variables de entorno por defecto
ENV SPRING_PROFILES_ACTIVE=prod

# Ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]