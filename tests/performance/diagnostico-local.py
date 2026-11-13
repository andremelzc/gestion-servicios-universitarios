#!/usr/bin/env python3
"""Diagnóstico aislado y acotado; requiere Docker context default e imágenes locales."""

import datetime
import os
import secrets
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
run_id = (
    "gisu-diag-"
    + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S")
    + "-"
    + secrets.token_hex(3)
)
out = ROOT / "tests/performance/resultados" / run_id
out.mkdir(mode=0o777)
out.chmod(0o777)  # k6 runs as an unprivileged container user
net, db, backend, load = (
    run_id + suffix for suffix in ("-net", "-db", "-backend", "-k6")
)
env = os.environ.copy()
env.update(
    MYSQL_ROOT_PASSWORD=secrets.token_urlsafe(24),
    MYSQL_PASSWORD=secrets.token_urlsafe(24),
    DB_PASSWORD="",
    JWT_SECRET=secrets.token_urlsafe(48),
    DEMO_USER_PASSWORD=secrets.token_urlsafe(24),
)
env["DB_PASSWORD"] = env["MYSQL_PASSWORD"]
env["MYSQL_PWD"] = env["MYSQL_ROOT_PASSWORD"]
D = ["docker", "--context", "default"]
created = []


def run(args, timeout=30, check=True):
    return subprocess.run(
        D + args,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=check,
    )


def save(name, text):
    (out / name).write_text(text)


def mysql(query):
    return run(
        ["exec", "-e", "MYSQL_PWD", db, "mysql", "-uroot", "-N", "-e", query],
        check=False,
    ).stdout


