# WellSync · Real-Time Petroleum Reservoir & Wellbore Digital Twin

> **ONGC Rajasthan Asset · Block RJ-ON-90/1 (Bikaner-Nagaur Basin)**  
> High-fidelity coupled multiphysics Digital Twin with autonomous AI operational advisory, real-time SCADA telemetry streaming, and thermal EOR modeling.

---

## 🌟 Key Features & Digital Twin Modules

### 1. 🛢️ Multiphysics Reservoir & Wellbore Cockpit (`Twin Schematic`)
- **End-to-End Vertical Hydraulic Column**: Surface walking beam unit (SRP) $\rightarrow$ Wellhead Christmas tree $\rightarrow$ Tubing & Casing annulus with dynamic liquid level $\rightarrow$ Sucker rod string $\rightarrow$ Subsurface pump barrel $\rightarrow$ Perforations $\rightarrow$ Jodhpur Sandstone payzone.
- **Continuous Live Telemetry Stream**: Real-time Pore Pressure ($P_{res}$), Bottomhole Flowing Pressure ($P_{wf}$), Dynamic Fluid Level, Tubing Head Pressure (THP), and Casing Head Pressure (CHP).
- **Vogel's IPR Drawdown Modeling**: Real-time calculation of inflow performance and maximum safe drawdown limits before gas breakout.

### 2. ⚡ Sucker Rod Pump (SRP) Artificial Lift Lab (`SRP Dynacard`)
- **Live Reciprocating Dynacard Plot**: Real-time Surface Polished Rod Load (SPRL) vs Downhole Pump Barrel Load plotted against stroke displacement.
- **Autonomous Anomaly Detection**: Detects **Fluid Pound**, **Gas Interference**, and **Traveling Valve Leaks**.
- **Interactive VFD Speed Controller**: Adjust pumping speed (3.5 – 9.0 SPM) in real time and observe immediate dynacard recovery.

### 3. ♨️ Cyclic Steam Stimulation (CSS) Thermal EOR Twin (`CSS Thermal EOR`)
- **Radial Thermal Heat Front ($R_{th}$)**: Concentric thermal diffusion chamber model mapping heat propagation into the heavy oil formation.
- **Andrade-Eyring Viscosity Decay**: Visualizes the exponential viscosity reduction of 17° API heavy crude from native 145 cP down to 28 cP.
- **Steam Injection Controls**: Live slider controls for steam generator temperature (240–320°C), injection rate (80–240 t/d), and Oil-to-Steam Ratio (OSR).

### 4. 🤖 AI Operational Advisory Copilot (`AI Copilot`)
- **Live Operational Suggestions**:
  - **Optimal SRP Pumping Speed**: Advises the exact SPM to eliminate fluid pound and safeguard the rod string.
  - **Optimal CSS Steam Temperature**: Recommends steam injection temperature and rate based on formation viscosity.
  - **Casing & Choke Pressure Advice**: Recommends choke sizes to maintain a 90–92 bar gas cushion.
- **One-Click Actions**: Apply recommended SPM speeds directly into the running digital twin simulation.
- **Integrated Intelligence**: Powered by high-speed neural reasoning models with automated physics surrogate fallbacks.

### 5. 🚢 Multi-Well Fleet Overview (`Well Fleet`)
- Comparative fleet monitoring across ONGC Baghewala wells: **BW-01**, **BW-04**, **BW-07**, and **BW-12**.
- Instant 1-click active well switcher syncing the entire digital twin state.

### 6. 📊 Shift Surveillance Dossier (`Surveillance Log`)
- Automated daily engineering shift log in DGH/ONGC compliance format.
- Telemetry variance audit, mechanical health breakdown, and 1-click Markdown copy / print export.

---

## 🎨 Design Philosophy: macOS Lucid Dark
- Frosted acrylic glassmorphism (`backdrop-filter: blur(24px)`).
- macOS Traffic Light window controls (🔴 🟡 🟢).
- Icon-free minimalist typography using **Plus Jakarta Sans** and **JetBrains Mono**.
- Zero stark white elements — deep space graphite theme (`#080c15`).

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

Application runs by default on: **`http://localhost:5174/`**
