"""
WELLSYNC — PYTHON SCADA TELEMETRY INGESTION & STREAMING SCRIPT
Field: ONGC Baghewala Heavy Oil Field (Block RJ-ON-90/1, Rajasthan)

This Python script demonstrates how real SCADA sensor data, edge IoT devices,
or physical multiphysics models stream live data directly into the 
PostgreSQL + TimescaleDB hypertable (`well_telemetry`).
"""

import time
import math
import random
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import execute_values

# ------------------------------------------------------------------------------
# 1. DATABASE CONNECTION PARAMETERS (Matches dbConfig.ts & .env)
# ------------------------------------------------------------------------------
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "wellsync_db",
    "user": "postgres",
    "password": "postgres"  # Change to your actual PostgreSQL password
}

def get_db_connection():
    """Establish connection to PostgreSQL + TimescaleDB instance."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"[-] Database connection failed: {e}")
        print("    Ensure PostgreSQL/TimescaleDB is running on localhost:5432")
        return None

# ------------------------------------------------------------------------------
# 2. PETROLEUM SENSOR TELEMETRY GENERATOR / SCADA INGESTION
# ------------------------------------------------------------------------------
def generate_scada_reading(well_id="BW-07", step=0):
    """
    Simulates real-time sensor streams from downhole gauges & surface SRP unit.
    Replace this with your real CSV read, Modbus TCP, or MQTT broker payload.
    """
    wave = math.sin(step * 0.2)
    
    # 1. Reservoir & Fluid
    pore_pressure = round(152.0 - (step * 0.01) % 2.0 + wave * 0.4, 2)
    bottomhole_pressure = round(98.4 + wave * 1.2, 2)
    drawdown = round(pore_pressure - bottomhole_pressure, 2)
    reservoir_temp = round(78.5 + (wave * 0.5), 1)
    crude_viscosity = round(32.4 + (math.cos(step * 0.1) * 1.8), 1)
    water_cut = round(28.4 + random.uniform(-0.3, 0.3), 1)
    gor = round(312.0 + wave * 8, 1)

    # 2. Wellbore Hydraulics
    thp = round(148.5 - (wave * 1.5), 1)
    chp = round(91.2 + (wave * 0.8), 1)
    fluid_level = round(1248 + wave * 12, 1)

    # 3. Artificial Lift (SRP)
    spm = 5.8
    pump_fillage = round(84.0 + wave * 3.5, 1)
    pprl = round(18200 + wave * 450, 0)
    mprl = round(7100 - wave * 250, 0)
    motor_kw = round(16.2 + wave * 0.8, 1)
    efficiency = round(78.5 + wave * 2.0, 1)
    condition = "Fluid Pound" if pump_fillage < 70 else "Normal Full Fillage"

    # 4. Surface Production
    gross_rate = round(48.2 + wave * 1.5, 1)
    oil_rate = round(gross_rate * (1 - water_cut / 100), 1)
    gas_rate = round((oil_rate * gor) / 1000, 2)

    return (
        datetime.now(timezone.utc),
        well_id,
        pore_pressure,
        bottomhole_pressure,
        drawdown,
        reservoir_temp,
        crude_viscosity,
        gor,
        water_cut,
        thp,
        chp,
        fluid_level,
        spm,
        pump_fillage,
        pprl,
        mprl,
        motor_kw,
        efficiency,
        condition,
        gross_rate,
        oil_rate,
        gas_rate,
        285.0,  # steam_temp_c
        18.4,   # steam_zone_radius_m
        0.43,   # cumulative_osr
        "Python SCADA Streamer",
        f"Real-time sensor ingest packet #{step}"
    )

# ------------------------------------------------------------------------------
# 3. CONTINUOUS INGESTION LOOP INTO TIMESCALEDB HYPERTABLE
# ------------------------------------------------------------------------------
INSERT_QUERY = """
INSERT INTO well_telemetry (
    time, well_id, pore_pressure_bar, bottomhole_flowing_pressure_bar,
    drawdown_bar, reservoir_temp_c, crude_viscosity_cp, gas_oil_ratio_scf_bbl,
    water_cut_pct, tubing_head_pressure_bar, casing_head_pressure_bar,
    dynamic_fluid_level_m, pump_speed_spm, pump_fillage_pct,
    peak_polished_rod_load_lbs, min_polished_rod_load_lbs, motor_power_kw,
    srp_efficiency_pct, dynacard_condition, gross_rate_bbld, oil_rate_bbld,
    gas_rate_mscfd, steam_temp_c, steam_zone_radius_m, cumulative_osr,
    trigger_source, delta_note
) VALUES %s;
"""

def start_streaming(target_well="BW-07", interval_seconds=2):
    """Streams data into PostgreSQL TimescaleDB hypertable continuously."""
    conn = get_db_connection()
    if not conn:
        return

    cur = conn.cursor()
    print(f"[+] Connected to TimescaleDB (wellsync_db). Streaming for {target_well} every {interval_seconds}s...")
    step = 0

    try:
        while True:
            step += 1
            reading = generate_scada_reading(target_well, step)
            
            execute_values(cur, INSERT_QUERY, [reading])
            conn.commit()

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Pushed telemetry packet #{step} -> {target_well} | Temp: {reading[5]}°C | Visco: {reading[6]} cP | THP: {reading[9]} bar | SPM: {reading[12]}")
            time.sleep(interval_seconds)

    except KeyboardInterrupt:
        print("\n[!] Streaming stopped by user.")
    finally:
        cur.close()
        conn.close()
        print("[+] Database connection closed cleanly.")

if __name__ == "__main__":
    # Run the streamer for active well BW-07
    start_streaming(target_well="BW-07", interval_seconds=2)
