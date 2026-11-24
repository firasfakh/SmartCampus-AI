"""SQLAlchemy models for the SA-12 academic catalog."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import Identity, PrimaryKeyConstraint

from app.database.base import Base


class IdentityPrimaryKeyMixin:
    """Adds the numeric PostgreSQL identity primary key used by the catalog."""

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=False),
        primary_key=True,
    )


program_careers = Table(
    "program_careers",
    Base.metadata,
    Column(
        "program_id",
        BigInteger,
        ForeignKey(
            "academic_programs.id",
            name="fk_program_careers_program",
            ondelete="CASCADE",
            onupdate="NO ACTION",
        ),
        nullable=False,
    ),
    Column(
        "career_id",
        BigInteger,
        ForeignKey(
            "career_opportunities.id",
            name="fk_program_careers_career",
            ondelete="CASCADE",
            onupdate="NO ACTION",
        ),
        nullable=False,
    ),
    PrimaryKeyConstraint(
        "program_id",
        "career_id",
        name="pk_program_careers",
    ),
    Index("ix_program_careers_career_id", "career_id"),
)


class AcademicInstitution(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "academic_institutions"

    institution_code: Mapped[str] = mapped_column(String(30), nullable=False)
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_academic_institutions"),
        UniqueConstraint(
            "institution_code",
            name="uq_academic_institutions_institution_code",
        ),
    )

    programs: Mapped[list[AcademicProgram]] = relationship(
        back_populates="institution",
        passive_deletes="all",
    )


class AcademicProgram(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "academic_programs"

    institution_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_institutions.id",
            name="fk_academic_programs_institution",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    program_code: Mapped[str] = mapped_column(String(50), nullable=False)
    program_name: Mapped[str] = mapped_column(String(255), nullable=False)
    program_type: Mapped[str] = mapped_column(String(50), nullable=False)
    program_domain: Mapped[str | None] = mapped_column(String(100), nullable=True)
    teaching_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    program_duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_credits: Mapped[int | None] = mapped_column(Integer, nullable=True)
    program_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_academic_programs"),
        UniqueConstraint(
            "program_code",
            name="uq_academic_programs_program_code",
        ),
        CheckConstraint(
            "total_credits >= 0",
            name="ck_academic_programs_total_credits_nonnegative",
        ),
        Index("ix_academic_programs_institution_id", "institution_id"),
    )

    institution: Mapped[AcademicInstitution] = relationship(
        back_populates="programs",
    )
    specializations: Mapped[list[Specialization]] = relationship(
        back_populates="program",
        passive_deletes="all",
    )
    admission_requirements: Mapped[list[AdmissionRequirement]] = relationship(
        back_populates="program",
        passive_deletes="all",
    )
    fees: Mapped[list[ProgramFee]] = relationship(
        back_populates="program",
        passive_deletes="all",
    )
    careers: Mapped[list[CareerOpportunity]] = relationship(
        secondary=program_careers,
        back_populates="programs",
        passive_deletes=True,
    )


class Specialization(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "specializations"

    program_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_programs.id",
            name="fk_specializations_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    specialization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_specializations"),
        Index("ix_specializations_program_id", "program_id"),
    )

    program: Mapped[AcademicProgram] = relationship(
        back_populates="specializations",
    )
    curricula: Mapped[list[Curriculum]] = relationship(
        back_populates="specialization",
        passive_deletes="all",
    )


class Curriculum(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "curricula"

    specialization_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "specializations.id",
            name="fk_curricula_specialization",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    curriculum_academic_year: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_curricula"),
        UniqueConstraint(
            "specialization_id",
            "curriculum_academic_year",
            name="uq_curricula_specialization_academic_year",
            postgresql_nulls_not_distinct=True,
        ),
    )

    specialization: Mapped[Specialization] = relationship(
        back_populates="curricula",
    )
    semesters: Mapped[list[Semester]] = relationship(
        back_populates="curriculum",
        passive_deletes="all",
    )


class Semester(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "semesters"

    curriculum_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "curricula.id",
            name="fk_semesters_curriculum",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False)
    semester_label: Mapped[str | None] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_semesters"),
        UniqueConstraint(
            "curriculum_id",
            "semester_number",
            name="uq_semesters_curriculum_semester_number",
        ),
        CheckConstraint(
            "semester_number >= 1",
            name="ck_semesters_semester_number_positive",
        ),
    )

    curriculum: Mapped[Curriculum] = relationship(back_populates="semesters")
    modules: Mapped[list[Module]] = relationship(
        back_populates="semester",
        passive_deletes="all",
    )


class Module(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "modules"

    semester_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "semesters.id",
            name="fk_modules_semester",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    module_name: Mapped[str] = mapped_column(String(255), nullable=False)
    module_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_modules"),
        Index("ix_modules_semester_id", "semester_id"),
    )

    semester: Mapped[Semester] = relationship(back_populates="modules")
    subjects: Mapped[list[Subject]] = relationship(
        back_populates="module",
        passive_deletes="all",
    )


class Subject(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "subjects"

    module_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "modules.id",
            name="fk_subjects_module",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    subject_name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject_credits: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    subject_coefficient: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 3),
        nullable=True,
    )
    lecture_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )
    practical_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )
    lab_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_subjects"),
        CheckConstraint(
            "subject_credits >= 0",
            name="ck_subjects_credits_nonnegative",
        ),
        CheckConstraint(
            "subject_coefficient > 0",
            name="ck_subjects_coefficient_positive",
        ),
        CheckConstraint(
            "lecture_hours >= 0",
            name="ck_subjects_lecture_hours_nonnegative",
        ),
        CheckConstraint(
            "practical_hours >= 0",
            name="ck_subjects_practical_hours_nonnegative",
        ),
        CheckConstraint(
            "lab_hours >= 0",
            name="ck_subjects_lab_hours_nonnegative",
        ),
        Index("ix_subjects_module_id", "module_id"),
    )

    module: Mapped[Module] = relationship(back_populates="subjects")


class AdmissionRequirement(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "admission_requirements"

    program_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_programs.id",
            name="fk_admission_requirements_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    required_diploma: Mapped[str | None] = mapped_column(Text, nullable=True)
    admission_process: Mapped[str | None] = mapped_column(Text, nullable=True)
    required_documents: Mapped[str | None] = mapped_column(Text, nullable=True)
    additional_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_admission_requirements"),
        CheckConstraint(
            "required_diploma IS NOT NULL "
            "OR admission_process IS NOT NULL "
            "OR required_documents IS NOT NULL "
            "OR additional_conditions IS NOT NULL",
            name="ck_admission_requirements_has_content",
        ),
        Index("ix_admission_requirements_program_id", "program_id"),
    )

    program: Mapped[AcademicProgram] = relationship(
        back_populates="admission_requirements",
    )


class ProgramFee(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "program_fees"

    program_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_programs.id",
            name="fk_program_fees_program",
            ondelete="RESTRICT",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    fee_category: Mapped[str] = mapped_column(String(100), nullable=False)
    fee_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )
    fee_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    fee_period: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fee_academic_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fee_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fee_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_program_fees"),
        CheckConstraint(
            "fee_amount >= 0",
            name="ck_program_fees_amount_nonnegative",
        ),
        CheckConstraint(
            "fee_amount IS NULL OR "
            "(fee_currency IS NOT NULL AND fee_currency ~ '^[A-Z]{3}$')",
            name="ck_program_fees_currency_required_for_amount",
        ),
        Index("ix_program_fees_program_id", "program_id"),
    )

    program: Mapped[AcademicProgram] = relationship(back_populates="fees")


class CareerOpportunity(Base, IdentityPrimaryKeyMixin):
    __tablename__ = "career_opportunities"

    career_job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    career_industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    career_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("id", name="pk_career_opportunities"),
    )

    programs: Mapped[list[AcademicProgram]] = relationship(
        secondary=program_careers,
        back_populates="careers",
        passive_deletes=True,
    )
