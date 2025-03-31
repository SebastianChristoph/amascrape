import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  styled,
  Typography,
} from "@mui/material";

interface ProductChange {
  change_date: string;
  title: string;
  price: number;
  main_category: string;
  second_category: string;
  main_category_rank: number;
  second_category_rank: number;
  blm: number;
  total: number;
  changes: string;
}

interface ProductDetailTableProps {
  productChanges: ProductChange[];
  formatCurrency: (value: number | null) => string;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxWidth: "80vw",
  maxHeight: "80vh",
  overflowY: "auto",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  borderRadius: "12px",
  "& .MuiTable-root": {
    borderCollapse: "separate",
    borderSpacing: "0",
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 1,
  "& .MuiTableCell-head": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    padding: "16px",
    whiteSpace: "nowrap",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    transition: "background-color 0.2s ease",
  },
  "& .MuiTableCell-root": {
    padding: "12px 16px",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const EmptyCell = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontStyle: "italic",
}));

export default function ProductDetailTable({
  productChanges,
  formatCurrency,
}: ProductDetailTableProps) {
  return (
    <StyledTableContainer>
      <Table>
        <StyledTableHead>
          <TableRow>
            <TableCell>Change Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Main Category</TableCell>
            <TableCell>Sub Category</TableCell>
            <TableCell align="right">Rank (Main)</TableCell>
            <TableCell align="right">Rank (Sub)</TableCell>
            <TableCell align="right">BLM</TableCell>
            <TableCell align="right">Total Revenue</TableCell>
            <TableCell>Changes</TableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {productChanges.length > 0 ? (
            productChanges.map((change, index) => (
              <StyledTableRow key={index}>
                <TableCell>{change.change_date}</TableCell>
                <TableCell>
                  {change.title || <EmptyCell>No title</EmptyCell>}
                </TableCell>
                <TableCell>
                  {change.price ? (
                    <Typography color="primary.secondary" fontWeight="medium">
                      {formatCurrency(change.price)}
                    </Typography>
                  ) : (
                    <EmptyCell>-</EmptyCell>
                  )}
                </TableCell>
                <TableCell>
                  {change.main_category || <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell>
                  {change.second_category || <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell align="right">
                  {change.main_category_rank || <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell align="right">
                  {change.second_category_rank || <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell align="right">
                  {change.blm || <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell align="right">
                  {change.total ? (
                    <Typography color="success.main" fontWeight="medium">
                      {formatCurrency(change.total)}
                    </Typography>
                  ) : (
                    <EmptyCell>-</EmptyCell>
                  )}
                </TableCell>
                <TableCell>{change.changes || <EmptyCell>No changes</EmptyCell>}</TableCell>
              </StyledTableRow>
            ))
          ) : (
            <StyledTableRow>
              <TableCell colSpan={10} align="center">
                <Typography variant="body1" color="text.secondary" py={4}>
                  No Product Changes Found
                </Typography>
              </TableCell>
            </StyledTableRow>
          )}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
} 