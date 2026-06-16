import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Activity, Shield, Battery, RefreshCw, Cpu, Info, Zap, HardDrive, Settings, Search, CheckCircle, Flame, Truck, AlertTriangle
} from 'lucide-react';

// Insert Google Fonts for JetBrains Mono & Inter + custom Scanline/Oscilloscope animation styles
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: #0A0F1E;
      color: #FFFFFF;
      overflow-x: hidden;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace !important;
    }

    /* Oscilloscope Grid Background */
    .oscilloscope-bg {
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(0, 212, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 212, 255, 0.04) 1px, transparent 1px);
    }

    /* Scanline Overlay Effect */
    .scanline-container {
      position: relative;
    }
    .scanline-container::after {
      content: " ";
      display: block;
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      aspect-ratio: auto;
      background-size: 100% 4px, 6px 100%;
      pointer-events: none;
      z-index: 10;
      opacity: 0.3;
    }

    /* Oscilloscope glow effects */
    .glow-cyan {
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 0 0 2px rgba(0, 212, 255, 0.3);
    }
    
    .glow-green {
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
    }

    .glow-amber {
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.8);
    }

    .glow-red {
      text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
    }

    /* Custom Scrollbar for Sleek instrument Panels */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #090E1A;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #1E3A5F;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #00D4FF;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}} />
);

// 18 Simulated Batteries to fulfill SQS Multi-EV Fleet Specification (B0005 - B0018 Range)
const MOCK_BATTERIES = [
  { id: "EV_B0005_001", vehicle: "VH_TESLA_042", nominalCapacity: 2000, currentCapacity: 1648, baseCycle: 147, chemistry: "Li-Ion (NMC)", manufactureDate: "2023-04-12", status: "healthy", owner: "Delhi Cargo Hub" },
  { id: "EV_B0006_002", vehicle: "VH_BYD_089", nominalCapacity: 2200, currentCapacity: 1716, baseCycle: 182, chemistry: "Li-Ion (LFP)", manufactureDate: "2023-01-18", status: "healthy", owner: "Mumbai Fleet Base" },
  { id: "EV_B0007_003", vehicle: "VH_TESLA_112", nominalCapacity: 2000, currentCapacity: 1282, baseCycle: 310, chemistry: "Li-Ion (NMC)", manufactureDate: "2022-09-05", status: "warning", owner: "Bangalore Logistics" },
  { id: "EV_B0018_004", vehicle: "VH_TATA_005", nominalCapacity: 2400, currentCapacity: 1392, baseCycle: 420, chemistry: "Li-Ion (LFP)", manufactureDate: "2021-11-22", status: "critical", owner: "Pune Intercity" },
  { id: "EV_B0005_005", vehicle: "VH_TESLA_013", nominalCapacity: 2000, currentCapacity: 1810, baseCycle: 45, chemistry: "Li-Ion (NMC)", manufactureDate: "2024-02-10", status: "healthy", owner: "Delhi Cargo Hub" },
  { id: "EV_B0006_006", vehicle: "VH_BYD_102", nominalCapacity: 2200, currentCapacity: 1980, baseCycle: 62, chemistry: "Li-Ion (LFP)", manufactureDate: "2023-11-01", status: "healthy", owner: "Mumbai Fleet Base" },
  { id: "EV_B0007_007", vehicle: "VH_TATA_088", nominalCapacity: 2000, currentCapacity: 1590, baseCycle: 195, chemistry: "Li-Ion (NMC)", manufactureDate: "2023-03-15", status: "healthy", owner: "Kolkata Delivery" },
  { id: "EV_B0018_008", vehicle: "VH_MAHIND_02", nominalCapacity: 2400, currentCapacity: 1910, baseCycle: 120, chemistry: "Li-Ion (LFP)", manufactureDate: "2023-07-29", status: "healthy", owner: "Hyderabad Express" },
  { id: "EV_B0005_009", vehicle: "VH_TESLA_201", nominalCapacity: 2000, currentCapacity: 1430, baseCycle: 280, chemistry: "Li-Ion (NMC)", manufactureDate: "2022-05-14", status: "warning", owner: "Delhi Cargo Hub" },
  { id: "EV_B0006_010", vehicle: "VH_BYD_199", nominalCapacity: 2200, currentCapacity: 1510, baseCycle: 290, chemistry: "Li-Ion (LFP)", manufactureDate: "2022-08-11", status: "warning", owner: "Chennai Logistics" },
  { id: "EV_B0007_011", vehicle: "VH_TATA_145", nominalCapacity: 2000, currentCapacity: 1110, baseCycle: 480, chemistry: "Li-Ion (NMC)", manufactureDate: "2021-02-04", status: "critical", owner: "Kolkata Delivery" },
  { id: "EV_B0018_012", vehicle: "VH_MAHIND_44", nominalCapacity: 2400, currentCapacity: 1310, baseCycle: 512, chemistry: "Li-Ion (LFP)", manufactureDate: "2021-05-19", status: "critical", owner: "Ahmedabad Transit" },
  { id: "EV_B0005_013", vehicle: "VH_TESLA_199", nominalCapacity: 2000, currentCapacity: 1720, baseCycle: 90, chemistry: "Li-Ion (NMC)", manufactureDate: "2023-09-01", status: "healthy", owner: "Gurgaon Line" },
  { id: "EV_B0006_014", vehicle: "VH_BYD_250", nominalCapacity: 2200, currentCapacity: 1690, baseCycle: 155, chemistry: "Li-Ion (LFP)", manufactureDate: "2023-05-20", status: "healthy", owner: "Mumbai Fleet Base" },
  { id: "EV_B0007_015", vehicle: "VH_TATA_211", nominalCapacity: 2000, currentCapacity: 1612, baseCycle: 135, chemistry: "Li-Ion (NMC)", manufactureDate: "2023-06-11", status: "healthy", owner: "Kolkata Delivery" },
  { id: "EV_B0018_016", vehicle: "VH_MAHIND_71", nominalCapacity: 2400, currentCapacity: 2150, baseCycle: 50, chemistry: "Li-Ion (LFP)", manufactureDate: "2024-01-20", status: "healthy", owner: "Ahmedabad Transit" },
  { id: "EV_B0005_017", vehicle: "VH_TESLA_333", nominalCapacity: 2000, currentCapacity: 1580, baseCycle: 220, chemistry: "Li-Ion (NMC)", manufactureDate: "2022-12-01", status: "healthy", owner: "Delhi Cargo Hub" },
  { id: "EV_B0006_018", vehicle: "VH_BYD_404", nominalCapacity: 2200, currentCapacity: 1490, baseCycle: 260, chemistry: "Li-Ion (LFP)", manufactureDate: "2022-11-15", status: "warning", owner: "Mumbai Fleet Base" }
];

