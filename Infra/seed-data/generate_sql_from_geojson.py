import json
import os
from statistics import mean

# --- Configuration ---
INPUT_GEOJSON_FILE = 'HangJeongDong.geojson'
# 수정: 출력 파일을 docker-compose가 사용하는 init 스크립트로 직접 지정합니다.
OUTPUT_SQL_FILE = os.path.join('..', 'mysql', 'init', '01-init.sql') 
# 추가: 원하는 지역(시/도)을 여기에 정의합니다.
TARGET_REGIONS = ['서울특별시', '경기도', '인천광역시']

def get_polygon_center(coordinates_list):
    """
    Calculates the center of a polygon or multipolygon by averaging its coordinates.
    This is a simplified approach and may not be perfectly accurate for complex shapes.
    """
    all_points = []
    
    # Handle both Polygon and MultiPolygon
    for polygon in coordinates_list:
        # If the polygon has holes, we only consider the outer boundary
        if isinstance(polygon[0][0], list):
             all_points.extend(polygon[0])
        else:
             all_points.extend(polygon)

    if not all_points:
        return 0, 0
    
    longitudes = [p[0] for p in all_points]
    latitudes = [p[1] for p in all_points]
    
    # Check for MultiPolygon case where coordinates might be nested one level deeper
    if isinstance(longitudes[0], list):
        longitudes = [item for sublist in longitudes for item in sublist]
        latitudes = [item for sublist in latitudes for item in sublist]

    return mean(latitudes), mean(longitudes)


