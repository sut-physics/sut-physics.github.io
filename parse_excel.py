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

def fix_excel_thai_date(value):
    if not value or value == "":
        return "-"
    
    try:
        # 1. พยายามแปลงเป็นตัวเลขดิบ (เช่น 243263)
        serial = int(float(str(value).replace(',', '')))
        
        # 2. ถ้าเลขอยู่ในช่วง 24xxxx (แสดงว่าเป็นปี พ.ศ. ที่เพี้ยน)
        if 240000 <= serial <= 250000:
            # ลบส่วนต่าง 198328 ออกเพื่อให้กลับเป็นค่ามาตรฐาน Excel
            correct_serial = serial - 198328
            # แปลงจาก Serial เป็นวันที่ (Base date ของ Excel คือ 30 Dec 1899)
            date_obj = datetime(1899, 12, 30) + timedelta(days=correct_serial)
            return date_obj.strftime('%d/%m/%Y')
        
        # 3. ถ้าเป็นเลข 4xxxx (เป็น ค.ศ. ปกติ)
        elif 40000 <= serial <= 60000:
            date_obj = datetime(1899, 12, 30) + timedelta(days=serial)
            return date_obj.strftime('%d/%m/%Y')
            
        return str(value)
    except:
        # ถ้าไม่ใช่ตัวเลข (เป็นข้อความอยู่แล้ว) ให้ส่งคืนค่าเดิม
        return str(value)
    
def excel_date_to_string(serial):
    if not serial or serial == "":
        return "-"
    try:
        # Excel เก็บวันที่เริ่มจาก 1 Jan 1900
        # ถ้าค่าที่ได้มาเป็นตัวเลข (int หรือ float) ให้แปลงตามสูตรนี้
        serial_int = int(float(serial))
        date_obj = datetime(1899, 12, 30) + timedelta(days=serial_int)
        return date_obj.strftime('%d/%m/%Y')
    except (ValueError, TypeError):
        # ถ้าค่าที่ได้มาเป็นข้อความอยู่แล้ว (เช่น "1/10/2566") ให้ส่งคืนค่านั้นเลย
        return str(serial) # Return as-is if not a number

def format_excel_date(value):
    if not value or value == "":
        return "-"
    
    # ถ้าค่าที่ได้มาเป็นตัวเลข (เช่น 243628 หรือ 45200)
    if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
        try:
            serial = int(float(value))
            # ตรวจสอบว่าเป็นเลข Serial ปกติของ Excel (เช่น 40000+) หรือไม่
            # ถ้าเป็นเลขหลักแสน (เช่น 243628) มักจะเป็นการดึงค่าผิด format จาก XML
            # วิธีแก้ที่ง่ายที่สุดคือส่งคืนค่าดิบเพื่อไปเช็ค หรือใช้ timedelta แปลง
            if serial > 60000: 
                # กรณีเป็นเลขประหลาดจากการดึง XML ผิดพลาด
                return str(value) 
                
            date_obj = datetime(1899, 12, 30) + timedelta(days=serial)
            return date_obj.strftime('%d/%m/%Y')
        except:
            return str(value)
            
    # ถ้าค่าที่ได้มาเป็นข้อความอยู่แล้ว
    return str(value)

def extract_project_info(sheet_data, strings):
    """Extract project info from a sheet"""
    info = {
        'projectName': sheet_data.get('B2', ''),
        'projectNameEng': sheet_data.get('B3', ''),
        'leader': sheet_data.get('B4', ''),
        'duration': sheet_data.get('B6', ''),
        'fiscalYear': sheet_data.get('B7', ''),
        'budget': sheet_data.get('B8', ''),
        'usedBudget': sheet_data.get('E8', ''),  # เพิ่มงบที่ใช้ไป
        'remainingBudget': sheet_data.get('G8', ''), # เพิ่มงบคงเหลือ
        'projectCode': sheet_data.get('B9', ''),
        'startDate': sheet_data.get('E6', ''),
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
