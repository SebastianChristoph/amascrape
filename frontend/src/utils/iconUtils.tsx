// utils/iconUtils.tsx
import { IconType } from "react-icons";
import { FaBox, FaBullseye, FaDollarSign, FaEdit, FaEye, FaLayerGroup, FaQuestionCircle, FaTrash } from "react-icons/fa";

import { AiOutlineCluster } from "react-icons/ai";
import { BsBoxes } from "react-icons/bs";
import { FaCamera, FaCube } from "react-icons/fa";
import { GrCluster } from "react-icons/gr";
import { TbPercentage70 } from "react-icons/tb";

export const iconMap: Record<string, IconType> = {
  layer: FaLayerGroup,
  dollar: FaDollarSign,
  edit: FaEdit,
  trash: FaTrash,
  dynamic: FaBullseye,
  static: FaCube,
  snapshot: FaCamera, 
  market: FaBox ,
  markets: GrCluster, 
  product: FaCube, 
  products: BsBoxes, 
  insight: FaEye , 
  percent: TbPercentage70,
  clusters: AiOutlineCluster 
  // weitere Icons hier hinzufügen
};

// Optional: Fallback-Icon, falls key nicht gefunden wird
export const fallbackIcon: IconType = FaQuestionCircle;