def main():
    # --- File path setup ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_GEOJSON_FILE)
    output_path = os.path.join(script_dir, OUTPUT_SQL_FILE)

    # 수정: 출력 디렉토리가 없을 경우 생성합니다.
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # --- Check for input file ---
    if not os.path.exists(input_path):
        print(f"Error: '{INPUT_GEOJSON_FILE}' not found in '{script_dir}'.")
        print("Please download it from https://github.com/vuski/admdongkor and place it here.")
        return

    # --- Load GeoJSON data ---
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data['features'])} features from GeoJSON.")

    regions = {
        'CITY': {},
        'DISTRICT': {},
        'NEIGHBORHOOD': {}
    }

    # --- Process each feature (neighborhood level) ---
    # 수정: 지정된 지역의 데이터만 필터링합니다.
    filtered_features = [
        f for f in data['features']
        if f['properties'].get('adm_nm') and f['properties'].get('adm_nm').startswith(tuple(TARGET_REGIONS))
    ]
    
    print(f"Filtered down to {len(filtered_features)} features for the target regions: {', '.join(TARGET_REGIONS)}")

    for feature in filtered_features:
        props = feature['properties']
        full_name = props.get('adm_nm')
        
        if not full_name:
            continue

        parts = full_name.split(' ')
        if len(parts) < 2:
            continue

        # 1. City/Province
        city_name = parts[0]
        if city_name not in regions['CITY']:
            regions['CITY'][city_name] = {'children': set()}

        # 2. District
        district_name = parts[1]
        district_key = f"{city_name}_{district_name}"
        if district_key not in regions['DISTRICT']:
            regions['DISTRICT'][district_key] = {'parent': city_name, 'children': set()}
        regions['CITY'][city_name]['children'].add(district_key)

        # 3. Neighborhood (can be a single part or multiple)
        if len(parts) > 1:
            neighborhood_name = ' '.join(parts[2:]) if len(parts) > 2 else district_name
            lat, lon = get_polygon_center(feature['geometry']['coordinates'])
            neighborhood_key = f"{district_key}_{neighborhood_name}"
            if neighborhood_key not in regions['NEIGHBORHOOD']:
                 regions['NEIGHBORHOOD'][neighborhood_key] = {
                     'parent': district_key,
                     'lat': lat,
                     'lon': lon
                 }
            regions['DISTRICT'][district_key]['children'].add(neighborhood_key)

    print("Processed and structured all filtered regions.")

    # --- Calculate center points for districts and cities by averaging children ---
    for district_key, district_val in regions['DISTRICT'].items():
        child_lats = [regions['NEIGHBORHOOD'][n_key]['lat'] for n_key in district_val['children'] if n_key in regions['NEIGHBORHOOD']]
        child_lons = [regions['NEIGHBORHOOD'][n_key]['lon'] for n_key in district_val['children'] if n_key in regions['NEIGHBORHOOD']]
        if child_lats:
            district_val['lat'] = mean(child_lats)
            district_val['lon'] = mean(child_lons)

    for city_name, city_val in regions['CITY'].items():
        child_lats = [regions['DISTRICT'][d_key]['lat'] for d_key in city_val['children'] if d_key in regions['DISTRICT'] and 'lat' in regions['DISTRICT'][d_key]]
        child_lons = [regions['DISTRICT'][d_key]['lon'] for d_key in city_val['children'] if d_key in regions['DISTRICT'] and 'lon' in regions['DISTRICT'][d_key]]
        if child_lats:
            city_val['lat'] = mean(child_lats)
            city_val['lon'] = mean(child_lons)
    
    print("Calculated center coordinates for cities and districts.")

    # --- Generate SQL ---
    # 수정: 기존 테이블 삭제 및 재생성 구문을 파일 상단에 추가합니다.
    create_table_sql = """-- 개발 환경 초기화를 위해 기존 테이블이 있다면 삭제합니다.
DROP TABLE IF EXISTS `regions`;

-- `regions` 테이블을 생성합니다.
-- JPA 엔티티와 일관성을 맞추고, 데이터베이스 레벨에서 생성/수정 시간을 자동으로 기록하도록 설정합니다.
CREATE TABLE `regions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `parent_id` BIGINT,
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_parent_id` (`parent_id`) -- 추후 부모 ID 기반 검색 성능을 위해 인덱스를 추가합니다.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"""

    sql_statements = [
        create_table_sql,
        f"\n-- This data is based on https://github.com/vuski/admdongkor",
        f"-- Filtered for: {', '.join(TARGET_REGIONS)}",
        "START TRANSACTION;"
    ]
    name_to_id = {}
    current_id = 1

    # Insert Cities
    sql_statements.append("\n-- Inserting CITIES\n")
    for name, val in sorted(regions['CITY'].items()):
        if 'lat' in val:
            lat, lon = val['lat'], val['lon']
            sql = f"INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES ({current_id}, '{name}', 'CITY', NULL, {lat:.8f}, {lon:.8f});"
            sql_statements.append(sql)
            name_to_id[name] = current_id
            current_id += 1

    # Insert Districts
    sql_statements.append("\n-- Inserting DISTRICTS\n")
    for key, val in sorted(regions['DISTRICT'].items()):
        if 'lat' in val:
            name = key.split('_', 1)[1]
            parent_name = val['parent']
            parent_id = name_to_id.get(parent_name, 'NULL')
            lat, lon = val['lat'], val['lon']
            sql = f"INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES ({current_id}, '{name}', 'DISTRICT', {parent_id}, {lat:.8f}, {lon:.8f});"
            sql_statements.append(sql)
            name_to_id[key] = current_id
            current_id += 1

    # Insert Neighborhoods
    sql_statements.append("\n-- Inserting NEIGHBORHOODS\n")
    for key, val in sorted(regions['NEIGHBORHOOD'].items()):
        name = key.split('_', 2)[-1]
        parent_key = val['parent']
        parent_id = name_to_id.get(parent_key, 'NULL')
        lat, lon = val['lat'], val['lon']
        # Escape single quotes in names
        safe_name = name.replace("'", "''")
        sql = f"INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES ({current_id}, '{safe_name}', 'NEIGHBORHOOD', {parent_id}, {lat:.8f}, {lon:.8f});"
        sql_statements.append(sql)
        current_id += 1

    sql_statements.append("\nCOMMIT;")

    # --- Write to file ---
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))

    # 수정: 안내 메시지를 새로운 워크플로우에 맞게 변경합니다.
    print(f"\nSuccessfully generated '{output_path}'.")
    print(f"Total regions created: {current_id - 1}")
    print("\nNext steps:")
    print(f"1. The script has now directly created/updated '{os.path.abspath(output_path)}'.")
    print("2. Please run the following commands from the 'Infra' directory to re-initialize the database:")
    print("   cd ../")
    print("   docker-compose down")
    print("   docker volume rm infra_mysql_data")
    print("   docker-compose up -d --build")


if __name__ == '__main__':
    main() 