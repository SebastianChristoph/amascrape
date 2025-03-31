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
  Tooltip,
  Box,
} from "@mui/material";
import { FiTrendingUp, FiTrendingDown, FiCircle } from 'react-icons/fi';

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

const ChangedCell = styled(TableCell)<{ waschanged?: number }>(({ theme, waschanged }) => ({
  position: 'relative',
  backgroundColor: waschanged ? `${theme.palette.action.selected}40` : 'transparent',
}));

const ChangeIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 2,
  right: 2,
  padding: '2px',
  borderRadius: '0 0 0 4px',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.85,
  '& svg': {
    fontSize: '0.8rem',
  },
}));

const Legend = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  '& .legend-item': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));

interface ValueWithChangeProps {
  current: number;
  previous: number | undefined;
  formatValue?: (value: number) => string;
  isInverseLogic?: boolean;
}

const ValueWithChange = ({ current, previous, formatValue = (v) => v.toString(), isInverseLogic = false }: ValueWithChangeProps) => {
  const hasChanged = previous !== undefined && current !== previous;
  const increased = previous !== undefined && current > previous;
  const isPositiveChange = isInverseLogic ? !increased : increased;
  
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: 'auto 16px', // Fixed width for value and icon
      gap: 1,
      justifyContent: 'end',
      alignItems: 'center',
      minWidth: '100px'
    }}>
      <Typography
        sx={{
          color: hasChanged
            ? isPositiveChange
              ? 'success.main'
              : 'error.main'
            : 'text.primary',
          textAlign: 'right'
        }}
      >
        {formatValue(current)}
      </Typography>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px'
      }}>
        {hasChanged && (
          <Box component="span" sx={{ 
            color: isPositiveChange ? 'success.main' : 'error.main',
            display: 'flex',
            alignItems: 'center'
          }}>
            {increased ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default function ProductDetailTable({
  productChanges,
  formatCurrency,
}: ProductDetailTableProps) {
  return (
    <Box>
      <Legend>
        <Box className="legend-item">
          <FiCircle size={8} color="currentColor" /> Value changed
        </Box>
        <Box className="legend-item">
          <FiTrendingUp size={14} color="currentColor" /> Value increased
        </Box>
        <Box className="legend-item">
          <FiTrendingDown size={14} color="currentColor" /> Value decreased
        </Box>
        <Box className="legend-item" sx={{ fontStyle: 'italic' }}>
          * For ranks, a lower value means a better position
        </Box>
      </Legend>
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
              productChanges.map((change, index) => {
                const previousChange = index < productChanges.length - 1 ? productChanges[index + 1] : undefined;
                const changedFields = change.changes ? change.changes.split(', ') : [];

                return (
                  <StyledTableRow key={index}>
                    <ChangedCell>{change.change_date}</ChangedCell>
                    <ChangedCell waschanged={changedFields.includes('title') ? 1 : 0}>
                      {change.title || <EmptyCell>No title</EmptyCell>}
                      {changedFields.includes('title') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell waschanged={changedFields.includes('price') ? 1 : 0}>
                      {change.price ? (
                        <ValueWithChange
                          current={change.price}
                          previous={previousChange?.price}
                          formatValue={formatCurrency}
                        />
                      ) : (
                        <EmptyCell>-</EmptyCell>
                      )}
                      {changedFields.includes('price') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell waschanged={changedFields.includes('main_category') ? 1 : 0}>
                      {change.main_category || <EmptyCell>-</EmptyCell>}
                      {changedFields.includes('main_category') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell waschanged={changedFields.includes('second_category') ? 1 : 0}>
                      {change.second_category || <EmptyCell>-</EmptyCell>}
                      {changedFields.includes('second_category') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell align="right" waschanged={changedFields.includes('main_category_rank') ? 1 : 0}>
                      {change.main_category_rank ? (
                        <ValueWithChange
                          current={change.main_category_rank}
                          previous={previousChange?.main_category_rank}
                          isInverseLogic={true}
                        />
                      ) : (
                        <EmptyCell>-</EmptyCell>
                      )}
                      {changedFields.includes('main_category_rank') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell align="right" waschanged={changedFields.includes('second_category_rank') ? 1 : 0}>
                      {change.second_category_rank ? (
                        <ValueWithChange
                          current={change.second_category_rank}
                          previous={previousChange?.second_category_rank}
                          isInverseLogic={true}
                        />
                      ) : (
                        <EmptyCell>-</EmptyCell>
                      )}
                      {changedFields.includes('second_category_rank') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell align="right" waschanged={changedFields.includes('blm') ? 1 : 0}>
                      {change.blm ? (
                        <ValueWithChange
                          current={change.blm}
                          previous={previousChange?.blm}
                        />
                      ) : (
                        <EmptyCell>-</EmptyCell>
                      )}
                      {changedFields.includes('blm') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell align="right" waschanged={changedFields.includes('total') ? 1 : 0}>
                      {change.total ? (
                        <ValueWithChange
                          current={change.total}
                          previous={previousChange?.total}
                          formatValue={formatCurrency}
                        />
                      ) : (
                        <EmptyCell>-</EmptyCell>
                      )}
                      {changedFields.includes('total') && (
                        <Tooltip title="Wert wurde geändert">
                          <ChangeIndicator>
                            <FiCircle size={10} />
                          </ChangeIndicator>
                        </Tooltip>
                      )}
                    </ChangedCell>
                    <ChangedCell>{change.changes || <EmptyCell>No changes</EmptyCell>}</ChangedCell>
                  </StyledTableRow>
                );
              })
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
    </Box>
  );
} 