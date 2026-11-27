"""SA-14 : aligner les contraintes documents / rendez-vous / entretiens sur les modèles.

La migration e0a55cf7d534 a été générée avant la dernière version des modèles
SQLAlchemy. `alembic check` signalait un écart : la colonne
`candidate_documents.requirement_set_id` et plusieurs clés composites
n'existaient pas en base, ce qui faisait échouer toute requête ORM sur
`CandidateDocument`.

Ordre important : les contraintes UNIQUE ciblées par les clés étrangères
composites sont créées AVANT ces clés étrangères.

Revision ID: sa14_align_001
Revises: e0a55cf7d534
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "sa14_align_001"
down_revision: Union[str, None] = "e0a55cf7d534"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Contraintes UNIQUE nécessaires aux clés étrangères composites.
    op.create_unique_constraint(
        "uq_appointments_id_pre_registration", "appointments", ["id", "pre_registration_id"]
    )
    op.create_unique_constraint(
        "uq_pre_registrations_id_document_requirement_set",
        "pre_registrations", ["id", "document_requirement_set_id"],
    )
    op.create_unique_constraint(
        "uq_required_document_types_id_requirement_set",
        "required_document_types", ["id", "requirement_set_id"],
    )

    # 2. Nouvelle colonne : ajoutée nullable, remplie depuis le dossier, puis NOT NULL.
    op.add_column("candidate_documents", sa.Column("requirement_set_id", sa.UUID(), nullable=True))
    op.execute(
        """
        UPDATE candidate_documents AS d
        SET requirement_set_id = p.document_requirement_set_id
        FROM pre_registrations AS p
        WHERE p.id = d.pre_registration_id
        """
    )
    op.alter_column("candidate_documents", "requirement_set_id", nullable=False)
    op.create_index(
        "uq_candidate_documents_storage_key", "candidate_documents", ["storage_key"], unique=True
    )

    # 3. Remplacement des clés étrangères simples par des clés composites.
    op.drop_constraint("fk_candidate_documents_required_type", "candidate_documents", type_="foreignkey")
    op.drop_constraint("fk_candidate_documents_pre_registration", "candidate_documents", type_="foreignkey")
    op.create_foreign_key(
        "fk_candidate_documents_dossier_requirement_set", "candidate_documents", "pre_registrations",
        ["pre_registration_id", "requirement_set_id"], ["id", "document_requirement_set_id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_candidate_documents_type_requirement_set", "candidate_documents", "required_document_types",
        ["required_document_type_id", "requirement_set_id"], ["id", "requirement_set_id"],
        ondelete="RESTRICT",
    )
    op.drop_constraint("fk_interviews_appointment", "interviews", type_="foreignkey")
    op.create_foreign_key(
        "fk_interviews_appointment_same_dossier", "interviews", "appointments",
        ["appointment_id", "pre_registration_id"], ["id", "pre_registration_id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_interviews_appointment_same_dossier", "interviews", type_="foreignkey")
    op.create_foreign_key(
        "fk_interviews_appointment", "interviews", "appointments",
        ["appointment_id"], ["id"], ondelete="RESTRICT",
    )
    op.drop_constraint("fk_candidate_documents_type_requirement_set", "candidate_documents", type_="foreignkey")
    op.drop_constraint("fk_candidate_documents_dossier_requirement_set", "candidate_documents", type_="foreignkey")
    op.create_foreign_key(
        "fk_candidate_documents_pre_registration", "candidate_documents", "pre_registrations",
        ["pre_registration_id"], ["id"], ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_candidate_documents_required_type", "candidate_documents", "required_document_types",
        ["required_document_type_id"], ["id"], ondelete="RESTRICT",
    )
    op.drop_index("uq_candidate_documents_storage_key", table_name="candidate_documents")
    op.drop_column("candidate_documents", "requirement_set_id")
    op.drop_constraint("uq_required_document_types_id_requirement_set", "required_document_types", type_="unique")
    op.drop_constraint("uq_pre_registrations_id_document_requirement_set", "pre_registrations", type_="unique")
    op.drop_constraint("uq_appointments_id_pre_registration", "appointments", type_="unique")
