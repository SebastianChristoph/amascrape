// utils/iconUtils.tsx
import { FaLayerGroup, FaDollarSign, FaEdit, FaTrash, FaQuestionCircle } from "react-icons/fa";
import { IconType } from "react-icons";
import { FaBullseye } from "react-icons/fa";

import { FaCube } from "react-icons/fa";
import { FaCamera } from "react-icons/fa";

export const iconMap: Record<string, IconType> = {
  layer: FaLayerGroup,
  dollar: FaDollarSign,
  edit: FaEdit,
  trash: FaTrash,
  dynamic: FaBullseye,
  static: FaCube,
  snapshot: FaCamera, 
  // weitere Icons hier hinzufügen
};

// Optional: Fallback-Icon, falls key nicht gefunden wird
export const fallbackIcon: IconType = FaQuestionCircle;
