import subprocess
import pandas as pd
import json
import io
import os

def extract_access_direct(db_filename, output_json):
    # 1. Force the absolute path. 
    # This ensures mdb-export isn't looking in the wrong folder.
    base_dir = os.path.dirname(os.path.abspath(__file__))
    abs_db_path = os.path.join(base_dir, db_filename)
    
    if not os.path.exists(abs_db_path):
        print(f"CRITICAL: Python cannot find the file at {abs_db_path}")
        return

    tables = [
        "Abgaenge", "Ansprechpartner", "Ereignisse", "Funktionen", 
        "Kathegorieen", "Konfiguration", "Mitgliederdaten", "Noten", 
        "Noten_Liedart", "OBE_Online", "OversoA0", "OversoAN", 
        "Programm", "Sitzungen", "SitzungenArt", "SitzungTOP", "Vereinsgruppen"
    ]
    
    db_content = {}

    for table in tables:
        print(f"Extracting table: {table}...", end=" ")
        
        # 2. Use a list for arguments. This is safer on Linux.
        # We do NOT use shell=True here to avoid path mangling.
        try:
            result = subprocess.run(
                ['mdb-export', abs_db_path, table],
                capture_output=True,
                text=True,
                encoding='latin-1',
                check=True # This will raise an error if the command fails
            )
            
            # 3. Read the CSV data
            df = pd.read_csv(io.StringIO(result.stdout))
            db_content[table] = df.to_dict(orient='records')
            print("Done.")
            
        except subprocess.CalledProcessError as e:
            print(f"FAILED. Error: {e.stderr.strip()}")
        except Exception as e:
            print(f"Pandas Error: {e}")

    # 4. Save to JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(db_content, f, indent=4, default=str)
    
    print(f"\nFinal check: {output_json} has been written.")

# Make sure 'Weppersdorf.mdv' is in the SAME folder as this .py script
extract_access_direct("Weppersdorf_v09.mdv", "output.json")