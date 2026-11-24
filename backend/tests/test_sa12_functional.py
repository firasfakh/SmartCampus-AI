from __future__ import annotations

import sys
import warnings
from decimal import Decimal
from getpass import GetPassWarning, getpass
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.engine import Connection, URL, create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.base import Base
from app.core.config import settings
from app.models import (
    AcademicInstitution,
    AcademicProgram,
    AdmissionRequirement,
    CareerOpportunity,
    Curriculum,
    Module,
    ProgramFee,
    Semester,
    Specialization,
    Subject,
    program_careers,
)


EXPECTED_TABLES = {
    "academic_institutions",
    "academic_programs",
    "specializations",
    "curricula",
    "semesters",
    "modules",
    "subjects",
    "admission_requirements",
    "program_fees",
    "career_opportunities",
    "program_careers",
}


def _read_password() -> str:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", GetPassWarning)
            password = getpass(
                "Mot de passe PostgreSQL pour smartcampus_test_user "
                "(saisie masquée) : "
            )
    except GetPassWarning:
        pytest.fail(
            "La saisie masquée est indisponible; aucun mot de passe n'a été lu."
        )
    if not password:
        pytest.fail("Aucun mot de passe saisi; aucune connexion n'a été effectuée.")
    return password


@pytest.fixture
def test_connection():
    if (
        settings.POSTGRES_HOST != "127.0.0.1"
        or settings.POSTGRES_PORT != 5433
        or settings.POSTGRES_USER != "smartcampus_test_user"
        or settings.POSTGRES_DB != "smartcampus_test"
    ):
        pytest.fail(
            "La configuration applicative chargée avant le test ne cible pas "
            "smartcampus_test; arrêt avant toute connexion."
        )

    engine = create_engine(
        URL.create(
            "postgresql+psycopg2",
            username="smartcampus_test_user",
            password=_read_password(),
            host="127.0.0.1",
            port=5433,
            database="smartcampus_test",
        ),
        pool_pre_ping=True,
    )
    connection: Connection | None = None
    transaction = None
    try:
        connection = engine.connect()
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
        if (
            database != "smartcampus_test"
            or role != "smartcampus_test_user"
            or host != "127.0.0.1"
            or mask_length != 32
            or port != 5433
        ):
            pytest.fail(
                "Cible PostgreSQL inattendue; arrêt avant toute écriture. "
                f"base={database}, rôle={role}, hôte={host}, "
                f"préfixe=/{mask_length}, port={port}"
            )

        revision = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one_or_none()
        if revision != "sa12_catalog_001":
            pytest.fail(
                "Révision Alembic inattendue; arrêt avant toute écriture. "
                f"révision={revision!r}"
            )

        connection.commit()
        transaction = connection.begin()
        yield connection
    finally:
        if connection is not None:
            if transaction is not None and transaction.is_active:
                transaction.rollback()
            elif connection.in_transaction():
                connection.rollback()
            connection.close()
        engine.dispose()


def _insert_id(
    connection: Connection,
    statement: str,
    parameters: dict[str, object],
) -> int:
    return int(connection.execute(text(statement), parameters).scalar_one())


def _insert_program(
    connection: Connection,
    institution_id: int,
    suffix: str,
    label: str,
) -> int:
    return _insert_id(
        connection,
        """
        INSERT INTO academic_programs (
            institution_id, program_code, program_name, program_type
        ) VALUES (
            :institution_id, :program_code, :program_name, :program_type
        )
        RETURNING id
        """,
        {
            "institution_id": institution_id,
            "program_code": f"TEST-{label}-{suffix}",
            "program_name": f"Test program {label} {suffix}",
            "program_type": "engineering",
        },
    )


def _missing_id(connection: Connection, table: str) -> int:
    allowed_tables = EXPECTED_TABLES - {"program_careers"}
    if table not in allowed_tables:
        raise ValueError(f"Unexpected identity table: {table}")

    for _ in range(10):
        candidate = (1 << 62) + (uuid4().int % (1 << 62))
        exists = connection.execute(
            text(f"SELECT EXISTS (SELECT 1 FROM {table} WHERE id = :id)"),
            {"id": candidate},
        ).scalar_one()
        if not exists:
            return candidate
    raise RuntimeError(f"Could not find an unused identity for {table}")


