"""
WELLSYNC — AUTOMATIC PETROLEUM TELEMETRY DATA GENERATOR & STREAMER (PYTHON)
Field: ONGC Baghewala Heavy Oil Field (Rajasthan Basin, Block RJ-ON-90/1)

Features:
1. Automatic Real-Time Streaming: Continuously generates sensor readings every N seconds.
2. Batch Generation: Generates N records instantly for testing or analysis.
3. Zero External Dependencies: Saves automatically to CSV ('wellsync_telemetry.csv') 
   and JSON ('wellsync_records.json') out-of-the-box.
4. Optional Database Sync: If PostgreSQL / TimescaleDB is running, pushes to hypertable.
"""

import sys
import os
import time
import math
import random
import json
import csv
from datetime import datetime, timezone
import argparse

# Ensure safe encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


# Output file destinations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "wellsync_telemetry.csv")
JSON_FILE = os.path.join(BASE_DIR, "wellsync_records.json")

# Database Connection (Optional)
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "wellsync_db",
    "user": "postgres",
    "password": "postgres"
}

def get_db_connection():
    """Attempts PostgreSQL connection if psycopg2 is installed."""
    try:
        import psycopg2
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception:
        return None

CSV_HEADERS = [
    "time", "well_id", "pore_pressure_bar", "flowing_bhp_bar", "drawdown_bar",
    "reservoir_temp_c", "crude_viscosity_cp", "gas_oil_ratio_scf_bbl", "water_cut_pct",
    "tubing_pressure_bar", "casing_pressure_bar", "fluid_level_m", "pump_speed_spm",
    "pump_fillage_pct", "peak_rod_load_lbs", "motor_power_kw", "dynacard_condition",
    "oil_rate_bbld", "gas_rate_mscfd", "steam_temp_c", "trigger_source", "delta_note"
]

