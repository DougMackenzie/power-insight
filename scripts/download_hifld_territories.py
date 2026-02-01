#!/usr/bin/env python3
"""
Download and process HIFLD Electric Retail Service Territories.

This script:
1. Queries the HIFLD ArcGIS Feature Service for utility territories
2. Filters to only utilities in our tariff database
3. Simplifies geometries to reduce file size
4. Outputs a GeoJSON file for use in the web app
"""

import json
import urllib.request
import urllib.parse
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.validation import make_valid

# ArcGIS Feature Service endpoint
HIFLD_SERVICE = "https://services3.arcgis.com/OYP7N6mAJJCyH6hd/arcgis/rest/services/Electric_Retail_Service_Territories_HIFLD/FeatureServer/0/query"

# Mapping from tariff database utility names to HIFLD NAME patterns
# Format: 'tariff_db_name': ['HIFLD_pattern1', 'HIFLD_pattern2', ...]
UTILITY_NAME_MAPPING = {
    'TVA': ['TENNESSEE VALLEY AUTHORITY'],
    'Public Service Company of Oklahoma (PSO)': ['PUBLIC SERVICE CO OF OKLAHOMA'],
    'Nebraska Public Power District': ['NEBRASKA PUBLIC POWER DISTRICT'],
    'Dominion Energy Virginia': ['DOMINION ENERGY VIRGINIA', 'VIRGINIA ELECTRIC & POWER CO'],
    'OPPD (Omaha Public Power)': ['OMAHA PUBLIC POWER DISTRICT'],
    'MidAmerican Energy': ['MIDAMERICAN ENERGY'],
    'Oklahoma Gas & Electric (OG&E)': ['OKLAHOMA GAS & ELECTRIC'],
    'Black Hills Energy (WY)': ['BLACK HILLS POWER'],  # Black Hills serves WY from SD headquarters
    'DTE Energy': ['DTE ELECTRIC COMPANY'],
    'Black Hills Energy (SD)': ['BLACK HILLS POWER', 'BLACK HILLS ELECTRIC'],  # Will filter by state
    'ERCOT Market (via REP)': [],  # Special case - use Texas boundary
    'SWEPCO (AEP)': ['SOUTHWESTERN ELECTRIC POWER CO'],
    'Duke Energy Carolinas': ['DUKE ENERGY CAROLINAS'],
    'Evergy (Kansas/Missouri)': ['EVERGY METRO', 'EVERGY KANSAS'],
    'NorthWestern Energy (SD)': ['NORTHWESTERN ENERGY'],  # Filter by state
    'CenterPoint Energy Houston': ['CENTERPOINT ENERGY'],
    'Oncor Electric Delivery': ['ONCOR ELECTRIC DELIVERY'],
    'Entergy Arkansas': ['ENTERGY ARKANSAS'],
    'Entergy Mississippi': ['ENTERGY MISSISSIPPI'],
    'Georgia Power': ['GEORGIA POWER CO'],
    'Ameren Missouri': ['AMEREN MISSOURI', 'UNION ELECTRIC'],
    'NorthWestern Energy (MT)': ['NORTHWESTERN ENERGY'],  # Filter by state
    'Otter Tail Power': ['OTTER TAIL POWER'],
    'AEP Ohio': ['AEP OHIO', 'OHIO POWER CO'],
    'PPL Electric': ['PPL ELECTRIC UTILITIES'],
    'Entergy Texas': ['ENTERGY TEXAS'],
    'Entergy Louisiana': ['ENTERGY LOUISIANA'],
    'Public Service Company of New Mexico (PNM)': ['PUBLIC SERVICE CO OF NM'],
    'Alliant Energy (WPL)': ['WISCONSIN POWER & LIGHT'],
    'BGE (Baltimore Gas & Electric)': ['BALTIMORE GAS & ELECTRIC'],
    'FirstEnergy (Ohio Edison)': ['OHIO EDISON'],
    'Consumers Energy': ['CONSUMERS ENERGY'],
    'Xcel Energy (MN)': ['NORTHERN STATES POWER CO - MINNESOTA', 'NORTHERN STATES POWER CO (MN)'],
    'Alabama Power': ['ALABAMA POWER CO'],
    'CPS Energy (San Antonio)': ['CITY PUBLIC SERVICE', 'CPS ENERGY', 'CITY OF SAN ANTONIO'],
    'FirstEnergy (Penelec)': ['PENNSYLVANIA ELECTRIC'],
    'El Paso Electric': ['EL PASO ELECTRIC'],
    'Duke Energy Ohio': ['DUKE ENERGY OHIO'],
    'Southwestern Public Service (Xcel)': ['SOUTHWESTERN PUBLIC SERVICE'],
    'Duke Energy Indiana': ['DUKE ENERGY INDIANA'],
    'Empire District Electric': ['EMPIRE DISTRICT ELECTRIC'],
    'Entergy New Orleans': ['ENTERGY NEW ORLEANS'],
    # PNM Resources is same as Public Service Company of New Mexico - remove duplicate
    'Duke Energy Florida': ['DUKE ENERGY FLORIDA'],
    'Arizona Public Service (APS)': ['ARIZONA PUBLIC SERVICE'],
    'FirstEnergy (Met-Ed)': ['METROPOLITAN EDISON'],
    'Mississippi Power': ['MISSISSIPPI POWER CO'],
    'Idaho Power': ['IDAHO POWER CO'],
    'AEP Indiana Michigan Power': ['INDIANA MICHIGAN POWER'],
    'Avista Utilities': ['AVISTA CORP'],
    'JEA': ['JEA'],
    'Atlantic City Electric': ['ATLANTIC CITY ELECTRIC'],
    'Tampa Electric (TECO)': ['TAMPA ELECTRIC CO'],
    'Duke Energy Kentucky': ['DUKE ENERGY KENTUCKY'],
    'Rocky Mountain Power (PacifiCorp)': ['PACIFICORP', 'ROCKY MOUNTAIN POWER'],
    'AEP Kentucky Power': ['KENTUCKY POWER'],
    'NOVEC': ['NORTHERN VIRGINIA ELEC', 'NOVEC'],
    'Xcel Energy (CO)': ['PUBLIC SERVICE CO OF COLORADO'],
    'Santee Cooper': ['SANTEE COOPER', 'SOUTH CAROLINA PUBLIC SERVICE AUTHORITY'],
    'Austin Energy': ['AUSTIN ENERGY'],
    'FirstEnergy (JCP&L)': ['JERSEY CENTRAL POWER'],
    'Tucson Electric Power': ['TUCSON ELECTRIC POWER'],
    'PECO Energy': ['PECO ENERGY'],
    'NV Energy': ['NEVADA POWER CO', 'SIERRA PACIFIC POWER CO'],
    'Delmarva Power': ['DELMARVA POWER'],
    'PSEG': ['PUBLIC SERVICE ELEC & GAS CO'],
    'AEP Appalachian Power': ['APPALACHIAN POWER'],
    # Gulf Power merged into FPL in 2021, no longer separate utility
    'LG&E/KU (PPL)': ['LOUISVILLE GAS & ELECTRIC', 'KENTUCKY UTILITIES'],
    'Salt River Project (SRP)': ['SALT RIVER PROJECT'],
    'Pepco (MD/DC)': ['POTOMAC ELECTRIC POWER'],
    'Portland General Electric': ['PORTLAND GENERAL ELECTRIC'],
    'Puget Sound Energy': ['PUGET SOUND ENERGY'],
    'ComEd (Exelon)': ['COMMONWEALTH EDISON'],
    'SMUD': ['SACRAMENTO MUNICIPAL UTIL'],
    'National Grid (NY)': ['NIAGARA MOHAWK POWER'],
    'LADWP': ['LOS ANGELES DEPARTMENT OF WATER'],
    'We Energies': ['WISCONSIN ELECTRIC POWER'],
    'National Grid (RI)': ['NARRAGANSETT ELECTRIC'],
    'Eversource (CT)': ['CONNECTICUT LIGHT', 'EVERSOURCE'],
    'National Grid (MA)': ['MASSACHUSETTS ELECTRIC'],
    'United Illuminating': ['UNITED ILLUMINATING'],
    'Florida Power & Light (FPL)': ['FLORIDA POWER & LIGHT'],
    'San Diego Gas & Electric (SDG&E)': ['SAN DIEGO GAS & ELECTRIC'],
    'Eversource (MA)': ['NSTAR ELECTRIC'],
    'Southern California Edison (SCE)': ['SOUTHERN CALIFORNIA EDISON'],
    'ConEdison': ['CONSOLIDATED EDISON'],
    'Pacific Gas & Electric (PG&E)': ['PACIFIC GAS & ELECTRIC'],
}