export default function App() {
  const [selectedBatteryId, setSelectedBatteryId] = useState("EV_B0005_001");
  const [userRole, setUserRole] = useState("fleet_admin"); // fleet_admin or operator
  const [isPlaying, setIsPlaying] = useState(true);
  const [scenario, setScenario] = useState("normal_degradation"); // normal_degradation, rapid_fault, thermal_runaway
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [searchTerm, setSearchTerm] = useState("");
  const [telemetryHistory, setTelemetryHistory] = useState({});
  const [isSecondLifeModalOpen, setIsSecondLifeModalOpen] = useState(false);
  const [customJwtInput, setCustomJwtInput] = useState("");
  const [isJwtDecoded, setIsJwtDecoded] = useState(false);

  // Connection states
  const [connectionStatus, setConnectionStatus] = useState("LIVE"); // LIVE (SSE), POLLING (fallback), OFFLINE

  // Find active battery stats
  const activeBattery = useMemo(() => {
    return MOCK_BATTERIES.find(b => b.id === selectedBatteryId) || MOCK_BATTERIES[0];
  }, [selectedBatteryId]);

  // Handle live data generation simulating SQS and TimescaleDB intake pipeline
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(100, 1000 / replaySpeed);
    const interval = setInterval(() => {
      setTelemetryHistory(prev => {
        const nextState = { ...prev };
        MOCK_BATTERIES.forEach(bat => {
          if (!nextState[bat.id]) {
            // Seed base historical points for smooth initial look (approx. 30 cycles back)
            nextState[bat.id] = Array.from({ length: 30 }).map((_, i) => {
              const cycle = bat.baseCycle - 30 + i;
              const degradationFactor = 1 - (cycle * 0.0004);
              const capacity = bat.nominalCapacity * degradationFactor;
              const soh = (capacity / bat.nominalCapacity) * 100;
              return {
                cycle,
                voltage_v: (3.7 + Math.random() * 0.35).toFixed(4),
                current_a: (1.5 - Math.random() * 3.0).toFixed(4),
                temperature_c: (25 + Math.random() * 5).toFixed(2),
                capacity_mah: capacity.toFixed(1),
                soh_percent: soh.toFixed(2),
                recorded_at: new Date(Date.now() - (30 - i) * 60000).toISOString()
              };
            });
          }

          // Add a new raw real-time streaming reading
          const currentArray = nextState[bat.id];
          const lastReading = currentArray[currentArray.length - 1];
          const nextCycle = lastReading.cycle + 1;

          // Adjust dynamics based on selected operational scenario
          let scenarioTempMultiplier = 1.0;
          let scenarioVDropMultiplier = 1.0;
          let scenarioSoHDegradationMultiplier = 1.0;

          if (scenario === "rapid_fault" && bat.id === selectedBatteryId) {
            scenarioTempMultiplier = 1.3;
            scenarioVDropMultiplier = 0.9;
            scenarioSoHDegradationMultiplier = 4.5;
          } else if (scenario === "thermal_runaway" && bat.id === selectedBatteryId) {
            scenarioTempMultiplier = 2.4;
            scenarioVDropMultiplier = 0.78;
            scenarioSoHDegradationMultiplier = 15.0;
          }

          const currentCap = parseFloat(lastReading.capacity_mah) - (0.15 * scenarioSoHDegradationMultiplier * (1 + Math.random() * 0.5));
          const calculatedSoH = (currentCap / bat.nominalCapacity) * 100;

          // Push the newest calculated telemetry entry
          const newReading = {
            cycle: nextCycle,
            voltage_v: ((3.82 - (nextCycle * 0.0001) + (Math.random() * 0.1 - 0.05)) * scenarioVDropMultiplier).toFixed(4),
            current_a: (-1.98 + (Math.random() * 0.4 - 0.2)).toFixed(4),
            temperature_c: ((24.5 + (nextCycle * 0.01) + (Math.random() * 1.5 - 0.75)) * scenarioTempMultiplier).toFixed(2),
            capacity_mah: currentCap.toFixed(1),
            soh_percent: Math.max(0, calculatedSoH).toFixed(2),
            recorded_at: new Date().toISOString()
          };

          // Limit length to keep memory bounds tidy (sliding window of 40 points)
          const updated = [...currentArray.slice(1), newReading];
          nextState[bat.id] = updated;
        });
        return nextState;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, replaySpeed, scenario, selectedBatteryId]);

  // Calculate current dynamic metrics derived from history
  const activeHistory = telemetryHistory[selectedBatteryId] || [];
  const currentReading = activeHistory[activeHistory.length - 1] || {
    voltage_v: "3.8124",
    current_a: "-1.9987",
    temperature_c: "24.50",
    soh_percent: "82.40",
    capacity_mah: "1648.0",
    cycle: activeBattery.baseCycle
  };

  const sohVal = parseFloat(currentReading.soh_percent);

  // Dynamic status check
  const dynamicStatus = useMemo(() => {
    if (sohVal < 60 || parseFloat(currentReading.temperature_c) > 65) return "critical";
    if (sohVal < 75 || parseFloat(currentReading.temperature_c) > 42) return "warning";
    return "healthy";
  }, [sohVal, currentReading.temperature_c]);

  // AI-Derived Predictions representing ML Data Ka Pandit's PyTorch LSTM Inference outputs
  const lstmPredictions = useMemo(() => {
    // Standard cell EOL (End Of Life) standard threshold is defined as SoH < 70%
    const eolThreshold = 70.0;
    const currentSoh = parseFloat(currentReading.soh_percent);
    
    // Extrapolate cycles remaining till 70% SoH
    const cyclesRan = currentReading.cycle;
    const rateOfDecline = (100 - currentSoh) / Math.max(1, cyclesRan);
    
    let basePredictedRul = 0;
    if (currentSoh > eolThreshold) {
      basePredictedRul = Math.max(10, Math.round((currentSoh - eolThreshold) / (rateOfDecline || 0.05)));
    }

    // LSTM inference adjustments under uncertainty quantification calculations
    const rmseDev = Math.round(9.5 * (1 + (cyclesRan * 0.001)));
    const lowerBound = Math.max(0, basePredictedRul - rmseDev);
    const upperBound = basePredictedRul + rmseDev;

    return {
      predictedRul: basePredictedRul,
      lowerBound,
      upperBound,
      confidencePercent: 90,
      modelVersion: "v2.0-LSTM"
    };
  }, [currentReading]);

  // Second Life Decision Support Matrix (Based on SoH and Cycle life profiles)
  const secondLifeRecommendation = useMemo(() => {
    const soh = parseFloat(currentReading.soh_percent);
    
    if (soh >= 80.0) {
      return {
        tier: "Tier 1: High Capacity Electric Mobility",
        suitability: "90% - 100% (Optimal)",
        application: "Heavy-Duty Cargo Fleet, Public Transit, EV Pooling",
        engineeringInsight: "Minimal internal resistance degradation ($R_{int} < 0.022\\Omega$). Dynamic load capability is outstanding. Highly stable for continuous mobility environments.",
        icon: Truck,
        color: "#10B981"
      };
    } else if (soh >= 70.0 && soh < 80.0) {
      return {
        tier: "Tier 2: Stationary Grid ESS & Peak Shaving",
        suitability: "70% - 85% (Recommended for Transition)",
        application: "Telecom Backup Power, Solar Micro-grids, Station Buffer Charging",
        engineeringInsight: "The cell capacity is below nominal automotive density but has huge static utility ($C/5$ rates). Excellent choice for stationary grid-connected systems.",
        icon: HardDrive,
        color: "#F59E0B"
      };
    } else if (soh >= 60.0 && soh < 70.0) {
      return {
        tier: "Tier 3: Low-Demand Static Applications",
        suitability: "60% - 70% (Secondary Grade Support Only)",
        application: "Residential Powerwalls, Rural Pumps, Emergency Static UPS Units",
        engineeringInsight: "Degraded capacity retention. Best used in low-demand setups with slower charge cycles and proactive, integrated BMS monitoring loops.",
        icon: Zap,
        color: "#EF4444"
      };
    } else {
      return {
        tier: "Tier 4: Material Extraction & Reprocessing",
        suitability: "0% - 59% (End of Life - Safe Disposal)",
        application: "Raw Nickel, Cobalt, Lithium, and Manganese Extraction",
        engineeringInsight: "State of Health is below safe operational deployment parameters. Safe recycling processing is strongly advised to retrieve precious transition metals.",
        icon: Flame,
        color: "#EF4444"
      };
    }
  }, [currentReading.soh_percent]);

  // Simulate SQS Ingestion manual event firing
  const handleIngestTrigger = () => {
    setConnectionStatus("LIVE");
  };

  // JWT Claim parser mockup to prove Role-Based Access controls
  const handleJwtVerify = (e) => {
    e.preventDefault();
    if (!customJwtInput) return;
    try {
      if (customJwtInput.toLowerCase().includes("operator")) {
        setUserRole("operator");
        setIsJwtDecoded(true);
      } else if (customJwtInput.toLowerCase().includes("admin") || customJwtInput.toLowerCase().includes("fleet_admin")) {
        setUserRole("fleet_admin");
        setIsJwtDecoded(true);
      } else {
        setUserRole("fleet_admin");
        setIsJwtDecoded(true);
      }
    } catch (err) {
      setIsJwtDecoded(false);
    }
  };

  // Filter batteries based on search box input
  const filteredBatteries = MOCK_BATTERIES.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans relative select-none bg-[#0A0F1E]">
      <CustomStyles />

      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-[#0A0F1E] h-16 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-wider text-slate-100 flex items-center gap-2 uppercase">
              Hinglish Squad EV Battery Diagnostics <span className="text-[10px] bg-cyan-950/60 px-2 py-0.5 rounded text-cyan-400 font-mono border border-cyan-800/80">v2.0-AWS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">CLOUD-NATIVE REALTIME TELEMETRY INTAKE CORE</p>
          </div>
        </div>

        {/* SIMULATION CONTROLLER AND SCENARIO INJECTORS */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-md px-3 py-1 text-xs">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
            <span className="text-[10px] uppercase text-slate-500 font-mono font-bold">Scenario:</span>
            <select 
              value={scenario} 
              onChange={(e) => setScenario(e.target.value)}
              className="bg-[#0A0F1E] border border-slate-800 text-cyan-400 text-[11px] rounded px-2.5 py-0.5 font-mono focus:outline-none cursor-pointer"
            >
              <option className="bg-[#111827] text-white" value="normal_degradation">Normal Cycle Ops</option>
              <option className="bg-[#111827] text-white" value="rapid_fault">Accelerated Heat Stress</option>
              <option className="bg-[#111827] text-white" value="thermal_runaway">Simulated Thermal Runaway</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2 py-1 rounded font-mono text-[10px] uppercase font-bold transition-all border ${isPlaying ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-green-500/20 text-green-400 border-green-500/40'}`}
            >
              {isPlaying ? 'PAUSE LIVE FEED' : 'RESUME SIMULATION'}
            </button>
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Speed:</span>
              {[1, 2, 5, 10].map(speed => (
                <button
                  key={speed}
                  onClick={() => setReplaySpeed(speed)}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] transition-all ${replaySpeed === speed ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONNECTION & AUTH SECTION */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connectionStatus === 'LIVE' ? 'bg-emerald-400' : 'bg-amber-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[11px] text-slate-300 font-bold">{connectionStatus}{" ENGINE"}</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800"></div>

          {/* Role Claim Indicator */}
          <div className="flex items-center gap-2 bg-[#111827] border border-slate-800 px-3 py-1.5 rounded-md">
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                setIsJwtDecoded(false); // Reset custom JWT on manual toggle
              }}
              style={{ color: '#FFFFFF' }}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option className="bg-[#111827]" value="fleet_admin">Admin (All Analytics)</option>
              <option className="bg-[#111827]" value="operator">Operator (Read-Only Telemetry)</option>
            </select>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* REDESIGNED HIGH-VISIBILITY LEFT SIDEBAR (Telemetry Instrument Rack) */}
        <aside className="w-80 md:w-[350px] border-r border-slate-800 bg-[#111827] flex flex-col shrink-0 z-10 shadow-xl shadow-black/40">
          
          {/* SEARCH & SYSTEM INDEXING HEADER */}
          <div className="p-4 border-b border-slate-800 bg-[#151D30] flex flex-col gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#00D4FF] glow-cyan pointer-events-none" />
              <input
                type="text"
                placeholder="Search Active Battery ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A0F1E] border border-slate-800 focus:border-[#00D4FF] rounded-md pl-12 pr-3 py-2.5 text-sm focus:outline-none text-white placeholder-slate-500 font-mono tracking-wider transition-all"
              />
            </div>
            
            <div className="flex items-center justify-between px-1 text-[11px] font-mono uppercase text-white tracking-widest font-semibold border-t border-slate-800/80 pt-2.5">
              <span>BATTERY NODE REGISTRY</span>
              <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/60 text-[10px] font-bold font-mono">
                {filteredBatteries.length} / 18 ONLINE
              </span>
            </div>
          </div>

          {/* SCROLLABLE LIVE BATTERY LIST IN HIGH-CONTRAST DATA LAYERS */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/80 bg-[#0A0F1E]/40">
            {filteredBatteries.map((bat) => {
              const hist = telemetryHistory[bat.id] || [];
              const lastVal = hist[hist.length - 1];
              const curSoh = lastVal ? parseFloat(lastVal.soh_percent) : 100.0;
              const curTemp = lastVal ? parseFloat(lastVal.temperature_c) : 25.0;

              // Derive status colors & visual LED state
              let statusText = "HEALTHY";
              let statusColorClass = "text-emerald-400 border-emerald-950 bg-emerald-950/40";
              let statusLedColor = "bg-emerald-500 shadow-[0_0_8px_#10B981]";

              if (curSoh < 60 || curTemp > 65) {
                statusText = "CRITICAL";
                statusColorClass = "text-rose-400 border-rose-950 bg-rose-950/40";
                statusLedColor = "bg-rose-500 shadow-[0_0_8px_#EF4444]";
              } else if (curSoh < 75 || curTemp > 42) {
                statusText = "WARNING";
                statusColorClass = "text-amber-400 border-amber-950 bg-amber-950/40";
                statusLedColor = "bg-amber-500 shadow-[0_0_8px_#F59E0B]";
              }

              const isSelected = bat.id === selectedBatteryId;

              return (
                <div
                  key={bat.id}
                  onClick={() => setSelectedBatteryId(bat.id)}
                  className={`relative p-4 cursor-pointer transition-all duration-150 flex flex-col gap-3 border-l-4 ${
                    isSelected 
                      ? 'bg-[#1E3A5F]/25 border-cyan-400 shadow-inner' 
                      : 'hover:bg-slate-900/40 bg-transparent border-transparent'
                  }`}
                >
                  {/* Top Row: LED Indicator, ID, and Class Status Badge */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusLedColor}`} />
                      <span className={`font-mono text-sm tracking-wider font-bold ${isSelected ? 'text-[#00D4FF] glow-cyan' : 'text-white'}`}>
                        {bat.id}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${statusColorClass}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Secondary Row: Chassis Reference & Active Cycle Count */}
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[11px] text-white font-semibold tracking-wide bg-[#151D30] px-2 py-0.5 rounded border border-slate-800">
                      {bat.vehicle}
                    </span>
                    <span className="text-[11px] text-white uppercase font-semibold">
                      Cycle <span className="text-[#00D4FF] font-bold">#{lastVal?.cycle || bat.baseCycle}</span>
                    </span>
                  </div>

                  {/* Progressive SOH Retention Indicator with Neon Tracking */}
                  <div className="space-y-1 bg-[#151D30]/30 p-2.5 rounded border border-slate-800/40">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-white uppercase font-bold tracking-wider">STATE OF HEALTH RETENTION</span>
                      <span className={`font-bold text-xs ${curSoh > 80 ? 'text-[#10B981] glow-green' : curSoh > 60 ? 'text-[#F59E0B] glow-amber' : 'text-[#EF4444] glow-red'}`}>
                        {curSoh.toFixed(2)}{"%"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#0A0F1E] rounded overflow-hidden border border-slate-800/80">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          curSoh > 80 ? 'bg-[#10B981]' : curSoh > 60 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                        }`}
                        style={{ width: `${curSoh}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Modular Instrumentation Spark Grid: Super High-Readability Numbers */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-[#090E1A] border border-slate-800 rounded font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-white block uppercase font-bold tracking-wider mb-0.5">V_SENS</span>
                      <span className="text-white font-bold font-mono text-[11px]">{lastVal?.voltage_v || '3.812'}{"V"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white block uppercase font-bold tracking-wider mb-0.5">T_CELL</span>
                      <span className={`font-bold font-mono text-[11px] ${curTemp > 50 ? 'text-[#EF4444]' : 'text-white'}`}>{curTemp.toFixed(1)}{"°C"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white block uppercase font-bold tracking-wider mb-0.5">FORMULA</span>
                      <span className="text-cyan-400 font-bold font-mono text-[11px] block truncate">{bat.chemistry.split(' ')[1] || 'Li'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SQS ENGINE STATUS ANCHOR */}
          <div className="p-4 border-t border-slate-800 bg-[#151D30] shrink-0">
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <Cpu className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              <div>
                <span className="text-[9px] block text-slate-500 tracking-widest font-bold">AWS SQS CONNECTION</span>
                <span className="text-emerald-400 text-[10px] font-bold tracking-wider">ONLINE @ 18 MSGS/SEC</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN DIAGNOSTIC DISPLAY CANVAS */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5 bg-[#0A0F1E] oscilloscope-bg">
          
          {/* HEADER DIAGNOSTICS CONTROL HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#111827] border border-slate-800/80 p-4 rounded-lg scanline-container">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#1E3A5F]/40 border border-[#1E3A5F]/80 rounded text-cyan-400 shadow-md">
                <Battery className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wider">{selectedBatteryId}</h2>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-mono font-medium">{activeBattery.chemistry}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>CHASSIS REF: <span className="text-slate-200">{activeBattery.vehicle}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>OWNER: <span className="text-slate-200">{activeBattery.owner}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>MFG DATE: <span className="text-slate-200">{activeBattery.manufactureDate}</span></span>
                </div>
              </div>
            </div>

            {/* Manual Ingestion Trigger simulating Cloud API SQS Gateway */}
            <div className="mt-4 md:mt-0 flex gap-2">
              <button 
                onClick={handleIngestTrigger}
                className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/80 text-[11px] text-cyan-400 border border-cyan-500/30 px-3.5 py-2 rounded font-mono flex items-center gap-2 tracking-wider uppercase transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Trigger SQS Ingest
              </button>
              <button 
                onClick={() => setIsSecondLifeModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded font-mono flex items-center gap-2 tracking-wider uppercase transition-colors"
              >
                <Info className="w-4 h-4" />
                Life Cycle Info
              </button>
            </div>
          </div>

          {/* TELEMETRY READOUT GRID */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* VOLTAGE INSTRUMENT */}
            <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-lg flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold font-mono tracking-wider">CELL VOLTAGE</span>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 rounded border border-cyan-900">V_SENS</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-[#00D4FF] glow-cyan tracking-tight">{currentReading.voltage_v}</span>
                <span className="text-xs text-slate-500 font-mono">{"V"}</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300" 
                  style={{ width: `${((parseFloat(currentReading.voltage_v) - 2.5) / 1.7) * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-slate-600 mt-2">SAFE WINDOW: 2.7V - 4.2V</span>
            </div>

            {/* TEMPERATURE INSTRUMENT */}
            <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-lg flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold font-mono tracking-wider">CELL TEMPERATURE</span>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-950/40 px-1.5 rounded border border-rose-900">TEMP_C</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-3xl font-bold font-mono tracking-tight ${
                  parseFloat(currentReading.temperature_c) > 65 ? 'text-rose-500 glow-red' : parseFloat(currentReading.temperature_c) > 42 ? 'text-amber-500 glow-amber' : 'text-slate-100'
                }`}>{currentReading.temperature_c}</span>
                <span className="text-xs text-slate-500 font-mono">{"°C"}</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    parseFloat(currentReading.temperature_c) > 65 ? 'bg-rose-500' : parseFloat(currentReading.temperature_c) > 42 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(100, (parseFloat(currentReading.temperature_c) / 100) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-slate-600 mt-2">CRITICAL SHUTDOWN @ 65°C</span>
            </div>

            {/* CAPACITY INSTRUMENT */}
            <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-lg flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold font-mono tracking-wider">CAPACITY RETENTION</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 rounded border border-emerald-900">CAP_MAH</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-emerald-400 glow-green tracking-tight">
                  {currentReading.capacity_mah}
                </span>
                <span className="text-xs text-slate-500 font-mono">{"mAh"}</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-300" 
                  style={{ width: `${(parseFloat(currentReading.capacity_mah) / activeBattery.nominalCapacity) * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-slate-600 mt-2">NOMINAL: {activeBattery.nominalCapacity}{" mAh"}</span>
            </div>

            {/* CURRENT INTENSITY INSTRUMENT */}
            <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-lg flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold font-mono tracking-wider">LOAD CURRENT</span>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 px-1.5 rounded border border-purple-900">CUR_AMP</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-purple-400 tracking-tight">{currentReading.current_a}</span>
                <span className="text-xs text-slate-500 font-mono">{"A"}</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300" 
                  style={{ width: `${Math.min(100, Math.abs(parseFloat(currentReading.current_a) / 5) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-slate-600 mt-2">DISCHARGE LIMIT: -3.0 A</span>
            </div>

          </section>

          {/* MAIN OSCILLOSCOPE TIME SERIES DIAGNOSTIC & LSTM PANEL CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* THE SIGNATURE CYAN OSCILLOSCOPE REALTIME CHART */}
            <div className="lg:col-span-2 bg-[#111827] border border-slate-800 p-5 rounded-lg scanline-container flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">REALTIME TELEMETRY STREAM</h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block"></span> {"Voltage (V)"}
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block ml-3"></span> {"SoH (%)"}
                </div>
              </div>

              {/* Graphical rendering */}
              <div className="h-72 md:h-80 w-full bg-[#050914] rounded-md border border-slate-800/80 pt-4 overflow-hidden relative">
                {/* Embedded dynamic coordinate background representation */}
                <div className="absolute inset-0 bg-[#060B18] oscilloscope-bg pointer-events-none z-0"></div>
                
                <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
                  <LineChart data={activeHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(0, 212, 255, 0.08)" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="cycle" 
                      stroke="#475569" 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      domain={[2.5, 4.5]} 
                      stroke="#475569"
                      tick={{ fill: '#00D4FF', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[50, 100]} 
                      stroke="#475569"
                      tick={{ fill: '#10B981', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E3A5F', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                      labelClassName="text-slate-400"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="voltage_v" 
                      stroke="#00D4FF" 
                      strokeWidth={2.2} 
                      dot={false}
                      activeDot={{ r: 5, stroke: '#00D4FF', strokeWidth: 1 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="soh_percent" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center mt-3.5 font-mono text-[10px] text-slate-500">
                <span>INDEX SCALE: CYCLE RESOLUTION</span>
                <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-900/60">
                  <HardDrive className="w-3.5 h-3.5" /> Hypertable compressed window: 7-day policy Active
                </span>
              </div>
            </div>

            {/* PREDICTIVE AI / LSTM INFERENCE BLOCK */}
            <div className="bg-[#111827] border border-slate-800 p-5 rounded-lg flex flex-col justify-between scanline-container">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">LSTM RUL PREDICTIONS</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900 uppercase">
                    {lstmPredictions.modelVersion}
                  </span>
                </div>

                {userRole === "fleet_admin" ? (
                  /* RUL VIEW FOR ADMIN */
                  <div className="space-y-4">
                    <div className="bg-[#0A0F1E] border border-slate-800 p-4 rounded-md flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wide">Forecasted Cycles Remaining</span>
                      <span className="text-4xl font-extrabold font-mono text-amber-500 glow-amber tracking-tight mt-2">
                        {lstmPredictions.predictedRul}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">cycles until EOL limit (70%)</span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">MC-Dropout Lower Bound</span>
                        <span className="text-slate-300 font-bold">{lstmPredictions.lowerBound}{" cycles"}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">MC-Dropout Upper Bound</span>
                        <span className="text-slate-300 font-bold">{lstmPredictions.upperBound}{" cycles"}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Confidence Interval Range</span>
                        <span className="text-cyan-400 font-bold">{lstmPredictions.confidencePercent}{"% band"}</span>
                      </div>
                    </div>

                    <div className="bg-[#1E3A5F]/20 border border-[#1E3A5F]/60 p-3 rounded-md text-[11px] font-mono leading-relaxed text-cyan-100">
                      <strong>AI DIAGNOSTIC SUMMARY:</strong>
                      {" The neural model calculates state degradation trajectory within acceptable $\pm15\%$ NASA ground-truth boundaries. Schedule next mechanical pack check at cycle #"}{currentReading.cycle + lstmPredictions.predictedRul - 20}{"."}
                    </div>
                  </div>
                ) : (
                  /* OPERATOR MOCKED OUT PREDICTIVE BLOCKED SCREEN */
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-md p-6 bg-[#0A0F1E]/50 my-6">
                    <Shield className="w-9 h-9 text-rose-500 animate-pulse mb-3" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">Access Restriction Claimed</span>
                    <p className="text-[10.5px] text-slate-400 font-mono text-center mt-2 leading-relaxed">
                      Predictive analytics are restricted to the <strong>fleet_admin</strong> claims authorization token. Change role in top navbar to authorize view.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-3.5 mt-4">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>LSTM ROOT MEAN SQ ERROR</span>
                  <span className="text-slate-300 font-bold">&lt; 10 CYCLES</span>
                </div>
              </div>
            </div>

          </div>

          {/* DYNAMIC SECOND LIFE RECOMMENDATION SYSTEM */}
          <section className="bg-[#111827] border border-slate-800 p-5 rounded-lg scanline-container">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-extrabold font-mono tracking-widest uppercase text-slate-200">
                  AUTOMATED SECOND-LIFE ENGINE & DISPOSITION SELECTOR
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700 uppercase">
                Acoustic Analysis Driven
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Metric dials */}
              <div className="lg:col-span-5 bg-[#0A0F1E] border border-slate-800/80 p-4 rounded-md flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">STATE OF HEALTH SNAPSHOT</span>
                    <span className="text-[10px] font-mono text-slate-500">Snapshot #{currentReading.cycle}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight glow-cyan">{sohVal.toFixed(2)}{"%"}</span>
                    <span className="text-xs text-slate-500 font-mono">SoH Ratio</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs border-t border-slate-900 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Battery Capacity:</span>
                    <span className="text-slate-200 font-bold">{currentReading.capacity_mah}{" mAh"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominal Design Capacity:</span>
                    <span className="text-slate-200">{activeBattery.nominalCapacity}{" mAh"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Run Cycles Accomplished:</span>
                    <span className="text-slate-200">{currentReading.cycle}{" Cycles"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-900 flex gap-2">
                  <div className="flex-1 bg-slate-900/60 border border-slate-800/80 px-2.5 py-2 rounded flex items-center gap-1.5 text-xs font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                    <div>
                      <span className="text-[8px] text-slate-500 block leading-none">EV RETAIN</span>
                      <span className="text-[10px] text-slate-200 font-bold font-mono">{"SOH > 80%"}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-900/60 border border-slate-800/80 px-2.5 py-2 rounded flex items-center gap-1.5 text-xs font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    <div>
                      <span className="text-[8px] text-slate-500 block leading-none">GRID STATIC</span>
                      <span className="text-[10px] text-slate-200 font-bold font-mono">{"SOH 70-80%"}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-900/60 border border-slate-800/80 px-2.5 py-2 rounded flex items-center gap-1.5 text-xs font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                    <div>
                      <span className="text-[8px] text-slate-500 block leading-none">RECYCLE</span>
                      <span className="text-[10px] text-slate-200 font-bold font-mono">{"SOH < 60%"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic recommendation card - Clean space wrapping with no overlaps */}
              <div className="lg:col-span-7 bg-[#1E3A5F]/20 border border-cyan-500/10 p-5 rounded-md flex flex-col justify-between relative min-h-[250px] overflow-hidden">
                {/* Low opacity background watermarked icon (placed cleanly and safely with lower opacity to prevent overlap clutter) */}
                <div className="absolute right-4 bottom-2 text-cyan-400/5 pointer-events-none z-0">
                  {React.createElement(secondLifeRecommendation.icon, { size: 96 })}
                </div>

                <div className="z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-cyan-400 font-mono tracking-widest block uppercase font-bold">RE-DEPLOYMENT STRATEGY DISPOSITION</span>
                      <h4 className="text-base font-bold text-slate-100 font-mono leading-tight">{secondLifeRecommendation.tier}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wide">SUITABILITY FACTOR</span>
                      <span className="text-slate-200 font-bold block text-sm mt-0.5" style={{ color: secondLifeRecommendation.color }}>
                        {secondLifeRecommendation.suitability}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wide">REC APPLICATION AREA</span>
                      <span className="text-slate-200 font-semibold block mt-0.5">{secondLifeRecommendation.application}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wide font-mono">ELECTROCHEMICAL INSIGHT & HEALTH REASONING</span>
                    <p className="text-slate-300 text-[11px] mt-1 font-mono leading-relaxed bg-[#0A0F1E]/60 p-3 rounded border border-slate-800/60 max-h-[100px] overflow-y-auto custom-scrollbar">
                      {secondLifeRecommendation.engineeringInsight}
                    </p>
                  </div>
                </div>

                {/* Handover notification CTA */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3.5 py-2.5 rounded border border-slate-800 z-10">
                  <span className="text-slate-300">Authorized Disposition Target Selected:</span>
                  <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1.5 rounded font-bold uppercase text-[10px] tracking-wider transition-colors shrink-0">
                    GENERATE TRANSFER MANIFEST
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SPRINT LOGS PANEL */}
          <section className="bg-[#111827] border border-slate-800 p-5 rounded-lg scanline-container">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200 mb-4 flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-cyan-400" /> 
              SQUAD INTEGRATION PLAYGROUND & ROLE-CLAIM VALIDATION
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Live JWT Claim Inserter Simulation tool */}
              <div className="bg-[#0A0F1E] border border-slate-800 p-4 rounded-md flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold mb-2">JWT CLAIMS INJECTOR (FASTAPI INTERFACE)</span>
                  <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed">
                    FastAPI backend secures endpoints with `python-jose` under RS256 claims verifying system. Inject simulated token keys here to lock/unlock views.
                  </p>
                </div>
                <form onSubmit={handleJwtVerify} className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={customJwtInput}
                      onChange={(e) => setCustomJwtInput(e.target.value)}
                      placeholder='e.g., {"role": "operator"} or {"role": "fleet_admin"}' 
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button 
                      type="submit" 
                      className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-2 rounded font-bold font-mono text-xs uppercase tracking-wide transition-colors"
                    >
                      Verify Token
                    </button>
                  </div>
                  {isJwtDecoded && (
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/60 p-2 rounded">
                      <CheckCircle className="w-4 h-4" /> Token authorized! Set role context to: <strong>{userRole}</strong>
                    </div>
                  )}
                </form>
              </div>

              {/* API Endpoints specifications */}
              <div className="bg-[#0A0F1E] border border-slate-800 p-4 rounded-md flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold mb-2.5">SYSTEM CONTRACT ENDPOINTS (SYSTEM KA SHAKTIMAN SPEC)</span>
                  <div className="space-y-2 font-mono text-[10.5px]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <span className="text-emerald-400 font-semibold">POST /api/v1/ingest</span>
                      <span className="text-slate-500">202 Status Accepted (SQS Target)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <span className="text-cyan-400 font-semibold">GET /api/v1/telemetry/{"{id}"}</span>
                      <span className="text-slate-500">Last readings (Cursor-based)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <span className="text-cyan-400 font-semibold">GET /api/v1/soh/{"{id}"}</span>
                      <span className="text-slate-500">Current snapshot averages</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-semibold">GET /api/v1/rul/{"{id}"}</span>
                      <span className="text-slate-500">LSTM predicted cycles response</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-600 mt-2.5 border-t border-slate-900 pt-2.5 flex justify-between items-center">
                  <span>SCHEMA SPEC VERSION: 2.0 (AWS FIFO Integration)</span>
                  <span className="text-cyan-500 cursor-pointer hover:underline" onClick={() => setIsSecondLifeModalOpen(true)}>Read Pipeline Docs</span>
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>

      {/* SECOND LIFE & LIFE CYCLE EXPLAINER MODAL DIALOG */}
      {isSecondLifeModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/85 flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-[#111827] border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0C111C]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  EV Battery Diagnostics & Second-Life Recommendation Framework
                </h3>
              </div>
              <button 
                onClick={() => setIsSecondLifeModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                [ESC/CLOSE]
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-300">
              <h4 className="text-cyan-400 text-xs font-bold uppercase tracking-wide">1. State of Health (SoH) Threshold Rules</h4>
              <p>
                The health status of each battery pack is calculated automatically upon every complete charge/discharge telemetry event as recorded in the TimescaleDB hypertable schema. 
              </p>
              <div className="my-3 py-2.5 bg-[#0A0F1E] rounded border border-slate-800 text-center text-cyan-400 font-mono text-[13px]">
                {"$$\\text{SoH (\\%) } = \\left( \\frac{Q_{\\text{measured}}}{Q_{\\text{nominal}}} \\right) \\times 100$$"}
              </div>
              <p>
                A decline in SoH is generally correlated to chemical degradation factors such as Solid Electrolyte Interphase (SEI) growth, lithium plating, and active material loss.
              </p>

              <h4 className="text-amber-500 text-xs font-bold uppercase tracking-wide">2. Remaining Useful Life (RUL) Forecasting</h4>
              <p>
                LSTM networks (Deep Learning model architecture managed by Data Ka Pandit) accept sequence windows of 50 features—including rolling voltage drop, temperature gradients, and internal resistance spikes—to predict the number of standard charge/discharge cycles until the battery hits the automotive End Of Life standard threshold of <strong>70% State of Health</strong>.
              </p>

              <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wide">3. Second-Life Trajectory Path Decisions</h4>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 text-slate-200">
                  <span className="font-semibold text-emerald-400">Class A (&gt;80% SoH):</span>
                  <span>Continued Automotive Traction Deployment</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 text-slate-200">
                  <span className="font-semibold text-amber-500">Class B (70% - 80% SoH):</span>
                  <span>Stationary Grid & Micro-Grid Peak Shaving Backup</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 text-slate-200">
                  <span className="font-semibold text-rose-400">Class C (60% - 70% SoH):</span>
                  <span>Residential Energy Powerwalls & Agricultural Pumps</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-semibold text-rose-600">Class D (&lt;60% SoH):</span>
                  <span>Direct Material Recovery & Reprocessing Recycling</span>
                </div>
              </div>

              <div className="bg-[#1E3A5F]/20 border border-[#1E3A5F] p-3 rounded text-[11px] text-cyan-100">
                <strong>Rangoli Designer Tip:</strong> This UI is completely prepared for live FastAPI server WebSocket/SSE integration. SQS multi-EV concurrent payloads mapped to standard payload specifications align smoothly without layout adjustments.
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0C111C] flex justify-end">
              <button 
                onClick={() => setIsSecondLifeModalOpen(false)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded font-bold font-mono text-xs uppercase"
              >
                Acknowledge & Return
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}