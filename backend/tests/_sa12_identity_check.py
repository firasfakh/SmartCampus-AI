
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text, create_engine

from app.core.config import settings
from app.models.catalog import AcademicInstitution


def main() -> int:
    if AcademicInstitution.__tablename__ != "academic_institutions":
        print("FAIL: import du modèle inattendu.")
        return 2

    engine = create_engine(
        settings.DATABASE_URL_SYNC,
        pool_pre_ping=True,
    )

    try:
        with engine.connect() as connection:
            identity = connection.execute(
                text(
                    """
                    SELECT current_database(),
                           current_user,
                           host(inet_server_addr()),
                           masklen(inet_server_addr()),
                           inet_server_port()
                    """
                )
            ).one()

            database, role, host, mask_length, port = identity

            valid = (
                database == settings.POSTGRES_DB
                and role == settings.POSTGRES_USER
                and host == settings.POSTGRES_HOST
                and mask_length == 32
                and port == settings.POSTGRES_PORT
            )

            print(
                f"Base={database}, rôle={role}, "
                f"hôte={host}, préfixe=/{mask_length}, port={port}"
            )

            if not valid:
                print("FAIL: cible PostgreSQL inattendue.")
                return 1

            print("PASS: identité PostgreSQL confirmée.")
            print("Aucune écriture ou migration exécutée.")
            return 0

    except Exception as error:
        print(
            f"FAIL: contrôle de connexion; "
            f"type={type(error).__name__}."
        )
        return 2

    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