# State filters for utilities with same name in multiple states
STATE_FILTERS = {
    'Black Hills Energy (WY)': ['WY', 'SD'],  # Serves WY from SD
    'Black Hills Energy (SD)': ['SD'],
    'NorthWestern Energy (SD)': ['SD'],
    'NorthWestern Energy (MT)': ['MT'],
    'CenterPoint Energy Houston': ['TX'],  # Filter to TX only
    'Eversource (CT)': ['CT'],  # Filter to CT
}

def build_where_clauses(batch_size=10):
    """Build SQL WHERE clauses in batches to avoid URL length limits."""
    all_patterns = []
    for tariff_name, hifld_patterns in UTILITY_NAME_MAPPING.items():
        for pattern in hifld_patterns:
            # Escape single quotes
            escaped = pattern.replace("'", "''")
            all_patterns.append(f"UPPER(NAME) LIKE '%{escaped}%'")

    # Split into batches
    batches = []
    for i in range(0, len(all_patterns), batch_size):
        batch = all_patterns[i:i + batch_size]
        batches.append(" OR ".join(batch))

    return batches

def query_hifld(where_clause, offset=0, limit=1000):
    """Query the HIFLD Feature Service."""
    params = {
        'where': where_clause,
        'outFields': 'NAME,STATE,ID',
        'returnGeometry': 'true',
        'outSR': '4326',
        'f': 'geojson',
        'resultRecordCount': str(limit),
        'resultOffset': str(offset),
    }

    url = f"{HIFLD_SERVICE}?{urllib.parse.urlencode(params)}"
    print(f"Querying: offset={offset}")

    with urllib.request.urlopen(url, timeout=120) as response:
        return json.loads(response.read().decode('utf-8'))

