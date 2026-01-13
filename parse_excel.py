#!/usr/bin/env python3
"""Parse Excel XML to JSON for dashboard"""

import zipfile
import re
import json
from xml.etree import ElementTree as ET
from datetime import datetime, timedelta

EXCEL_PATH = "/Users/santaclaus/Desktop/BNCT/dashboard_CoE .xlsx"

def parse_shared_strings(xlsx_path):
    """Extract shared strings from Excel"""
    strings = []
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        with z.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in root.findall('.//main:si', ns):
                text_parts = []
                for t in si.iter():
                    if t.text and t.tag.endswith('}t'):
                        text_parts.append(t.text)
                strings.append(''.join(text_parts))
    return strings

def parse_sheet(xlsx_path, sheet_num, strings):
    """Parse a single sheet"""
    data = {}
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        with z.open(f'xl/worksheets/sheet{sheet_num}.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

            for row in root.findall('.//main:row', ns):
                row_num = row.get('r')
                for cell in row.findall('main:c', ns):
                    cell_ref = cell.get('r')
                    cell_type = cell.get('t')
                    value_elem = cell.find('main:v', ns)

                    if value_elem is not None:
                        if cell_type == 's':  # shared string
                            idx = int(value_elem.text)
                            value = strings[idx] if idx < len(strings) else ''
                        else:
                            value = value_elem.text
                        data[cell_ref] = value
    return data

def get_sheet_names(xlsx_path):
    """Get sheet names from workbook.xml"""
    names = []
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        with z.open('xl/workbook.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for sheet in root.findall('.//main:sheet', ns):
                names.append(sheet.get('name'))
    return names

def excel_date_to_string(excel_date):
    """Convert Excel serial date to d/m/yyyy string"""
    if not excel_date:
        return ''
    try:
        serial = int(float(excel_date))
        # Check if it's a valid Excel serial date (reasonable range: 1 to ~50000 for modern dates)
        if 1 <= serial <= 60000:
            # Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as leap year
            base_date = datetime(1899, 12, 30)
            result_date = base_date + timedelta(days=serial)
            return result_date.strftime('%-d/%-m/%Y')
        else:
            # Not a valid Excel date, return as-is
            return excel_date
    except (ValueError, TypeError):
        return excel_date  # Return as-is if not a number

def extract_project_info(sheet_data, strings):
    """Extract project info from a sheet"""
    info = {
        'projectName': sheet_data.get('B2', ''),
        'projectNameEng': sheet_data.get('B3', ''),
        'leader': sheet_data.get('B4', ''),
        'duration': sheet_data.get('B6', ''),
        'fiscalYear': sheet_data.get('B7', ''),
        'budget': sheet_data.get('B8', ''),
        'projectCode': sheet_data.get('B9', ''),
        'startDate': excel_date_to_string(sheet_data.get('E6', '')),
        'endDate': sheet_data.get('G6', ''),
        'extendDate': sheet_data.get('G7', '') if 'G7' in sheet_data else ''
    }
    return info

def extract_outputs(sheet_data):
    """Extract output data from sheet"""
    outputs = []

    # Define output categories and their row mappings
    categories = [
        # Category 1: Human Resources
        {'name': 'กำลังคนหรือหน่วยงาน', 'subcategories': [
            {'name': 'ระดับปริญญาตรี (ร่วมวิจัย)', 'row': 13},
            {'name': 'ระดับปริญญาโท (ร่วมวิจัย)', 'row': 14},
            {'name': 'ระดับปริญญาเอก (ร่วมวิจัย)', 'row': 15},
            {'name': 'นักวิจัยหน่วยงานรัฐ (ร่วมวิจัย)', 'row': 16},
            {'name': 'เด็กและเยาวชน (ร่วมอบรม)', 'row': 17},
            {'name': 'นิสิต/นักศึกษา ป.ตรี (ร่วมอบรม)', 'row': 18},
            {'name': 'บุคลากรภาครัฐ (ร่วมอบรม)', 'row': 19},
        ]},
        # Category 2: Publications
        {'name': 'ต้นฉบับบทความวิจัย', 'subcategories': [
            {'name': 'TIER1', 'row': 21},
            {'name': 'Q1', 'row': 22},
            {'name': 'Q2', 'row': 23},
            {'name': 'Q3', 'row': 24},
            {'name': 'ระดับชาติ', 'row': 25},
            {'name': 'Proceeding', 'row': 26},
        ]},
        # Category 3: Books
        {'name': 'หนังสือ', 'subcategories': [
            {'name': 'หนังสือ', 'row': 28},
        ]},
        # Category 4: Prototypes
        {'name': 'ต้นแบบผลิตภัณฑ์/เทคโนโลยี', 'subcategories': [
            {'name': 'ต้นแบบผลิตภัณฑ์', 'row': 30},
            {'name': 'เทคโนโลยี/กระบวนการใหม่', 'row': 31},
            {'name': 'นวัตกรรมทางสังคม', 'row': 32},
        ]},
        # Category 5: IP
        {'name': 'ทรัพย์สินทางปัญญา', 'subcategories': [
            {'name': 'อนุสิทธิบัตร', 'row': 34},
        ]},
        # Category 6: Infrastructure
        {'name': 'เครื่องมือและโครงสร้างพื้นฐาน', 'subcategories': [
            {'name': 'เครื่องมือ ววน.', 'row': 36},
        ]},
        # Category 7: Database
        {'name': 'ฐานข้อมูล/ระบบและกลไก', 'subcategories': [
            {'name': 'ฐานข้อมูล', 'row': 38},
        ]},
        # Category 8: Networks
        {'name': 'เครือข่าย', 'subcategories': [
            {'name': 'ระดับประเทศ', 'row': 40},
            {'name': 'ระดับนานาชาติ', 'row': 41},
        ]},
        # Category 9: Investment
        {'name': 'การลงทุนวิจัยและนวัตกรรม', 'subcategories': [
            {'name': 'กองทุนในประเทศ', 'row': 43},
            {'name': 'กองทุนต่างประเทศ', 'row': 44},
        ]},
    ]

    for cat in categories:
        cat_data = {'name': cat['name'], 'items': []}
        for sub in cat['subcategories']:
            row = sub['row']
            target = sheet_data.get(f'B{row}', '0')
            completed = sheet_data.get(f'D{row}', '0')

            # Try to convert to numbers
            try:
                target = float(target) if target else 0
            except:
                target = 0
            try:
                completed = float(completed) if completed else 0
            except:
                completed = 0

            # Get names from columns H-Q (up to 10 names)
            names = []
            for col in ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q']:
                name = sheet_data.get(f'{col}{row}', '')
                if name:
                    names.append(name)

            cat_data['items'].append({
                'name': sub['name'],
                'target': target,
                'completed': completed,
                'names': names
            })
        outputs.append(cat_data)

    return outputs

def main():
    strings = parse_shared_strings(EXCEL_PATH)
    sheet_names = get_sheet_names(EXCEL_PATH)

    all_data = {'sheets': []}

    for i, name in enumerate(sheet_names, 1):
        sheet_data = parse_sheet(EXCEL_PATH, i, strings)

        # Extract info based on sheet structure
        info = extract_project_info(sheet_data, strings)
        outputs = extract_outputs(sheet_data)

        all_data['sheets'].append({
            'name': name,
            'info': info,
            'outputs': outputs,
            'rawData': sheet_data
        })

    # Save to JSON
    with open('/Users/santaclaus/Desktop/BNCT/data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(sheet_names)} sheets: {sheet_names}")
    print("Data saved to data.json")

if __name__ == '__main__':
    main()
