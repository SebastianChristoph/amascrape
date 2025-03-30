// utils/iconUtils.tsx
import { FaLayerGroup, FaDollarSign, FaEdit, FaTrash, FaQuestionCircle, FaBox, FaEye } from "react-icons/fa";
import { IconType } from "react-icons";
import { FaBullseye } from "react-icons/fa";

import { FaCube } from "react-icons/fa";
import { FaCamera } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
import { GrCluster } from "react-icons/gr";
import { LuCirclePercent } from "react-icons/lu";
import { BsBoxes } from "react-icons/bs";
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
  percent: TbPercentage70  , 
  // weitere Icons hier hinzufügen
};

// Optional: Fallback-Icon, falls key nicht gefunden wird
export const fallbackIcon: IconType = FaQuestionCircle;
