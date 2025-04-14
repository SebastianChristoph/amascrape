"""add review_count and rating to product_changes

Revision ID: add_review_count_and_rating
Revises: fc031172be17
Create Date: 2024-04-11 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_review_count_and_rating'
down_revision = 'fc031172be17'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns
    op.add_column('product_changes', sa.Column('review_count', sa.Integer(), nullable=True))
    op.add_column('product_changes', sa.Column('rating', sa.Float(), nullable=True))


def downgrade():
    # Remove columns
    op.drop_column('product_changes', 'review_count')
    op.drop_column('product_changes', 'rating') 