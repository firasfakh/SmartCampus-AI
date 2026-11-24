"""Create the SA-12 academic catalog schema.

Revision ID: sa12_catalog_001
Revises:
Create Date: 2026-11-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "sa12_catalog_001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academic_institutions",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("institution_code", sa.String(length=30), nullable=False),
        sa.Column("institution_name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_academic_institutions"),
        sa.UniqueConstraint(
            "institution_code",
            name="uq_academic_institutions_institution_code",
        ),
    )
    op.create_table(
        "academic_programs",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("institution_id", sa.BigInteger(), nullable=False),
        sa.Column("program_code", sa.String(length=50), nullable=False),
        sa.Column("program_name", sa.String(length=255), nullable=False),
        sa.Column("program_type", sa.String(length=50), nullable=False),
        sa.Column("program_domain", sa.String(length=100), nullable=True),
        sa.Column("teaching_language", sa.String(length=50), nullable=True),
        sa.Column("program_duration", sa.String(length=100), nullable=True),
        sa.Column("total_credits", sa.Integer(), nullable=True),
        sa.Column("program_description", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "total_credits >= 0",
            name="ck_academic_programs_total_credits_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["institution_id"],
            ["academic_institutions.id"],
            name="fk_academic_programs_institution",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_academic_programs"),
        sa.UniqueConstraint(
            "program_code",
            name="uq_academic_programs_program_code",
        ),
    )
    op.create_table(
        "specializations",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("program_id", sa.BigInteger(), nullable=False),
        sa.Column("specialization_name", sa.String(length=255), nullable=False),
        sa.Column("specialization_description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["academic_programs.id"],
            name="fk_specializations_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_specializations"),
    )
    op.create_table(
        "curricula",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("program_id", sa.BigInteger(), nullable=False),
        sa.Column("curriculum_academic_year", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["academic_programs.id"],
            name="fk_curricula_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_curricula"),
        sa.UniqueConstraint(
            "program_id",
            "curriculum_academic_year",
            name="uq_curricula_program_academic_year",
            postgresql_nulls_not_distinct=True,
        ),
    )
    op.create_table(
        "semesters",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("curriculum_id", sa.BigInteger(), nullable=False),
        sa.Column("semester_number", sa.Integer(), nullable=False),
        sa.Column("semester_label", sa.String(length=100), nullable=True),
        sa.CheckConstraint(
            "semester_number >= 1",
            name="ck_semesters_semester_number_positive",
        ),
        sa.ForeignKeyConstraint(
            ["curriculum_id"],
            ["curricula.id"],
            name="fk_semesters_curriculum",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_semesters"),
        sa.UniqueConstraint(
            "curriculum_id",
            "semester_number",
            name="uq_semesters_curriculum_semester_number",
        ),
    )
    op.create_table(
        "modules",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("semester_id", sa.BigInteger(), nullable=False),
        sa.Column("module_name", sa.String(length=255), nullable=False),
        sa.Column("module_description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["semester_id"],
            ["semesters.id"],
            name="fk_modules_semester",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_modules"),
    )
    op.create_table(
        "subjects",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("module_id", sa.BigInteger(), nullable=False),
        sa.Column("subject_name", sa.String(length=255), nullable=False),
        sa.Column("subject_credits", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "subject_coefficient",
            sa.Numeric(precision=6, scale=3),
            nullable=True,
        ),
        sa.Column("lecture_hours", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("practical_hours", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("lab_hours", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.CheckConstraint(
            "subject_credits >= 0",
            name="ck_subjects_credits_nonnegative",
        ),
        sa.CheckConstraint(
            "subject_coefficient > 0",
            name="ck_subjects_coefficient_positive",
        ),
        sa.CheckConstraint(
            "lecture_hours >= 0",
            name="ck_subjects_lecture_hours_nonnegative",
        ),
        sa.CheckConstraint(
            "practical_hours >= 0",
            name="ck_subjects_practical_hours_nonnegative",
        ),
        sa.CheckConstraint(
            "lab_hours >= 0",
            name="ck_subjects_lab_hours_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["module_id"],
            ["modules.id"],
            name="fk_subjects_module",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_subjects"),
    )
    op.create_table(
        "admission_requirements",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("program_id", sa.BigInteger(), nullable=False),
        sa.Column("required_diploma", sa.Text(), nullable=True),
        sa.Column("admission_process", sa.Text(), nullable=True),
        sa.Column("required_documents", sa.Text(), nullable=True),
        sa.Column("additional_conditions", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "required_diploma IS NOT NULL OR admission_process IS NOT NULL "
            "OR required_documents IS NOT NULL OR additional_conditions IS NOT NULL",
            name="ck_admission_requirements_has_content",
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["academic_programs.id"],
            name="fk_admission_requirements_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_admission_requirements"),
    )
    op.create_table(
        "program_fees",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("program_id", sa.BigInteger(), nullable=False),
        sa.Column("fee_category", sa.String(length=100), nullable=False),
        sa.Column("fee_amount", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("fee_currency", sa.String(length=10), nullable=True),
        sa.Column("fee_period", sa.String(length=50), nullable=True),
        sa.Column("fee_academic_year", sa.String(length=20), nullable=True),
        sa.Column("fee_status", sa.String(length=30), nullable=True),
        sa.Column("fee_notes", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "fee_amount >= 0",
            name="ck_program_fees_amount_nonnegative",
        ),
        sa.CheckConstraint(
            "fee_amount IS NULL OR "
            "(fee_currency IS NOT NULL AND fee_currency ~ '^[A-Z]{3}$')",
            name="ck_program_fees_currency_required_for_amount",
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["academic_programs.id"],
            name="fk_program_fees_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_program_fees"),
    )
    op.create_table(
        "career_opportunities",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("career_job_title", sa.String(length=255), nullable=False),
        sa.Column("career_industry", sa.String(length=255), nullable=True),
        sa.Column("career_description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_career_opportunities"),
    )
    op.create_table(
        "program_careers",
        sa.Column("program_id", sa.BigInteger(), nullable=False),
        sa.Column("career_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["career_id"],
            ["career_opportunities.id"],
            name="fk_program_careers_career",
            ondelete="CASCADE",
            onupdate="NO ACTION",
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["academic_programs.id"],
            name="fk_program_careers_program",
            ondelete="CASCADE",
            onupdate="NO ACTION",
        ),
        sa.PrimaryKeyConstraint("program_id", "career_id", name="pk_program_careers"),
    )

    op.create_index(
        "ix_academic_programs_institution_id",
        "academic_programs",
        ["institution_id"],
    )
    op.create_index(
        "ix_specializations_program_id",
        "specializations",
        ["program_id"],
    )
    op.create_index("ix_modules_semester_id", "modules", ["semester_id"])
    op.create_index("ix_subjects_module_id", "subjects", ["module_id"])
    op.create_index(
        "ix_admission_requirements_program_id",
        "admission_requirements",
        ["program_id"],
    )
    op.create_index("ix_program_fees_program_id", "program_fees", ["program_id"])
    op.create_index(
        "ix_program_careers_career_id",
        "program_careers",
        ["career_id"],
    )


def downgrade() -> None:
    op.drop_table("program_careers")
    op.drop_table("career_opportunities")
    op.drop_table("program_fees")
    op.drop_table("admission_requirements")
    op.drop_table("subjects")
    op.drop_table("modules")
    op.drop_table("semesters")
    op.drop_table("curricula")
    op.drop_table("specializations")
    op.drop_table("academic_programs")
    op.drop_table("academic_institutions")
