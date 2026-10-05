# Etapa de construcción (Build)
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copiamos el código del backend y la base de datos
COPY backend/ .mvn/ mvnw pom.xml ./
COPY database/ ./database/

# Ajustamos permisos y bajamos dependencias
RUN chmod +x ./backend/mvnw
WORKDIR /app/backend

# Construimos el proyecto (esto copiará ../database/migrations al target)
RUN ./mvnw clean package -DskipTests

# Etapa de ejecución (Run)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
