"""Create model_versions table for persistent ML artifact and metadata storage

Revision ID: 0002_model_versions
Revises: 0001_initial_complete_schema
Create Date: 2026-09-20 18:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_model_versions'
down_revision: Union[str, Sequence[str], None] = '0001_initial_complete_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'model_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='INACTIVE'),
        sa.Column('storage_backend', sa.String(length=50), nullable=False, server_default='POSTGRES_BLOB'),
        sa.Column('artifact_bytes', sa.LargeBinary(), nullable=True),
        sa.Column('artifact_size_bytes', sa.Integer(), nullable=True),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('baseline_comparison', sa.JSON(), nullable=True),
        sa.Column('confusion_matrix', sa.JSON(), nullable=True),
        sa.Column('feature_importances', sa.JSON(), nullable=True),
        sa.Column('hyperparameters', sa.JSON(), nullable=True),
        sa.Column('feature_schema', sa.JSON(), nullable=True),
        sa.Column('dataset_metadata', sa.JSON(), nullable=True),
        sa.Column('trained_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by_user_id', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_model_versions_id', 'model_versions', ['id'], unique=False)
    op.create_index('ix_model_versions_model_version', 'model_versions', ['model_version'], unique=True)
    op.create_index('ix_model_versions_status', 'model_versions', ['status'], unique=False)
    op.create_index('ix_model_versions_trained_at', 'model_versions', ['trained_at'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_model_versions_trained_at', table_name='model_versions')
    op.drop_index('ix_model_versions_status', table_name='model_versions')
    op.drop_index('ix_model_versions_model_version', table_name='model_versions')
    op.drop_index('ix_model_versions_id', table_name='model_versions')
    op.drop_table('model_versions')