try:
    script = (ROOT / "tests/performance/carga.js").read_text()
    script = (
        script.replace(
            "{ duration: '1m', target: 50 }", "{ duration: '15s', target: 50 }"
        )
        .replace("{ duration: '10m', target: 50 }", "{ duration: '60s', target: 50 }")
        .replace("{ duration: '30s', target: 0 }", "{ duration: '10s', target: 0 }", 1)
    )
    # The built-in --summary-export includes setup_data, which contains bearer tokens.
    script += "\nexport function handleSummary(data) { delete data.setup_data; return { '/resultados/summary.json': JSON.stringify(data, null, 2) }; }\n"
    save("carga-diagnostico.js", script)
    save(
        "metadatos.txt",
        f"run={run_id}\nUTC={datetime.datetime.now(datetime.timezone.utc).isoformat()}\nperfil=nominal modificado: 15s rampa 50 VU, 60s sostenido, 10s bajada; backend directo sin nginx\nimagenes=gisu-perf-175-backend:local mysql:8.0.36 grafana/k6:0.54.0\n",
    )
    run(["network", "create", net])
    created.append(("network", net))
    run(
        [
            "run",
            "-d",
            "--name",
            db,
            "--network",
            net,
            "--network-alias",
            "db",
            "-e",
            "MYSQL_ROOT_PASSWORD",
            "-e",
            "MYSQL_PASSWORD",
            "-e",
            "MYSQL_DATABASE=gestion_servicios_db",
            "-e",
            "MYSQL_USER=app_servicios",
            "mysql:8.0.36",
            "--log-bin-trust-function-creators=1",
        ]
    )
    created.append(("container", db))
    for _ in range(90):
        if (
            run(
                [
                    "exec",
                    "-e",
                    "MYSQL_PWD",
                    db,
                    "mysqladmin",
                    "ping",
                    "-h",
                    "127.0.0.1",
                    "-uroot",
                    "--silent",
                ],
                check=False,
            ).returncode
            == 0
        ):
            break
        time.sleep(2)
    else:
        raise RuntimeError("MySQL no disponible en 180 s")
    run(
        [
            "run",
            "-d",
            "--name",
            backend,
            "--network",
            net,
            "--network-alias",
            "backend",
            "-e",
            "SPRING_PROFILES_ACTIVE=demo",
            "-e",
            "DB_HOST=db",
            "-e",
            "DB_NAME=gestion_servicios_db",
            "-e",
            "DB_USER=app_servicios",
            "-e",
            "DB_PASSWORD",
            "-e",
            "JWT_SECRET",
            "-e",
            "DEMO_USER_PASSWORD",
            "-e",
            "DEMO_MODO=carga",
            "-e",
            "STORAGE_PATH=/tmp/evidencias",
            "gisu-perf-175-backend:local",
        ]
    )
    created.append(("container", backend))
    for _ in range(120):
        if (
            run(
                [
                    "exec",
                    backend,
                    "curl",
                    "-fsS",
                    "--max-time",
                    "2",
                    "http://localhost:8081/actuator/health",
                ],
                check=False,
            ).returncode
            == 0
        ):
            count = mysql(
                "SELECT COUNT(*) FROM gestion_servicios_db.solicitudes WHERE codigo LIKE 'CARGA-%';"
            ).strip()
            if count == "2000":
                break
        time.sleep(2)
    else:
        raise RuntimeError(
            "Backend o dataset no disponibles en 240 s; conteo="
            + str(locals().get("count", "desconocido"))
        )
    save(
        "dataset.txt",
        "SELECT COUNT(*) FROM solicitudes WHERE codigo LIKE CARGA-%: " + count + "\n",
    )
    print(
        "Dataset verificado: 2000. Ejecutando k6 durante 85 s más setup y recolección.",
        flush=True,
    )
    run(
        [
            "run",
            "-d",
            "--name",
            load,
            "--network",
            net,
            "-e",
            "DEMO_USER_PASSWORD",
            "-e",
            "BASE_URL=http://backend:8080",
            "-e",
            "PAUSA_LOGIN_S=0.1",
            "-v",
            str(out) + ":/resultados",
            "grafana/k6:0.54.0",
            "run",
            "/resultados/carga-diagnostico.js",
        ]
    )
    created.append(("container", load))
    samples = []
    for _ in range(30):
        state = run(["inspect", "-f", "{{.State.Running}}", load]).stdout.strip()
        stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        metrics = run(
            [
                "exec",
                backend,
                "curl",
                "-fsS",
                "--max-time",
                "3",
                "http://localhost:8081/actuator/prometheus",
            ],
            check=False,
        )
        filtered = "\n".join(
            x
            for x in metrics.stdout.splitlines()
            if x.startswith(
                (
                    "hikaricp_connections_",
                    "jvm_threads_",
                    "process_cpu_usage",
                    "system_cpu_usage",
                    "http_server_requests_seconds_count",
                    "http_server_requests_seconds_sum",
                )
            )
        )
        locks = mysql("SELECT COUNT(*) FROM performance_schema.data_lock_waits;")
        stats = run(
            [
                "stats",
                "--no-stream",
                "--format",
                "{{.Name}} CPU={{.CPUPerc}} MEM={{.MemUsage}}",
                db,
                backend,
                load,
            ],
            check=False,
        ).stdout
        samples.append(
            f"\n=== {stamp} ===\n{stats}lock_waits={locks.strip()}\n{filtered}\n"
        )
        save("muestras.txt", "".join(samples))
        if state != "true":
            break
        time.sleep(5)
    else:
        raise RuntimeError("k6 excedió 150 s")
    result = run(["inspect", "-f", "{{.State.ExitCode}}", load]).stdout.strip()
    save(
        "k6.log",
        run(["logs", load], check=False).stdout
        + run(["logs", load], check=False).stderr,
    )
    save("resultado.txt", "k6 exit=" + result + "\n")
    print(
        "k6 exit=" + result + "; evidencia: " + str(out.relative_to(ROOT)), flush=True
    )
except Exception as exc:
    save("error.txt", type(exc).__name__ + ": " + str(exc) + "\n")
    print("Diagnóstico incompleto:", type(exc).__name__, str(exc), flush=True)
finally:
    # Only names created successfully by this invocation; no volumes or global prune.
    for kind, name in reversed(created):
        args = (
            ["rm", "-f", "-v", name] if kind == "container" else ["network", "rm", name]
        )
        res = run(args, timeout=30, check=False)
        print(
            "cleanup",
            name,
            "ok" if res.returncode == 0 else "ERROR " + res.stderr.strip(),
            flush=True,
        )
    print("Evidencia:", out.relative_to(ROOT), flush=True)
