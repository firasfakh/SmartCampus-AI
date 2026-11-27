"""Create the first SmartCampus administrator from environment variables.

Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in the shell, run once,
then remove both variables. This script never creates a default password.
"""
import asyncio
import os

from sqlalchemy import func, select

from app.core.security import hash_password
from app.database.connection import async_session_factory
from app.models.accounts import UserAccount


async def main() -> None:
    email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not email or len(password) < 12:
        raise SystemExit(
            "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD "
            "(minimum 12 characters) before running."
        )
    async with async_session_factory() as db:
        existing = await db.scalar(
            select(UserAccount.id).where(func.lower(UserAccount.email) == email)
        )
        if existing:
            raise SystemExit("An account with this email already exists.")
        db.add(UserAccount(
            email=email, password_hash=hash_password(password), role="admin"
        ))
        await db.commit()
    print("Administrator account created. Remove bootstrap environment variables.")


if __name__ == "__main__":
    asyncio.run(main())
