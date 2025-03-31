import {
  Box,
  Chip,
  IconButton,
  Link,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FaRegEye } from "react-icons/fa";
import { MdBookmarkAdd, MdBookmarkRemove } from "react-icons/md";
import CustomSparkLine from "../charts/CustomSparkLine";

interface ProductDataGridProps {
  products: any[];
  onShowDetails: (asin: string) => void;
  onToggleMyProduct: (asin: string) => void;
  isInitialScraped: boolean;
}

export default function ProductDataGrid({
  products,
  onShowDetails,
  onToggleMyProduct,
  isInitialScraped,
}: ProductDataGridProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      value
    );
  };

  const renderWithNoData = (value: any, formatter?: (val: any) => any) => {
    if (value === null || value === undefined || value === "") {
      return <Chip label="No Data" color="default" size="small" />;
    }
    return formatter ? formatter(value) : value;
  };

  const columns: GridColDef[] = [
    {
      field: "details",
      headerName: "Details",
      width: 30,
      renderCell: (params) => (
        <Tooltip title="Get Product Insights">
          <IconButton
            onClick={() => onShowDetails(params.row.id)}
            sx={{ padding: 0, color: "primary.main" }}
          >
            <FaRegEye size={20} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "myProduct",
      headerName: "My Product",
      width: 50,
      renderCell: (params) => {
        return (
          <Box>
            <span
              onClick={() => onToggleMyProduct(params.row.id)}
              style={{
                cursor: "pointer",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                color: params.row.isMyProduct
                  ? "theme.palette.accent.main"
                  : "theme.palette.primary.main",
                marginTop: 16,
              }}
            >
              {params.row.isMyProduct ? (
                <>
                  <Tooltip title="Remove from My Products">
                    <MdBookmarkRemove size={20} />
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Add to My Products">
                    <MdBookmarkAdd size={20} />
                  </Tooltip>
                </>
              )}
            </span>
          </Box>
        );
      },
    },
    {
      field: "image",
      headerName: "Image",
      width: 40,
      renderCell: (params) =>
        params.value ? (
          <Link
            href={`https://www.amazon.com/dp/${params.row.id}?language=en_US`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={params.value}
              alt="Product"
              style={{ width: "100%", objectFit: "fill", cursor: "pointer" }}
            />
          </Link>
        ) : (
          <Chip label="No Image" color="default" size="small" />
        ),
    },
    {
      field: "id",
      headerName: "ASIN",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <Link
            href={`https://www.amazon.com/dp/${params.value}?language=en_US`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : (
          <Chip label="No ASIN" color="default" size="small" />
        ),
    },
    { field: "title", headerName: "Title", width: 400 },
    {
      field: "chart_price",
      headerName: "Price Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
    {
      field: "store",
      headerName: "Store",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "manufacturer",
      headerName: "Manufacturer/Brand",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "chart_main_rank",
      headerName: "Main Rank Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "mainCategoryRank",
      headerName: "Rank Main",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "secondCategory",
      headerName: "Sub Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "chart_second_rank",
      headerName: "Second Rank Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "secondCategoryRank",
      headerName: "Sub Rank",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "blm",
      headerName: "Bought Last Month",
      type: "number",
      width: 130,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "chart_blm",
      headerName: "BLM Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "chart_total",
      headerName: "Total Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "total",
      headerName: "Total Revenue",
      type: "number",
      width: 150,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
  ];

  const allowedFields = ["details", "image", "asin", "title", "price"];
  const filteredColumns = isInitialScraped
    ? columns
    : columns.filter((col) => allowedFields.includes(col.field));

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={products.map((product: any) => ({
          id: product.asin,
          image: product.image,
          title: product.title,
          price: product.price,
          manufacturer: product.manufacturer,
          store: product.store,
          mainCategory: product.main_category,
          mainCategoryRank: product.main_category_rank,
          secondCategory: product.second_category,
          secondCategoryRank: product.second_category_rank,
          blm: product.blm,
          total: product.total,
          isMyProduct: product.isMyProduct,
        }))}
        columns={filteredColumns}
        rowHeight={55}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection={false}
        getRowClassName={(params) =>
          params.row.isMyProduct ? "my-product-row" : ""
        }
      />
    </Box>
  );
} 