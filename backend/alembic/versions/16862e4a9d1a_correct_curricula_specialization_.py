
"""correct_curricula_specialization_relation

Revision ID: 16862e4a9d1a
Revises: sa12_catalog_001
Create Date: 2026-11-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "16862e4a9d1a"
down_revision: Union[str, None] = "sa12_catalog_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Vérifier que la table ne contient aucune donnée avant conversion.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM curricula LIMIT 1) THEN
                RAISE EXCEPTION
                    'Migration interrompue : curricula contient des données. '
                    'Une migration de données explicite est nécessaire.';
            END IF;
        END $$;
    """)

    op.drop_constraint(
        "uq_curricula_program_academic_year",
        "curricula",
        type_="unique",
    )

    op.drop_constraint(
        "fk_curricula_program",
        "curricula",
        type_="foreignkey",
    )

    op.drop_column("curricula", "program_id")

    op.add_column(
        "curricula",
        sa.Column("specialization_id", sa.BigInteger(), nullable=True),
    )

    op.create_foreign_key(
        "fk_curricula_specialization",
        "curricula",
        "specializations",
        ["specialization_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="NO ACTION",
    )

    op.alter_column(
        "curricula",
        "specialization_id",
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_curricula_specialization_academic_year",
        "curricula",
        ["specialization_id", "curriculum_academic_year"],
        postgresql_nulls_not_distinct=True,
    )


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM curricula LIMIT 1) THEN
                RAISE EXCEPTION
                    'Downgrade interrompu : curricula contient des données.';
            END IF;
        END $$;
    """)

    op.drop_constraint(
        "uq_curricula_specialization_academic_year",
        "curricula",
        type_="unique",
    )

    op.drop_constraint(
        "fk_curricula_specialization",
        "curricula",
        type_="foreignkey",
    )

    op.drop_column("curricula", "specialization_id")

    op.add_column(
        "curricula",
        sa.Column("program_id", sa.BigInteger(), nullable=True),
    )

    op.create_foreign_key(
        "fk_curricula_program",
        "curricula",
        "academic_programs",
        ["program_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="NO ACTION",
    )

    op.alter_column(
        "curricula",
        "program_id",
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_curricula_program_academic_year",
        "curricula",
        ["program_id", "curriculum_academic_year"],
        postgresql_nulls_not_distinct=True,
    )
