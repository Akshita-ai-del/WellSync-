# PetroTwin AI — PostgreSQL + TimescaleDB Integration Guide

## 1. Overview (Database Architecture)
In the **Baghewala Heavy Oil Field** (ONGC Rajasthan), each well generates continuous multi-sensor telemetry (Temperature, Pressure, SPM, Viscosity, Dynamic Fluid Level, Flow Rates). 

To ensure **previous data is NEVER overwritten or lost**, we use **TimescaleDB** on top of **PostgreSQL**.
- **Hypertables**: Standard PostgreSQL tables transparently partitioned into chunks by timestamp (`INTERVAL '1 day'`).
- **Append-Only Time Series**: Every change (sensor reading, engineer knob tweak, or AI optimization) generates a new immutable row.
- **Continuous Aggregates**: Real-time rollups (e.g. 1-minute, 1-hour downsampling) using `time_bucket()`.
- **Compound Indexes**: Instant lookups by `(well_id, time DESC)`.

---

## 2. Schema Definition (`schema.sql`)
The complete schema is located in `src/database/schema.sql`:
1. `wells` — Dimension table storing master well metadata (52 wells total, 34 producing/soaking, 18 shut-in).
2. `well_telemetry` — Hypertable storing historical sensor readings.
3. `well_telemetry_1min` — Materialized view with TimescaleDB continuous aggregate downsampling.
4. Compression Policy — Chunks older than 7 days are automatically compressed using columnar compression.

---

## 3. Direct Dashboard Record Writing (No Need to Open pgAdmin / Database)
You can directly insert and modify records from the **Digital Twin Cockpit**:
1. Click **`+ Direct DB Record`** on the top action bar of the Cockpit.
2. Enter or adjust:
   - **Well ID**: Select from the 52 wells (e.g. `BW-07`, `BW-01`, `BW-14`).
   - **Reservoir Temperature (°C)**: E.g., `82.5` °C.
   - **Tubing Head Pressure (bar)**: E.g., `146.8` bar.
   - **SRP Speed (SPM)**: E.g., `6.4` SPM.
   - **Crude Viscosity (cP)**: E.g., `28.5` cP.
   - **Trigger / Reason**: E.g., `Steam cycle day 42 test injection`.
3. Click **"Commit Record to TimescaleDB"**:
   - The system automatically executes the `INSERT INTO well_telemetry (...)` SQL transaction.
   - The live cockpit gauges and schematic immediately update.
   - The record is appended to the **Time-Series Log** without deleting previous data.
   - Stored in persistent browser hypertable storage (`localStorage`).

---

## 4. How to Access and Query Previous Data (Point-in-Time Access)

### Option A: Via the Dashboard Cockpit (`📜 Time-Series Log`)
1. Click **`📜 Time-Series Log`** in the top bar.
2. A sliding drawer opens displaying every historical record with exact timestamps, temperatures, pressures, viscosity, and trigger notes.
3. Click **"Inspect / Load Point-in-Time"** on any past row:
   - Displays the complete parameters as they were at that exact moment.
   - Allows side-by-side comparison against current live state.
   - Option to "Apply / Replay State into Cockpit" to test how the digital twin behaves with past conditions.

### Option B: Via the "TimescaleDB Vault" Tab (Dedicated SQL Console)
1. Go to **TimescaleDB Vault** in the left sidebar.
2. Run SQL queries directly:
   ```sql
   -- View latest 20 telemetry records
   SELECT time, well_id, temp_c, pressure_bar, viscosity_cp, spm 
   FROM well_telemetry 
   WHERE well_id = 'BW-07' 
   ORDER BY time DESC 
   LIMIT 20;
   ```
   ```sql
   -- Downsample with TimescaleDB 1-minute time bucket
   SELECT 
     time_bucket('1 minute', time) AS bucket,
     AVG(temp_c) AS avg_temp,
     AVG(viscosity_cp) AS avg_viscosity,
     AVG(spm) AS avg_spm
   FROM well_telemetry
   GROUP BY bucket
   ORDER BY bucket DESC;
   ```
   ```sql
   -- Point-in-Time Query: Retrieve state at an exact previous timestamp
   SELECT * FROM well_telemetry 
   WHERE well_id = 'BW-07' AND time <= '11:30:00' 
   ORDER BY time DESC 
   LIMIT 1;
   ```

---

## 5. Production Setup (Running Real PostgreSQL + TimescaleDB Server)
If you wish to deploy this schema to an external Docker or cloud server:

```bash
# 1. Run TimescaleDB Docker container
docker run -d --name petrotwin-timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb-ha:pg16

# 2. Apply the schema
psql -h localhost -U postgres -d postgres -f src/database/schema.sql
```
