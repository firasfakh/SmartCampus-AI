
from app.models.catalog import (
    AcademicInstitution,
    AcademicProgram,
    Specialization,
    Curriculum,
    Semester,
    Module,
    Subject,
    AdmissionRequirement,
    ProgramFee,
    CareerOpportunity,
    program_careers,
)

from app.models.accounts import UserAccount

from app.models.candidates import (
    CandidateProfile,
    CandidateAcademicProfile,
    CandidateEducation,
)

from app.models.responsible_assignments import ResponsibleAssignment
from app.models.visitor_sessions import VisitorSession
from app.models.conversations import Conversation
from app.models.messages import Message
from app.models.pre_registrations import PreRegistration
from app.models.candidate_documents import CandidateDocument

from app.models.required_document_types import (
    DocumentRequirementSet,
    RequiredDocumentType,
)

from app.models.notifications import Notification
from app.models.appointment_proposals import AppointmentProposal
from app.models.appointments import Appointment
from app.models.appointment_change_requests import AppointmentChangeRequest
from app.models.interviews import Interview
from app.models.audit_events import AuditEvent