def init_csv_file():
    """Ensures CSV file exists with proper header row."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)

def generate_telemetry_packet(well_id="BW-07", step=0):
    """
    Simulates physics-grounded telemetry for heavy oil reservoir with SRP & CSS.
    """
    now = datetime.now(timezone.utc)
    time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    wave = math.sin(step * 0.25)
    noise = random.uniform(-0.15, 0.15)

    # 1. Reservoir
    pore_press = round(152.0 - (step * 0.005) % 1.5 + wave * 0.35, 2)
    flowing_bhp = round(98.4 + wave * 1.1 + noise, 2)
    drawdown = round(pore_press - flowing_bhp, 2)
    res_temp = round(78.5 + wave * 0.4, 1)
    viscosity = round(32.4 + math.cos(step * 0.1) * 1.6 + noise, 1)
    water_cut = round(28.4 + noise * 0.5, 1)
    gor = round(312.0 + wave * 6, 1)

    # 2. Wellbore Hydraulics
    thp = round(148.5 - wave * 1.2, 1)
    chp = round(91.2 + wave * 0.6, 1)
    fluid_level = round(1248 + wave * 10, 1)

    # 3. Artificial Lift (SRP)
    spm = 5.8
    pump_fillage = round(84.0 + wave * 2.8, 1)
    condition = "Fluid Pound" if pump_fillage < 70 else "Normal Full Fillage"
    pprl = round(18200 + wave * 380, 0)
    motor_kw = round(16.2 + wave * 0.6, 1)

    # 4. Surface Production
    gross_rate = round(48.2 + wave * 1.2, 1)
    oil_rate = round(gross_rate * (1 - water_cut / 100), 1)
    gas_rate = round((oil_rate * gor) / 1000, 2)
    steam_temp = 285.0

    trigger = "Python Auto-Streamer"
    note = f"Synthetic SCADA packet #{step}"

    record_dict = {
        "time": time_str,
        "well_id": well_id,
        "pore_pressure_bar": pore_press,
        "flowing_bhp_bar": flowing_bhp,
        "drawdown_bar": drawdown,
        "reservoir_temp_c": res_temp,
        "crude_viscosity_cp": viscosity,
        "gas_oil_ratio_scf_bbl": gor,
        "water_cut_pct": water_cut,
        "tubing_pressure_bar": thp,
        "casing_pressure_bar": chp,
        "fluid_level_m": fluid_level,
        "pump_speed_spm": spm,
        "pump_fillage_pct": pump_fillage,
        "peak_rod_load_lbs": pprl,
        "motor_power_kw": motor_kw,
        "dynacard_condition": condition,
        "oil_rate_bbld": oil_rate,
        "gas_rate_mscfd": gas_rate,
        "steam_temp_c": steam_temp,
        "trigger_source": trigger,
        "delta_note": note
    }

    record_row = [
        time_str, well_id, pore_press, flowing_bhp, drawdown, res_temp,
        viscosity, gor, water_cut, thp, chp, fluid_level, spm,
        pump_fillage, pprl, motor_kw, condition, oil_rate, gas_rate,
        steam_temp, trigger, note
    ]

    return record_dict, record_row

def save_to_local_files(record_dict, record_row):
    """Appends record to local CSV and updates JSON file."""
    init_csv_file()
    
    # Append to CSV
    with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(record_row)

    # Append to JSON (keep latest 100)
    existing = []
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing.insert(0, record_dict)
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(existing[:200], f, indent=2)

def run_streaming(well_id="BW-07", interval=2, max_packets=None):
    """Continuously generates data packets at interval."""
    print("=" * 70)
    print("WELLSYNC PYTHON TELEMETRY GENERATOR")
    print(f"  * Target Well: {well_id}")
    print(f"  * Interval:    {interval}s")
    print(f"  * Output CSV:  {CSV_FILE}")
    print(f"  * Output JSON: {JSON_FILE}")
    print("=" * 70)

    db_conn = get_db_connection()
    if db_conn:
        print("[+] Connected to PostgreSQL / TimescaleDB hypertable!")
    else:
        print("[*] Standalone Mode Active (Data auto-saved to CSV & JSON files).")
    print("-" * 70)

    step = 0
    try:
        while True:
            step += 1
            rec_dict, rec_row = generate_telemetry_packet(well_id=well_id, step=step)
            save_to_local_files(rec_dict, rec_row)

            # Optional DB write
            if db_conn:
                try:
                    with db_conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO well_telemetry (
                                time, well_id, reservoir_temp_c, tubing_head_pressure_bar,
                                pump_speed_spm, crude_viscosity_cp, dynamic_fluid_level_m,
                                oil_rate_bbld, pore_pressure_bar, trigger_source, delta_note
                            ) VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, (
                            well_id, rec_dict["reservoir_temp_c"], rec_dict["tubing_pressure_bar"],
                            rec_dict["pump_speed_spm"], rec_dict["crude_viscosity_cp"],
                            rec_dict["fluid_level_m"], rec_dict["oil_rate_bbld"],
                            rec_dict["pore_pressure_bar"], rec_dict["trigger_source"],
                            rec_dict["delta_note"]
                        ))
                        db_conn.commit()
                except Exception as e:
                    print(f"[DB Warning] Insert failed: {e}")

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Packet #{step:03d} -> {well_id} | Temp: {rec_dict['reservoir_temp_c']}C | Visc: {rec_dict['crude_viscosity_cp']} cP | THP: {rec_dict['tubing_pressure_bar']} bar | Oil: {rec_dict['oil_rate_bbld']} bbl/d | [SAVED]")

            if max_packets and step >= max_packets:
                print(f"\n[OK] Generated {max_packets} packets successfully.")
                break

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n\n[!] Streamer paused by user. All generated records are safely saved.")
    finally:
        if db_conn:
            db_conn.close()

def generate_batch(count=50, well_id="BW-07"):
    """Generates a batch of N records instantly."""
    print(f"[*] Generating batch of {count} records for {well_id}...")
    init_csv_file()
    for i in range(1, count + 1):
        rec_dict, rec_row = generate_telemetry_packet(well_id=well_id, step=i)
        save_to_local_files(rec_dict, rec_row)
    print(f"[OK] Successfully generated {count} records!")
    print(f"  - Saved to CSV:  {CSV_FILE}")
    print(f"  - Saved to JSON: {JSON_FILE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WellSync Python Telemetry Generator")
    parser.add_argument("--mode", choices=["stream", "batch"], default="stream", help="Run mode: 'stream' (continuous) or 'batch' (instant)")
    parser.add_argument("--well", default="BW-07", help="Well identifier (e.g. BW-07, BW-14)")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval in seconds between packets (for stream mode)")
    parser.add_argument("--count", type=int, default=50, help="Number of records to generate (for batch mode)")
    args = parser.parse_args()

    if args.mode == "batch":
        generate_batch(count=args.count, well_id=args.well)
    else:
        run_streaming(well_id=args.well, interval=args.interval)
