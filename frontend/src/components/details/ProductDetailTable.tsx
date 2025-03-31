import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

export default function ProductDetailTable({
  productChanges,
  formatCurrency,
}: ProductDetailTableProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{ maxWidth: "80vw", maxHeight: "80vh", overflowY: "auto" }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Change Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Main Category</TableCell>
            <TableCell>Sub Category</TableCell>
            <TableCell>Rank (Main)</TableCell>
            <TableCell>Rank (Sub)</TableCell>
            <TableCell>BLM</TableCell>
            <TableCell>Total Revenue</TableCell>
            <TableCell>Changes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productChanges.length > 0 ? (
            productChanges.map((change, index) => (
              <TableRow key={index}>
                <TableCell>{change.change_date}</TableCell>
                <TableCell>{change.title || "-"}</TableCell>
                <TableCell>
                  {change.price ? formatCurrency(change.price) : "-"}
                </TableCell>
                <TableCell>{change.main_category || "-"}</TableCell>
                <TableCell>{change.second_category || "-"}</TableCell>
                <TableCell>{change.main_category_rank || "-"}</TableCell>
                <TableCell>{change.second_category_rank || "-"}</TableCell>
                <TableCell>{change.blm || "-"}</TableCell>
                <TableCell>
                  {change.total ? formatCurrency(change.total) : "-"}
                </TableCell>
                <TableCell>{change.changes || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} align="center">
                No Product Changes Found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
} 