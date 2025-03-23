// utils/iconUtils.tsx
import { FaLayerGroup, FaDollarSign, FaEdit, FaTrash } from "react-icons/fa";
import { IconType } from "react-icons";

export const iconMap: Record<string, IconType> = {
  layer: FaLayerGroup,
  dollar: FaDollarSign,
  edit: FaEdit,
  trash: FaTrash,
  // Weitere Icons hier hinzufügen
};
