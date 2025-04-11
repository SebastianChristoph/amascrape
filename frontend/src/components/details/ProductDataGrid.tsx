import {
  Box,
  Chip,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FaExternalLinkAlt, FaRegEye } from "react-icons/fa";
import { MdBookmarkAdd, MdBookmarkRemove } from "react-icons/md";
import CustomSparkLine from "../charts/CustomSparkLine";

interface ProductDataGridProps {
  products: any[];
  onShowDetails: (asin: string) => void;
  onToggleMyProduct: (asin: string) => void;
  isInitialScraped: boolean;
  mode: "light" | "dark";
}

export default function ProductDataGrid({
  products,
  onShowDetails,
  onToggleMyProduct,
  isInitialScraped,
  mode,
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
      headerName: "",
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
      headerName: "",
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
      headerName: "",
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
            sx={{ textDecoration: "none", color: "inherit" }}
          >
            <FaExternalLinkAlt size={12} />{" "}
            {params.value}
          </Link>
        ) : (
          <Chip label="No ASIN" color="default" size="small" />
        ),
    },
    {
      field: "title",
      headerName: "Title",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: '1.2',
          maxHeight: '100px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {params.value}
        </Box>
      )
    },
    {
      field: "chart_price",
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0}}>
            <CustomSparkLine data={params.row.sparkline_price}
            onClick={() => onShowDetails(params.row.id)}/>
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 90,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
    
    

    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "chart_main_rank",
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_main_category_rank}
            onClick={() => onShowDetails(params.row.id)}/>
          </Box>
        );
      },
    },
    {
      field: "mainCategoryRank",
      headerName: "Rank Main",
      width: 50,
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
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_second_category_rank}
            onClick={() => onShowDetails(params.row.id)}/>
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
      width: 70,
      renderCell: (params) => {
        const value = params.value;
        if (value === 0) {
          return "<50";
        }
        return renderWithNoData(value, formatNumber);
      },
    },
    
    {
      field: "chart_total",
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_total}
            onClick={() => onShowDetails(params.row.id)}/>
          </Box>
        );
      },
    },
    {
      field: "total",
      headerName: "Total Revenue",
      type: "number",
      width: 150,
      renderCell: (params) => {
        const value = params.value;
        if (value === 0) {
          return "no calc possible";
        }
        return renderWithNoData(value, formatCurrency);
      },
    },
    {
      field: "chart_review_count",
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_review_count}
            onClick={() => onShowDetails(params.row.id)}/>
          </Box>
        );
      },
    },
    {
      field: "review_count",
      headerName: "Reviews",
      type: "number",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "chart_rating",
      headerName: "",
      width: 40,
      renderCell: (params) => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_rating}
            onClick={() => onShowDetails(params.row.id)}/>
          </Box>
        );
      },
    },
    {
      field: "rating",
      headerName: "Rating",
      type: "number",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value),
    },

    {
      field: "brand",
      headerName: "Brand",
      width: 120,
      renderCell: (params) =>
        <Tooltip title={`Manufacturer: ${params.row.manufacturer || "No Manufacturer"}`}>
          <Box>{renderWithNoData(params.value)}</Box>
        </Tooltip>,
    },
    
  ];

 
  return (
    <Box className={mode === "light" ? "light-mode" : ""} sx={{ position: 'relative', height: 700, overflow: 'auto', mt: 4}}>
      <DataGrid
        className="data-grid"
        rows={products.map((product: any) => ({
          id: product.asin,
          image: product.image,
          title: product.title,
          price: product.price,
          manufacturer: product.manufacturer,
          brand: product.store,
          mainCategory: product.main_category,
          mainCategoryRank: product.main_category_rank,
          secondCategory: product.second_category,
          secondCategoryRank: product.second_category_rank,
          blm: product.blm,
          total: product.total,
          isMyProduct: product.isMyProduct,
          sparkline_price: product.sparkline_data_price,
          sparkline_blm: product.sparkline_data_blm,
          sparkline_main_category_rank: product.sparkline_data_main_category_rank,
          sparkline_second_category_rank: product.sparkline_data_second_category_rank,
          sparkline_review_count: product.sparkline_data_review_count,
          sparkline_rating: product.sparkline_data_rating,
          sparkline_total: product.sparkline_data_total,
        }))}
        columns={columns}
        rowHeight={55}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection={false}
        getRowClassName={(params) =>
          params.row.isMyProduct ? "my-product-row" : "product-row"
        }
        sx={{
          '& .MuiDataGrid-columnHeaders': {
            fontSize: '0.75rem',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '0.75rem',
            fontWeight: 500,
          }
        }}
      />
    </Box>
  );
} 