def _assert_integrity_error(
    connection: Connection,
    statement: str,
    parameters: dict[str, object],
    sqlstate: str,
    diagnostic_name: str,
    expected_diagnostic: str,
) -> None:
    with pytest.raises(IntegrityError) as error:
        with connection.begin_nested():
            connection.execute(text(statement), parameters)

    original = error.value.orig
    assert getattr(original, "pgcode", None) == sqlstate
    diagnostic = getattr(original, "diag", None)
    assert getattr(diagnostic, diagnostic_name, None) == expected_diagnostic


def test_sa12_catalog_functional_constraints(test_connection: Connection) -> None:
    connection = test_connection
    tables = Base.metadata.tables
    assert set(tables) == EXPECTED_TABLES
    assert sum(len(table.columns) for table in tables.values()) == 57
    assert program_careers.name == "program_careers"

    suffix = uuid4().hex[:12]
    institution_code = f"TEST-{suffix}"
    program_code = f"TEST-PROGRAM-{suffix}"
    institution_id = _insert_id(
        connection,
        """
        INSERT INTO academic_institutions (institution_code, institution_name)
        VALUES (:code, :name)
        RETURNING id
        """,
        {"code": institution_code, "name": f"Test institution {suffix}"},
    )
    program_id = _insert_id(
        connection,
        """
        INSERT INTO academic_programs (
            institution_id, program_code, program_name, program_type,
            program_domain, teaching_language, program_duration,
            total_credits, program_description
        ) VALUES (
            :institution_id, :program_code, :program_name, :program_type,
            :program_domain, :teaching_language, :program_duration,
            :total_credits, :program_description
        )
        RETURNING id
        """,
        {
            "institution_id": institution_id,
            "program_code": program_code,
            "program_name": f"Test program {suffix}",
            "program_type": "engineering",
            "program_domain": "computing",
            "teaching_language": "French",
            "program_duration": "3 years",
            "total_credits": 180,
            "program_description": "Functional integration test",
        },
    )
    specialization_id = _insert_id(
        connection,
        """
        INSERT INTO specializations (program_id, specialization_name)
        VALUES (:program_id, :name)
        RETURNING id
        """,
        {"program_id": program_id, "name": f"Specialization {suffix}"},
    )
    curriculum_id = _insert_id(
        connection,
        """
        INSERT INTO curricula (program_id, curriculum_academic_year)
        VALUES (:program_id, NULL)
        RETURNING id
        """,
        {"program_id": program_id},
    )
    semester_id = _insert_id(
        connection,
        """
        INSERT INTO semesters (curriculum_id, semester_number, semester_label)
        VALUES (:curriculum_id, 1, :label)
        RETURNING id
        """,
        {"curriculum_id": curriculum_id, "label": "Semester 1"},
    )
    module_id = _insert_id(
        connection,
        """
        INSERT INTO modules (semester_id, module_name)
        VALUES (:semester_id, :name)
        RETURNING id
        """,
        {"semester_id": semester_id, "name": f"Module {suffix}"},
    )
    subject_id = _insert_id(
        connection,
        """
        INSERT INTO subjects (
            module_id, subject_name, subject_credits, subject_coefficient,
            lecture_hours, practical_hours, lab_hours
        ) VALUES (
            :module_id, :name, :credits, :coefficient,
            :lecture_hours, :practical_hours, :lab_hours
        )
        RETURNING id
        """,
        {
            "module_id": module_id,
            "name": f"Subject {suffix}",
            "credits": Decimal("4.00"),
            "coefficient": Decimal("1.250"),
            "lecture_hours": Decimal("20.00"),
            "practical_hours": Decimal("10.00"),
            "lab_hours": Decimal("5.00"),
        },
    )
    admission_requirement_id = _insert_id(
        connection,
        """
        INSERT INTO admission_requirements (program_id, required_diploma)
        VALUES (:program_id, :diploma)
        RETURNING id
        """,
        {"program_id": program_id, "diploma": "Baccalaureate"},
    )
    program_fee_id = _insert_id(
        connection,
        """
        INSERT INTO program_fees (
            program_id, fee_category, fee_amount, fee_currency
        ) VALUES (:program_id, :category, :amount, :currency)
        RETURNING id
        """,
        {
            "program_id": program_id,
            "category": "registration",
            "amount": Decimal("2500.000"),
            "currency": "TND",
        },
    )
    career_id = _insert_id(
        connection,
        """
        INSERT INTO career_opportunities (career_job_title, career_industry)
        VALUES (:title, :industry)
        RETURNING id
        """,
        {
            "title": f"Test engineer {suffix}",
            "industry": "technology",
        },
    )
    connection.execute(
        text(
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, :career_id)
            """
        ),
        {"program_id": program_id, "career_id": career_id},
    )

    with Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    ) as session:
        program = session.get(AcademicProgram, program_id)
        assert program is not None
        assert program.institution.id == institution_id
        assert any(
            specialization.id == specialization_id
            for specialization in program.specializations
        )
        assert any(curriculum.id == curriculum_id for curriculum in program.curricula)
        assert any(
            requirement.id == admission_requirement_id
            for requirement in program.admission_requirements
        )
        assert any(fee.id == program_fee_id for fee in program.fees)
        assert any(career.id == career_id for career in program.careers)

        institution = session.get(AcademicInstitution, institution_id)
        specialization = session.get(Specialization, specialization_id)
        curriculum = session.get(Curriculum, curriculum_id)
        semester = session.get(Semester, semester_id)
        module = session.get(Module, module_id)
        subject = session.get(Subject, subject_id)
        admission_requirement = session.get(
            AdmissionRequirement,
            admission_requirement_id,
        )
        program_fee = session.get(ProgramFee, program_fee_id)
        career = session.get(CareerOpportunity, career_id)
        assert institution is not None and program in institution.programs
        assert specialization is not None and specialization.program.id == program_id
        assert curriculum is not None and curriculum.program.id == program_id
        assert curriculum.curriculum_academic_year is None
        assert semester is not None and semester.curriculum.id == curriculum_id
        assert module is not None and module.semester.id == semester_id
        assert subject is not None and subject.module.id == module_id
        assert (
            admission_requirement is not None
            and admission_requirement.program.id == program_id
        )
        assert program_fee is not None and program_fee.program.id == program_id
        assert career is not None and program in career.programs

    numeric_values = tuple(
        connection.execute(
            text(
                """
                SELECT subject_credits, subject_coefficient, lecture_hours,
                       practical_hours, lab_hours
                FROM subjects
                WHERE id = :id
                """
            ),
            {"id": subject_id},
        ).one()
    )
    assert numeric_values == (
        Decimal("4.00"),
        Decimal("1.250"),
        Decimal("20.00"),
        Decimal("10.00"),
        Decimal("5.00"),
    )

    nullable_fee_id = _insert_id(
        connection,
        """
        INSERT INTO program_fees (program_id, fee_category)
        VALUES (:program_id, :category)
        RETURNING id
        """,
        {"program_id": program_id, "category": f"unspecified-{suffix}"},
    )
    assert connection.execute(
        text("SELECT fee_amount, fee_currency FROM program_fees WHERE id = :id"),
        {"id": nullable_fee_id},
    ).one() == (None, None)

    duplicate_checks = [
        (
            """
            INSERT INTO academic_institutions (institution_code, institution_name)
            VALUES (:code, :name)
            """,
            {"code": institution_code, "name": "Duplicate institution"},
            "uq_academic_institutions_institution_code",
        ),
        (
            """
            INSERT INTO academic_programs (
                institution_id, program_code, program_name, program_type
            ) VALUES (:institution_id, :code, :name, :type)
            """,
            {
                "institution_id": institution_id,
                "code": program_code,
                "name": "Duplicate program",
                "type": "engineering",
            },
            "uq_academic_programs_program_code",
        ),
        (
            """
            INSERT INTO curricula (program_id, curriculum_academic_year)
            VALUES (:program_id, NULL)
            """,
            {"program_id": program_id},
            "uq_curricula_program_academic_year",
        ),
        (
            """
            INSERT INTO semesters (curriculum_id, semester_number)
            VALUES (:curriculum_id, 1)
            """,
            {"curriculum_id": curriculum_id},
            "uq_semesters_curriculum_semester_number",
        ),
        (
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, :career_id)
            """,
            {"program_id": program_id, "career_id": career_id},
            "pk_program_careers",
        ),
    ]
    for statement, parameters, constraint in duplicate_checks:
        _assert_integrity_error(
            connection,
            statement,
            parameters,
            "23505",
            "constraint_name",
            constraint,
        )

    check_failures = [
        (
            """
            INSERT INTO academic_programs (
                institution_id, program_code, program_name, program_type,
                total_credits
            ) VALUES (:institution_id, :code, :name, :type, -1)
            """,
            {
                "institution_id": institution_id,
                "code": f"NEG-CREDITS-{suffix}",
                "name": "Negative credits",
                "type": "engineering",
            },
            "ck_academic_programs_total_credits_nonnegative",
        ),
        (
            """
            INSERT INTO semesters (curriculum_id, semester_number)
            VALUES (:curriculum_id, 0)
            """,
            {"curriculum_id": curriculum_id},
            "ck_semesters_semester_number_positive",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name, subject_credits)
            VALUES (:module_id, :name, -1)
            """,
            {"module_id": module_id, "name": f"Negative credits {suffix}"},
            "ck_subjects_credits_nonnegative",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name, subject_coefficient)
            VALUES (:module_id, :name, 0)
            """,
            {"module_id": module_id, "name": f"Zero coefficient {suffix}"},
            "ck_subjects_coefficient_positive",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name, lecture_hours)
            VALUES (:module_id, :name, -1)
            """,
            {"module_id": module_id, "name": f"Negative lecture hours {suffix}"},
            "ck_subjects_lecture_hours_nonnegative",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name, practical_hours)
            VALUES (:module_id, :name, -1)
            """,
            {"module_id": module_id, "name": f"Negative practical hours {suffix}"},
            "ck_subjects_practical_hours_nonnegative",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name, lab_hours)
            VALUES (:module_id, :name, -1)
            """,
            {"module_id": module_id, "name": f"Negative lab hours {suffix}"},
            "ck_subjects_lab_hours_nonnegative",
        ),
        (
            """
            INSERT INTO admission_requirements (
                program_id, required_diploma, admission_process,
                required_documents, additional_conditions
            ) VALUES (:program_id, NULL, NULL, NULL, NULL)
            """,
            {"program_id": program_id},
            "ck_admission_requirements_has_content",
        ),
        (
            """
            INSERT INTO program_fees (
                program_id, fee_category, fee_amount, fee_currency
            ) VALUES (:program_id, :category, -1, 'TND')
            """,
            {"program_id": program_id, "category": f"negative-{suffix}"},
            "ck_program_fees_amount_nonnegative",
        ),
        (
            """
            INSERT INTO program_fees (
                program_id, fee_category, fee_amount, fee_currency
            ) VALUES (:program_id, :category, 1, NULL)
            """,
            {"program_id": program_id, "category": f"no-currency-{suffix}"},
            "ck_program_fees_currency_required_for_amount",
        ),
        (
            """
            INSERT INTO program_fees (
                program_id, fee_category, fee_amount, fee_currency
            ) VALUES (:program_id, :category, 1, 'tnd')
            """,
            {"program_id": program_id, "category": f"bad-currency-{suffix}"},
            "ck_program_fees_currency_required_for_amount",
        ),
    ]
    for statement, parameters, constraint in check_failures:
        _assert_integrity_error(
            connection,
            statement,
            parameters,
            "23514",
            "constraint_name",
            constraint,
        )

    not_null_failures = [
        (
            """
            INSERT INTO academic_institutions (institution_code, institution_name)
            VALUES (:code, NULL)
            """,
            {"code": f"NULL-NAME-{suffix}"},
            "institution_name",
        ),
        (
            """
            INSERT INTO academic_programs (
                institution_id, program_code, program_name, program_type
            ) VALUES (:institution_id, :code, NULL, :type)
            """,
            {
                "institution_id": institution_id,
                "code": f"NULL-PROGRAM-NAME-{suffix}",
                "type": "engineering",
            },
            "program_name",
        ),
        (
            """
            INSERT INTO specializations (program_id, specialization_name)
            VALUES (:program_id, NULL)
            """,
            {"program_id": program_id},
            "specialization_name",
        ),
        (
            """
            INSERT INTO curricula (program_id, curriculum_academic_year)
            VALUES (NULL, :year)
            """,
            {"year": f"NULL-{suffix}"},
            "program_id",
        ),
        (
            """
            INSERT INTO semesters (curriculum_id, semester_number)
            VALUES (:curriculum_id, NULL)
            """,
            {"curriculum_id": curriculum_id},
            "semester_number",
        ),
        (
            """
            INSERT INTO modules (semester_id, module_name)
            VALUES (:semester_id, NULL)
            """,
            {"semester_id": semester_id},
            "module_name",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name)
            VALUES (:module_id, NULL)
            """,
            {"module_id": module_id},
            "subject_name",
        ),
        (
            """
            INSERT INTO admission_requirements (program_id, required_diploma)
            VALUES (NULL, 'Baccalaureate')
            """,
            {},
            "program_id",
        ),
        (
            """
            INSERT INTO program_fees (program_id, fee_category)
            VALUES (:program_id, NULL)
            """,
            {"program_id": program_id},
            "fee_category",
        ),
        (
            """
            INSERT INTO career_opportunities (career_job_title)
            VALUES (NULL)
            """,
            {},
            "career_job_title",
        ),
        (
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (NULL, :career_id)
            """,
            {"career_id": career_id},
            "program_id",
        ),
        (
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, NULL)
            """,
            {"program_id": program_id},
            "career_id",
        ),
    ]
    for statement, parameters, column in not_null_failures:
        _assert_integrity_error(
            connection,
            statement,
            parameters,
            "23502",
            "column_name",
            column,
        )

    missing_references = [
        (
            """
            INSERT INTO academic_programs (
                institution_id, program_code, program_name, program_type
            ) VALUES (:parent_id, :code, :name, :type)
            """,
            {
                "parent_id": _missing_id(connection, "academic_institutions"),
                "code": f"BAD-INSTITUTION-{suffix}",
                "name": "Missing institution",
                "type": "engineering",
            },
            "fk_academic_programs_institution",
        ),
        (
            """
            INSERT INTO specializations (program_id, specialization_name)
            VALUES (:parent_id, :name)
            """,
            {
                "parent_id": _missing_id(connection, "academic_programs"),
                "name": "Missing program specialization",
            },
            "fk_specializations_program",
        ),
        (
            """
            INSERT INTO curricula (program_id, curriculum_academic_year)
            VALUES (:parent_id, :year)
            """,
            {
                "parent_id": _missing_id(connection, "academic_programs"),
                "year": f"BAD-{suffix}",
            },
            "fk_curricula_program",
        ),
        (
            """
            INSERT INTO semesters (curriculum_id, semester_number)
            VALUES (:parent_id, 2)
            """,
            {"parent_id": _missing_id(connection, "curricula")},
            "fk_semesters_curriculum",
        ),
        (
            """
            INSERT INTO modules (semester_id, module_name)
            VALUES (:parent_id, 'Missing semester module')
            """,
            {"parent_id": _missing_id(connection, "semesters")},
            "fk_modules_semester",
        ),
        (
            """
            INSERT INTO subjects (module_id, subject_name)
            VALUES (:parent_id, 'Missing module subject')
            """,
            {"parent_id": _missing_id(connection, "modules")},
            "fk_subjects_module",
        ),
        (
            """
            INSERT INTO admission_requirements (program_id, required_diploma)
            VALUES (:parent_id, 'Baccalaureate')
            """,
            {"parent_id": _missing_id(connection, "academic_programs")},
            "fk_admission_requirements_program",
        ),
        (
            """
            INSERT INTO program_fees (program_id, fee_category)
            VALUES (:parent_id, 'Missing program fee')
            """,
            {"parent_id": _missing_id(connection, "academic_programs")},
            "fk_program_fees_program",
        ),
        (
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:parent_id, :career_id)
            """,
            {
                "parent_id": _missing_id(connection, "academic_programs"),
                "career_id": career_id,
            },
            "fk_program_careers_program",
        ),
        (
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, :parent_id)
            """,
            {
                "program_id": program_id,
                "parent_id": _missing_id(connection, "career_opportunities"),
            },
            "fk_program_careers_career",
        ),
    ]
    for statement, parameters, constraint in missing_references:
        _assert_integrity_error(
            connection,
            statement,
            parameters,
            "23503",
            "constraint_name",
            constraint,
        )

    restricted_programs = [
        (
            "specialization",
            "fk_specializations_program",
        ),
        (
            "curriculum",
            "fk_curricula_program",
        ),
        (
            "admission_requirement",
            "fk_admission_requirements_program",
        ),
        (
            "program_fee",
            "fk_program_fees_program",
        ),
    ]
    for label, constraint in restricted_programs:
        restricted_program_id = _insert_program(
            connection,
            institution_id,
            suffix,
            f"RESTRICT-{label}",
        )
        if label == "specialization":
            connection.execute(
                text(
                    """
                    INSERT INTO specializations (program_id, specialization_name)
                    VALUES (:program_id, :name)
                    """
                ),
                {
                    "program_id": restricted_program_id,
                    "name": f"Restrict specialization {suffix}",
                },
            )
        elif label == "curriculum":
            connection.execute(
                text(
                    """
                    INSERT INTO curricula (program_id, curriculum_academic_year)
                    VALUES (:program_id, :year)
                    """
                ),
                {
                    "program_id": restricted_program_id,
                    "year": f"R-{suffix}",
                },
            )
        elif label == "admission_requirement":
            connection.execute(
                text(
                    """
                    INSERT INTO admission_requirements (program_id, required_diploma)
                    VALUES (:program_id, 'Baccalaureate')
                    """
                ),
                {"program_id": restricted_program_id},
            )
        else:
            connection.execute(
                text(
                    """
                    INSERT INTO program_fees (program_id, fee_category)
                    VALUES (:program_id, :category)
                    """
                ),
                {
                    "program_id": restricted_program_id,
                    "category": f"restrict-{suffix}",
                },
            )
        _assert_integrity_error(
            connection,
            "DELETE FROM academic_programs WHERE id = :id",
            {"id": restricted_program_id},
            "23503",
            "constraint_name",
            constraint,
        )

    for table, row_id, constraint in [
        (
            "academic_institutions",
            institution_id,
            "fk_academic_programs_institution",
        ),
        ("curricula", curriculum_id, "fk_semesters_curriculum"),
        ("semesters", semester_id, "fk_modules_semester"),
        ("modules", module_id, "fk_subjects_module"),
    ]:
        _assert_integrity_error(
            connection,
            f"DELETE FROM {table} WHERE id = :id",
            {"id": row_id},
            "23503",
            "constraint_name",
            constraint,
        )

    cascade_program_id = _insert_program(
        connection,
        institution_id,
        suffix,
        "CASCADE-PROGRAM",
    )
    connection.execute(
        text(
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, :career_id)
            """
        ),
        {"program_id": cascade_program_id, "career_id": career_id},
    )
    connection.execute(
        text("DELETE FROM academic_programs WHERE id = :id"),
        {"id": cascade_program_id},
    )
    assert not connection.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1 FROM program_careers
                WHERE program_id = :program_id AND career_id = :career_id
            )
            """
        ),
        {"program_id": cascade_program_id, "career_id": career_id},
    ).scalar_one()

    cascade_career_id = _insert_id(
        connection,
        """
        INSERT INTO career_opportunities (career_job_title)
        VALUES (:title)
        RETURNING id
        """,
        {"title": f"Cascade career {suffix}"},
    )
    connection.execute(
        text(
            """
            INSERT INTO program_careers (program_id, career_id)
            VALUES (:program_id, :career_id)
            """
        ),
        {"program_id": program_id, "career_id": cascade_career_id},
    )
    connection.execute(
        text("DELETE FROM career_opportunities WHERE id = :id"),
        {"id": cascade_career_id},
    )
    assert not connection.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1 FROM program_careers
                WHERE program_id = :program_id AND career_id = :career_id
            )
            """
        ),
        {"program_id": program_id, "career_id": cascade_career_id},
    ).scalar_one()