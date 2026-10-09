# ==========================================
# Etapa 1: Compilacion y Extraccion de Capas (Build)
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copiamos codigo del backend y la base de datos (migraciones Flyway requeridas por el build de maven)
COPY backend/ ./backend/
COPY database/ ./database/

WORKDIR /app/backend
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Extraccion de capas usando jarmode=tools (Spring Boot 4.x / 3.3+)
RUN java -Djarmode=tools -jar target/*.jar extract --layers --destination extracted

# ==========================================
# Etapa 2: Entorno de Ejecucion Endurecido (Runtime)
# ==========================================
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

# Instalar curl para healthcheck y dependencias minimas de sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Crear usuario y grupo de sistema sin privilegios (spring:spring UID/GID 10001)
RUN groupadd -g 10001 spring && \
    useradd -u 10001 -g spring -s /bin/sh -d /app spring

# Crear directorio de evidencias segun RN-15 y ajustar permisos
RUN mkdir -p /var/app/evidencias && \
    chown -R spring:spring /app /var/app/evidencias

# Copiar capas extraidas desde la etapa build manteniendo orden para optimizar cache Docker
COPY --from=build --chown=spring:spring /app/backend/extracted/dependencies/ ./
COPY --from=build --chown=spring:spring /app/backend/extracted/spring-boot-loader/ ./
COPY --from=build --chown=spring:spring /app/backend/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=spring:spring /app/backend/extracted/application/ ./

# Cambiar a usuario no root
USER spring:spring

# Variables de entorno base
ENV TZ=UTC \
    SPRING_PROFILES_ACTIVE=prod \
    STORAGE_PATH=/var/app/evidencias

VOLUME ["/var/app/evidencias"]

EXPOSE 8080

# Healthcheck consultando Actuator Health
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# EntryPoint con JarLauncher oficial (Spring Boot 3.2+ y 4.x)
ENTRYPOINT ["java", "-Duser.timezone=UTC", "org.springframework.boot.loader.launch.JarLauncher"]
