import React, { useMemo, useEffect } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Handle, 
  Position, 
  MarkerType,
  useNodesState,
  useEdgesState
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as Icons from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  source: string;
  lot: string;
  qty: number;
  unit: string;
}

interface LineageDetails {
  materials: MaterialItem[];
  mixingTimestamp: string;
  mixingOperator: string;
  mixingMachine: string;
  packingOperator: string;
  packingFoilLot: string;
  sealTestingStatus: string;
  coreInternalTemp: string;
  warehouseBay: string;
  dispatchTruckLicense: string;
}

interface BatchGenealogyTreeProps {
  selectedOrder: {
    id: string;
    name: string;
    sku?: string;
    qty?: number;
    status: string;
    customer?: string;
  };
  lineageDetails: LineageDetails | null;
}

// Custom Node Components
const RawMaterialNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="p-3 w-[265px] rounded-xl border border-slate-200 text-left bg-white shadow-md relative overflow-hidden flex flex-col gap-1.5 hover:border-slate-400 hover:shadow-lg transition-all">
      {/* Glowing side accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a94228]" />
      
      <div className="flex justify-between items-start gap-1 pb-1 border-b border-dashed border-slate-200">
        <span className="text-[9px] font-mono font-black rounded px-1.5 py-0.5 tracking-tight bg-[#a94228]/10 text-[#a94228]">
          {data.id}
        </span>
        <span className="text-[9px] font-mono font-medium text-slate-500">
          LOT: <strong className="text-slate-800 font-black">{data.lot}</strong>
        </span>
      </div>

      <h5 className="text-[11px] font-black tracking-tight text-slate-800 leading-snug line-clamp-1">
        {data.name}
      </h5>

      <p className="text-[9px] font-bold leading-none text-slate-500 truncate">
        Supplier: {data.source}
      </p>

      <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-100">
        <span className="text-[8.5px] font-black text-emerald-600 flex items-center gap-0.5">
          <Icons.CheckCheck size={10} /> HACCP APPROVED
        </span>
        <span className="text-[11px] font-mono font-black text-slate-800">
          {data.qty} <span className="text-[9px] font-bold text-slate-500">{data.unit}</span>
        </span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#a94228', width: '8px', height: '8px' }} />
    </div>
  );
};

const MixingNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="p-4 w-[250px] rounded-xl border border-[#b58c4f]/45 bg-[#b58c4f]/5 text-slate-800 text-left shadow-md relative overflow-hidden flex flex-col gap-2.5 hover:border-[#b58c4f] hover:shadow-lg transition-all">
      <Handle type="target" position={Position.Left} style={{ background: '#b58c4f', width: '8px', height: '8px' }} />
      
      <div className="absolute right-3 top-3 opacity-15">
        <Icons.RotateCw size={36} />
      </div>

      <div className="flex items-center gap-1.5 pb-1.5 border-b border-dashed border-[#b58c4f]/30">
        <div className="p-1 rounded bg-[#b58c4f] text-white">
          <Icons.RotateCw size={11} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">MIXING SYSTEM-B</span>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">MACHINE GROUP</p>
        <p className="text-[11.5px] font-black text-slate-800 mt-1 truncate">{data.mixingMachine}</p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">OPERATIVE LEAD</p>
        <p className="text-[11.5px] font-black text-slate-800 mt-1 leading-snug">{data.mixingOperator}</p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">TIMESTAMP</p>
        <p className="text-[10.5px] font-mono font-bold text-slate-500 mt-1">{data.mixingTimestamp}</p>
      </div>

      <div className="pt-2 border-t border-[#b58c4f]/25 text-right flex items-center justify-between">
        <span className="text-[8px] font-black bg-[#657f4d] text-white px-1.5 py-0.5 rounded uppercase">
          ✓ SENSOR OK
        </span>
        <span className="text-[9px] font-mono font-bold text-[#b58c4f]">T-MIX SECURED</span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#b58c4f', width: '8px', height: '8px' }} />
    </div>
  );
};

const PackingNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="p-4 w-[250px] rounded-xl border border-[#212c46]/45 bg-[#212c46]/5 text-slate-800 text-left shadow-md relative overflow-hidden flex flex-col gap-2.5 hover:border-[#212c46] hover:shadow-lg transition-all">
      <Handle type="target" position={Position.Left} style={{ background: '#212c46', width: '8px', height: '8px' }} />

      <div className="absolute right-3 top-3 opacity-15">
        <Icons.Package size={36} />
      </div>

      <div className="flex items-center gap-1.5 pb-1.5 border-b border-dashed border-[#212c46]/30">
        <div className="p-1 rounded bg-[#212c46] text-white">
          <Icons.Package size={11} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">SEAL STATION L-3</span>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">PACKING CREW</p>
        <p className="text-[11.5px] font-black text-slate-800 mt-1 leading-snug">{data.packingOperator}</p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">FOIL LOT NO.</p>
        <p className="text-[10.5px] font-mono font-bold text-slate-500 mt-1 truncate">{data.packingFoilLot}</p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">VACUUM SAFETY TEST</p>
        <div className="flex items-center gap-1 text-[10.5px] font-black text-emerald-600 mt-1 uppercase leading-none">
          <Icons.CheckCircle size={11} /> LEAK-TEST PASSED
        </div>
      </div>

      <div className="pt-2 border-t border-[#212c46]/25 text-right flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 px-1.5 border border-amber-200 rounded">
          {data.status}
        </span>
        <span className="text-[9px] font-mono font-bold text-[#212c46]">LABEL PRINTED</span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#212c46', width: '8px', height: '8px' }} />
    </div>
  );
};

const LogisticsNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="p-4 w-[250px] rounded-xl border border-[#657f4d]/45 bg-[#657f4d]/5 text-slate-800 text-left shadow-md relative overflow-hidden flex flex-col gap-2.5 hover:border-[#657f4d] hover:shadow-lg transition-all">
      <Handle type="target" position={Position.Left} style={{ background: '#657f4d', width: '8px', height: '8px' }} />

      <div className="absolute right-3 top-3 opacity-15">
        <Icons.Truck size={36} />
      </div>

      <div className="flex items-center gap-1.5 pb-1.5 border-b border-dashed border-[#657f4d]/30">
        <div className="p-1 rounded bg-[#657f4d] text-white">
          <Icons.Truck size={11} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">WH & REEFER OUTBOUND</span>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">CCP CORE TEMP</p>
        <p className="text-xs font-black font-mono text-[#a94228] mt-1 bg-red-50 hover:bg-white px-1.5 py-0.5 rounded inline-block transition-colors border border-red-100">
          {data.coreInternalTemp}
        </p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">COOL RACK ASSIGNED</p>
        <p className="text-[11.5px] font-black text-slate-800 mt-1 leading-snug truncate">{data.warehouseBay}</p>
      </div>

      <div>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">TRUCK MATRIX LICENSE</p>
        <p className="text-[10.5px] font-mono font-bold text-slate-500 mt-1 truncate leading-snug">
          {data.dispatchTruckLicense}
        </p>
      </div>

      <div className="pt-2 border-t border-[#657f4d]/25 text-right flex items-center justify-between">
        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
          DISPATCHED
        </span>
        <span className="text-[9.5px] font-sans font-extrabold text-[#657f4d]">CCP-1 OK</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  rawMaterial: RawMaterialNodeComponent,
  mixing: MixingNodeComponent,
  packing: PackingNodeComponent,
  logistics: LogisticsNodeComponent,
};

export default function BatchGenealogyTree({ selectedOrder, lineageDetails }: BatchGenealogyTreeProps) {
  if (!lineageDetails) return null;

  const materials = lineageDetails.materials || [];

  // Generate modern nodes dynamically
  const initialNodes = useMemo(() => {
    const list: any[] = [];
    
    // 1. Raw materials on the left column (Stage 1)
    materials.forEach((m, idx) => {
      list.push({
        id: m.id,
        type: 'rawMaterial',
        data: m,
        position: { x: 30, y: idx * 115 + 20 },
      });
    });

    const centerY = Math.max(20, (materials.length - 1) * 115 / 2 + 20);

    // 2. Mixing Room in Stage 2 (centered)
    list.push({
      id: 'mixing',
      type: 'mixing',
      data: {
        mixingTimestamp: lineageDetails.mixingTimestamp,
        mixingOperator: lineageDetails.mixingOperator,
        mixingMachine: lineageDetails.mixingMachine,
      },
      position: { x: 360, y: centerY },
    });

    // 3. Packaging Line in Stage 3 (centered)
    list.push({
      id: 'packing',
      type: 'packing',
      data: {
        packingOperator: lineageDetails.packingOperator,
        packingFoilLot: lineageDetails.packingFoilLot,
        status: selectedOrder.status,
      },
      position: { x: 680, y: centerY },
    });

    // 4. Transport & Storage in Stage 4 (centered)
    list.push({
      id: 'logistics',
      type: 'logistics',
      data: {
        coreInternalTemp: lineageDetails.coreInternalTemp,
        warehouseBay: lineageDetails.warehouseBay,
        dispatchTruckLicense: lineageDetails.dispatchTruckLicense,
      },
      position: { x: 1000, y: centerY },
    });

    return list;
  }, [materials, lineageDetails, selectedOrder]);

  // Generate custom edges connecting sequential stages
  const initialEdges = useMemo(() => {
    const list: any[] = [];

    // Edges from individual Raw Materials -> Mixing
    materials.forEach((m) => {
      list.push({
        id: `e-${m.id}-mixing`,
        source: m.id,
        target: 'mixing',
        animated: true,
        style: { stroke: '#a94228', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a94228',
          width: 15,
          height: 15,
        },
      });
    });

    // Edge from Mixing -> Packing Station
    list.push({
      id: 'e-mixing-packing',
      source: 'mixing',
      target: 'packing',
      animated: true,
      style: { stroke: '#b58c4f', strokeWidth: 2.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#b58c4f',
        width: 15,
        height: 15,
      },
    });

    // Edge from Packing Station -> Storage / Outbound Logistics
    list.push({
      id: 'e-packing-logistics',
      source: 'packing',
      target: 'logistics',
      animated: true,
      style: { stroke: '#657f4d', strokeWidth: 2.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#657f4d',
        width: 15,
        height: 15,
      },
    });

    return list;
  }, [materials]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state if selected order changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive Path Selector Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-[#212c46] text-white text-[9px] font-black uppercase rounded tracking-wider">
            Interactive Genealogy Map
          </div>
          <span className="text-[10.5px] text-slate-500 font-bold">
            แผนผังโครงสร้างห่วงโซ่อุปทานย้อนกลับแบบไดนามิกแบบเวกเตอร์ ซูม/ลากโหนดเพื่อระบุสายตรวจสอบ
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest font-mono">
            REACT-FLOW INTERACTIVE ENGINE
          </span>
        </div>
      </div>

      {/* REACT FLOW CANVAS COMPONENT DESIGNED FOR MAXIMUM ACCESSIBILITY */}
      <div 
        style={{ width: "100%", height: "550px" }} 
        className="relative bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden select-none"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={true}
          nodesFocusable={true}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          panOnScroll={true}
        >
          <Background color="#cbd5e1" gap={18} size={1} />
          <Controls className="!bg-white !border-slate-200 !shadow-md !rounded-lg" />
          <MiniMap 
            className="!border-slate-200 !bg-white !shadow-md !rounded-lg hidden md:block"
            nodeColor={(node) => {
              if (node.type === 'rawMaterial') return '#a94228';
              if (node.type === 'mixing') return '#b58c4f';
              if (node.type === 'packing') return '#212c46';
              return '#657f4d';
            }}
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
          />
        </ReactFlow>
      </div>
    </div>
  );
}
