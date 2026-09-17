-- ============================================================================
-- PETROTWIN AI — POSTGRESQL + TIMESCALEDB TIME-SERIES HYPERTABLE SCHEMA
-- Field: Baghewala Heavy Oil Field (ONGC Rajasthan Asset, Block RJ-ON-90/1)
-- ============================================================================

-- 1. Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Wells Master Table (Dimension Table)
CREATE TABLE IF NOT EXISTS wells (
    well_id VARCHAR(16) PRIMARY KEY,
    well_name VARCHAR(64) NOT NULL,
    field_name VARCHAR(64) DEFAULT 'Baghewala Heavy Oil Field',
    block_name VARCHAR(64) DEFAULT 'ONGC Block RJ-ON-90/1',
    basin_name VARCHAR(64) DEFAULT 'Bikaner-Nagaur Basin',
    status VARCHAR(32) NOT NULL CHECK (status IN ('Producing', 'Optimization Alert', 'Steam Soaking', 'Shut-in / Workover')),
    lift_method VARCHAR(32) DEFAULT 'SRP (Sucker Rod Pump)',
    target_depth_m NUMERIC(7,2) NOT NULL,
    reservoir_temp_c NUMERIC(5,2) NOT NULL,
    crude_gravity_api VARCHAR(32) DEFAULT '17.2° API (Extra Heavy)',
    baseline_viscosity_cp NUMERIC(7,2) NOT NULL,
    target_rate_bbld NUMERIC(7,2) DEFAULT 40.0,
    css_cycle INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telemetry Time-Series Hypertable (Fact Table)
-- Partitioned automatically by time into chunks (e.g. 1-day chunks)
CREATE TABLE IF NOT EXISTS well_telemetry (
    time TIMESTAMPTZ NOT NULL,
    well_id VARCHAR(16) NOT NULL REFERENCES wells(well_id),
    
    -- Reservoir & Formation Physics
    pore_pressure_bar NUMERIC(6,2) NOT NULL,
    bottomhole_flowing_pressure_bar NUMERIC(6,2) NOT NULL,
    drawdown_bar NUMERIC(6,2) NOT NULL,
    reservoir_temp_c NUMERIC(5,2) NOT NULL,
    crude_viscosity_cp NUMERIC(7,2) NOT NULL,
    gas_oil_ratio_scf_bbl NUMERIC(7,1) NOT NULL,
    water_cut_pct NUMERIC(5,2) NOT NULL,

    -- Wellbore Hydraulics
    tubing_head_pressure_bar NUMERIC(6,2) NOT NULL,
    casing_head_pressure_bar NUMERIC(6,2) NOT NULL,
    dynamic_fluid_level_m NUMERIC(7,2) NOT NULL,

    -- Artificial Lift (SRP)
    pump_speed_spm NUMERIC(4,1) NOT NULL,
    pump_fillage_pct NUMERIC(5,2) NOT NULL,
    peak_polished_rod_load_lbs NUMERIC(8,1) NOT NULL,
    min_polished_rod_load_lbs NUMERIC(8,1) NOT NULL,
    motor_power_kw NUMERIC(6,2) NOT NULL,
    srp_efficiency_pct NUMERIC(5,2) NOT NULL,
    dynacard_condition VARCHAR(32) NOT NULL,

    -- Surface Production
    gross_rate_bbld NUMERIC(7,2) NOT NULL,
    oil_rate_bbld NUMERIC(7,2) NOT NULL,
    gas_rate_mscfd NUMERIC(7,2) NOT NULL,

    -- Thermal EOR (CSS)
    steam_temp_c NUMERIC(5,2) DEFAULT 285.0,
    steam_zone_radius_m NUMERIC(5,2) DEFAULT 18.4,
    cumulative_osr NUMERIC(5,2) DEFAULT 0.43,

    -- Audit & Operational Context
    trigger_source VARCHAR(64) DEFAULT 'SCADA Stream',
    delta_note TEXT
);

-- 4. Convert to TimescaleDB Hypertable
SELECT create_hypertable(
    'well_telemetry',
    'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- 5. Create Compound Indices for Fast Temporal Lookups by Well
CREATE INDEX IF NOT EXISTS idx_well_telemetry_well_time 
ON well_telemetry (well_id, time DESC);

-- 6. TimescaleDB Continuous Aggregate for 1-Minute Downsampling
CREATE MATERIALIZED VIEW IF NOT EXISTS well_telemetry_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    well_id,
    AVG(reservoir_temp_c) AS avg_temp_c,
    AVG(crude_viscosity_cp) AS avg_viscosity_cp,
    AVG(tubing_head_pressure_bar) AS avg_pressure_bar,
    AVG(pump_speed_spm) AS avg_spm,
    AVG(dynamic_fluid_level_m) AS avg_fluid_level_m,
    AVG(oil_rate_bbld) AS avg_oil_rate_bbld,
    MAX(peak_polished_rod_load_lbs) AS max_rod_load_lbs
FROM well_telemetry
GROUP BY bucket, well_id
WITH NO DATA;

-- 7. Automated Continuous Aggregate Refresh Policy
SELECT add_continuous_aggregate_policy('well_telemetry_1min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- 8. Compression Policy (compress chunks older than 7 days)
ALTER TABLE well_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'well_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('well_telemetry', INTERVAL '7 days', if_not_exists => TRUE);