def simplify_geometry(geometry, tolerance=0.005, min_area=0.001):
    """
    Use Shapely for proper topology-preserving simplification.

    Args:
        geometry: GeoJSON geometry dict
        tolerance: Simplification tolerance in degrees (~0.005 = ~500m)
        min_area: Minimum polygon area in square degrees to keep (~0.0001 = ~1 sq km)

    Returns:
        Simplified GeoJSON geometry dict, or None if invalid
    """
    if geometry is None:
        return None

    try:
        from shapely.geometry import MultiPolygon, Polygon

        # Convert GeoJSON to Shapely geometry
        geom = shape(geometry)

        # Fix any invalid geometry first
        if not geom.is_valid:
            geom = make_valid(geom)

        # Simplify with topology preservation (Douglas-Peucker algorithm)
        simplified = geom.simplify(tolerance, preserve_topology=True)

        # Skip empty results
        if simplified.is_empty:
            print(f"  Warning: Geometry simplified to empty")
            return None

        # Filter out tiny polygons from MultiPolygon
        if simplified.geom_type == 'MultiPolygon':
            # Keep only polygons with area >= min_area
            large_polys = [p for p in simplified.geoms if p.area >= min_area]
            if not large_polys:
                print(f"  Warning: All polygons filtered out (too small)")
                return None
            if len(large_polys) == 1:
                simplified = large_polys[0]
            else:
                simplified = MultiPolygon(large_polys)
        elif simplified.geom_type == 'Polygon':
            if simplified.area < min_area:
                print(f"  Warning: Polygon too small (area={simplified.area:.6f})")
                return None

        # Convert back to GeoJSON and round coordinates to 4 decimal places
        result = mapping(simplified)

        # Round coordinates to reduce file size
        def round_coords(coords):
            if isinstance(coords[0], (int, float)):
                return [round(coords[0], 4), round(coords[1], 4)]
            return [round_coords(c) for c in coords]

        result['coordinates'] = round_coords(result['coordinates'])
        return result

    except Exception as e:
        print(f"  Warning: Could not simplify geometry: {e}")
        return geometry  # Return original if simplification fails

