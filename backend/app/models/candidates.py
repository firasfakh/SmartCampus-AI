"""SQLAlchemy models for SA-13 candidate profiles and education history."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Index,
    Numeric, SmallInteger, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class CandidateProfile(TimestampMixin, Base):
    """Personal profile belonging to exactly one candidate account."""

    __tablename__ = "candidate_profiles"

    user_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("user_accounts.id", name="fk_candidate_profiles_user", ondelete="RESTRICT"),
        primary_key=True,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Set on first admission and never cleared, even if the decision is later corrected.
    admission_closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped["UserAccount"] = relationship(
        "UserAccount", back_populates="candidate_profile"
    )
    academic_profile: Mapped["CandidateAcademicProfile | None"] = relationship(
        "CandidateAcademicProfile", back_populates="candidate", uselist=False,
        cascade="save-update, merge",
    )
    educations: Mapped[list["CandidateEducation"]] = relationship(
        "CandidateEducation", back_populates="candidate",
        cascade="save-update, merge", order_by="CandidateEducation.start_year",
    )
    pre_registrations: Mapped[list["PreRegistration"]] = relationship(
    "PreRegistration",
    back_populates="candidate",
)


class CandidateAcademicProfile(TimestampMixin, Base):
    """Candidate-declared academic summary; it does not store AI analysis."""

    __tablename__ = "candidate_academic_profiles"

    candidate_id: Mapped[PyUUID] = mapped_column(
        ForeignKey(
            "candidate_profiles.user_id",
            name="fk_candidate_academic_profiles_candidate",
            ondelete="RESTRICT",
        ),
        primary_key=True,
    )
    current_level: Mapped[str | None] = mapped_column(String(80), nullable=True)
    current_institution_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grade_average: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)
    grade_scale: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "grade_average IS NULL OR grade_average >= 0",
            name="ck_candidate_academic_profiles_grade_average_nonnegative",
        ),
        CheckConstraint(
            "grade_scale IS NULL OR grade_scale > 0",
            name="ck_candidate_academic_profiles_grade_scale_positive",
        ),
        CheckConstraint(
            "grade_average IS NULL OR grade_scale IS NULL OR grade_average <= grade_scale",
            name="ck_candidate_academic_profiles_grade_within_scale",
        ),
    )

    candidate: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="academic_profile"
    )


class CandidateEducation(UUIDMixin, Base):
    """One education record in a candidate's academic history."""

    __tablename__ = "candidate_educations"

    candidate_id: Mapped[PyUUID] = mapped_column(
        ForeignKey(
            "candidate_profiles.user_id",
            name="fk_candidate_educations_candidate",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    institution_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_institutions.id",
            name="fk_candidate_educations_institution",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[str] = mapped_column(String(255), nullable=False)
    field_of_study: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_year: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    completion_year: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    grade: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)
    grade_scale: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "start_year IS NULL OR start_year BETWEEN 1900 AND 2200",
            name="ck_candidate_educations_start_year_range",
        ),
        CheckConstraint(
            "completion_year IS NULL OR completion_year BETWEEN 1900 AND 2200",
            name="ck_candidate_educations_completion_year_range",
        ),
        CheckConstraint(
            "start_year IS NULL OR completion_year IS NULL OR completion_year >= start_year",
            name="ck_candidate_educations_year_order",
        ),
        CheckConstraint(
            "grade IS NULL OR grade >= 0",
            name="ck_candidate_educations_grade_nonnegative",
        ),
        CheckConstraint(
            "grade_scale IS NULL OR grade_scale > 0",
            name="ck_candidate_educations_grade_scale_positive",
        ),
        CheckConstraint(
            "grade IS NULL OR grade_scale IS NULL OR grade <= grade_scale",
            name="ck_candidate_educations_grade_within_scale",
        ),
        Index("ix_candidate_educations_candidate_id", "candidate_id"),
        Index("ix_candidate_educations_institution_id", "institution_id"),
    )

    candidate: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="educations"
    )
    institution: Mapped["AcademicInstitution | None"] = relationship("AcademicInstitution")


from app.models.accounts import UserAccount  # noqa: E402
from app.models.catalog import AcademicInstitution  # noqa: E402