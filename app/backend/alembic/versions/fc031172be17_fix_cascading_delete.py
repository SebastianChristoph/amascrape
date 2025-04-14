"""Fix cascading delete

Revision ID: fc031172be17
Revises: 43038a9d7420
Create Date: 2025-03-19 16:10:15.594779

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import reflection


# revision identifiers, used by Alembic.
revision: str = 'fc031172be17'
down_revision: Union[str, None] = '43038a9d7420'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ✅ Neue `market_clusters`-Tabelle mit `CASCADE DELETE`
def upgrade():
    conn = op.get_bind()
    inspector = reflection.Inspector.from_engine(conn)
    if 'market_clusters' not in inspector.get_table_names():
        op.create_table(
            "market_clusters",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String, nullable=False),
            sa.Column("total_revenue", sa.Float, nullable=True, default=0.0),
        )

    if 'market_cluster_markets' not in inspector.get_table_names():
        op.create_table(
            "market_cluster_markets",
            sa.Column("market_cluster_id", sa.Integer, sa.ForeignKey("market_clusters.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("market_id", sa.Integer, sa.ForeignKey("markets.id"), primary_key=True),
        )

def downgrade():
    op.drop_table("market_cluster_markets")
    op.drop_table("market_clusters")
    # ### end Alembic commands ###