def match_utility(feature, tariff_name):
    """Check if a HIFLD feature matches a tariff utility."""
    hifld_name = feature['properties'].get('NAME', '').upper()
    hifld_state = feature['properties'].get('STATE', '')

    patterns = UTILITY_NAME_MAPPING.get(tariff_name, [])
    state_filter = STATE_FILTERS.get(tariff_name)

    for pattern in patterns:
        if pattern.upper() in hifld_name:
            # Check state filter if applicable
            if state_filter and hifld_state not in state_filter:
                continue
            return True

    return False

def calculate_area(geometry):
    """Approximate area calculation for sorting (not geodetically accurate, but good enough for ordering)."""
    def get_bounds(coords):
        min_lon, max_lon = float('inf'), float('-inf')
        min_lat, max_lat = float('inf'), float('-inf')

        if isinstance(coords[0], (int, float)):
            return coords[0], coords[0], coords[1], coords[1]

        for c in coords:
            c_min_lon, c_max_lon, c_min_lat, c_max_lat = get_bounds(c)
            min_lon = min(min_lon, c_min_lon)
            max_lon = max(max_lon, c_max_lon)
            min_lat = min(min_lat, c_min_lat)
            max_lat = max(max_lat, c_max_lat)

        return min_lon, max_lon, min_lat, max_lat

    min_lon, max_lon, min_lat, max_lat = get_bounds(geometry['coordinates'])
    return (max_lon - min_lon) * (max_lat - min_lat)

def process_features(features):
    """Process and tag features with tariff IDs."""
    processed = []
    matched_tariffs = set()

    for feature in features:
        hifld_name = feature['properties'].get('NAME', '').upper()

        # Find matching tariff utility
        for tariff_name in UTILITY_NAME_MAPPING.keys():
            if match_utility(feature, tariff_name):
                # Add tariff_name to properties
                feature['properties']['tariff_utility'] = tariff_name

                # Simplify geometry
                feature['geometry'] = simplify_geometry(feature['geometry'])

                processed.append(feature)
                matched_tariffs.add(tariff_name)
                break

    # Sort by area (largest first) so smaller utilities render on top
    processed.sort(key=lambda f: calculate_area(f['geometry']), reverse=True)

    return processed, matched_tariffs

def main():
    # Build queries in batches
    where_clauses = build_where_clauses(batch_size=15)
    print(f"Split into {len(where_clauses)} query batches")

    # Query all matching features
    all_features = []

    for batch_idx, where_clause in enumerate(where_clauses):
        print(f"\nBatch {batch_idx + 1}/{len(where_clauses)} (clause length: {len(where_clause)} chars)")
        offset = 0

        while True:
            try:
                result = query_hifld(where_clause, offset)
                features = result.get('features', [])

                if not features:
                    break

                all_features.extend(features)
                print(f"  Retrieved {len(features)} features, total: {len(all_features)}")

                if len(features) < 1000:
                    break

                offset += 1000
            except Exception as e:
                print(f"  Error: {e}")
                break

    print(f"\nTotal features retrieved: {len(all_features)}")

    # Process and tag features
    processed, matched = process_features(all_features)

    print(f"Processed features: {len(processed)}")
    print(f"Matched tariff utilities: {len(matched)}")

    # Report unmatched utilities
    unmatched = set(UTILITY_NAME_MAPPING.keys()) - matched
    if unmatched:
        print(f"\nUnmatched utilities ({len(unmatched)}):")
        for u in sorted(unmatched):
            print(f"  - {u}")

    # Create output GeoJSON
    output = {
        'type': 'FeatureCollection',
        'features': processed,
        'metadata': {
            'source': 'HIFLD Electric Retail Service Territories',
            'processed_date': '2026-02-01',
            'utility_count': len(matched),
        }
    }

    # Write output
    output_path = Path(__file__).parent.parent / 'nextjs-app' / 'public' / 'geojson' / 'utility_territories.geojson'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(output, f)

    print(f"\nOutput written to: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    main()
