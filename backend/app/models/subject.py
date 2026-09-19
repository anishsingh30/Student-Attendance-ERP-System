from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False, default=5)
    total_classes_scheduled = Column(Integer, default=50)
    is_active = Column(Boolean, default=True, nullable=False)
    credits = Column(Integer, default=3, nullable=True)

    # Relationships
    faculty_subjects = relationship("FacultySubject", back_populates="subject", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="subject", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="subject", cascade="all, delete-orphan")

class FacultySubject(Base):
    __tablename__ = "faculty_subjects"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    faculty = relationship("Faculty", back_populates="faculty_subjects")
    subject = relationship("Subject", back_populates="faculty_subjects")
