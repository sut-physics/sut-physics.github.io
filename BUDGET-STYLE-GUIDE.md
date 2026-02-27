# Budget Page Style Guide

คู่มือแก้ไขสี/ตำแหน่งหน้ารายละเอียดงบประมาณ
ไฟล์ CSS: `css/budget.css`
ไฟล์ JS (โครงสร้าง HTML): `js/budget.js`

---

## โครงสร้างหน้า

```
┌─ budget-page-header ──────────────────────────┐
│  "รายละเอียดงบประมาณ"        [แก้ไข]          │  ← บรรทัด 6-46
└───────────────────────────────────────────────┘

┌─ budget-summary-cards ────────────────────────┐
│  [งบประมาณรวม]  [ใช้จ่ายแล้ว]  [คงเหลือ]     │  ← บรรทัด 48-86
└───────────────────────────────────────────────┘

┌─ budget-type-section ─────────────────────────┐
│ ┌─ budget-type-header ───────────────────────┐│
│ │  งบดำเนินงาน                    [×ลบ]      ││  ← บรรทัด 88-110
│ └────────────────────────────────────────────┘│
│ ┌─ budget-cat-section ───────────────────────┐│
│ │ ┌─ budget-cat-header (คลิกเปิด/ปิด) ─────┐││
│ │ │  ▼ ค่าใช้สอย      รวม xxx | ใช้ xxx [×] │││  ← บรรทัด 112-180
│ │ └─────────────────────────────────────────┘││
│ │ ┌─ budget-cat-content (ซ่อน/แสดง) ────────┐││
│ │ │ ┌─ budget-table ───────────────────────┐│││
│ │ │ │  th: รายการ | งบประมาณ | ใช้จ่าย | คงเหลือ │││  ← บรรทัด 215-266
│ │ │ │  td: แถวรายการ...                     ││││
│ │ │ │  [+ เพิ่มรายการ]                      ││││  ← บรรทัด 326-349
│ │ │ │  รวม (เส้นดำใต้)                      ││││  ← บรรทัด 250-261
│ │ │ └──────────────────────────────────────┘│││
│ │ └─────────────────────────────────────────┘││
│ └────────────────────────────────────────────┘│
│  [+ เพิ่มหมวด]                                │  ← บรรทัด 351-378
└───────────────────────────────────────────────┘
[+ เพิ่มประเภทงบ]                                  ← บรรทัด 371-378
```

---

## เปลี่ยนสี

### 1. Header ประเภทงบ (งบดำเนินงาน / งบลงทุน)
```css
/* บรรทัด 97-104 */
.budget-type-header {
    background: var(--primary);   /* ← สีพื้นหลัง */
    color: rgb(255, 255, 255);    /* ← สีตัวหนังสือ */
}
```

### 2. Header หมวด (ค่าใช้สอย / ค่าวัสดุ / ...)
```css
/* บรรทัด 121-134 — สีเหมือนกันทุกหมวด */
.budget-cat-header {
    background: #b8d0ee;   /* ← สีพื้นหลัง */
}
.budget-cat-header:hover {
    background: #e4eef8;   /* ← สีตอน hover */
}
```

**ถ้าอยากให้แต่ละหมวดสีต่างกัน** เพิ่ม CSS นี้:
```css
.budget-cat-section:nth-child(1) .budget-cat-header { background: #b8d0ee; }  /* ค่าใช้สอย */
.budget-cat-section:nth-child(2) .budget-cat-header { background: #b8eec4; }  /* ค่าวัสดุ */
.budget-cat-section:nth-child(3) .budget-cat-header { background: #eee0b8; }  /* ค่าจ้าง */
.budget-cat-section:nth-child(4) .budget-cat-header { background: #e0b8ee; }  /* ค่าเดินทาง */
```

### 3. ชื่อหมวด + ลูกศร
```css
/* บรรทัด 160-163 */
.budget-cat-title {
    color: var(--primary);   /* ← สีชื่อหมวด */
}
/* บรรทัด 148-153 */
.budget-cat-arrow {
    color: var(--primary);   /* ← สีลูกศร ▼ */
}
```

### 4. ยอดรวมย่อยที่ header หมวด
```css
/* บรรทัด 166-170 */
.budget-cat-subtotal {
    color: var(--text-muted);   /* ← สีตัวเลข "รวม xxx | ใช้ xxx" */
}
```

### 5. หัวตาราง (th)
```css
/* บรรทัด 221-228 */
.budget-table th {
    background: #e8eef5;        /* ← สีพื้นหลัง th */
    color: var(--text-dark);    /* ← สีตัวหนังสือ th */
}
```

### 6. แถวรวม (total row)
```css
/* บรรทัด 250-257 */
.budget-table .total-row {
    background: #f0f7ff;   /* ← สีพื้นหลังแถวรวม */
}
.budget-table .total-row td {
    border-bottom: 2px solid var(--primary);   /* ← เส้นใต้แถวรวม (สี+ความหนา) */
}
```

### 7. ปุ่ม "+ เพิ่มรายการ"
```css
/* บรรทัด 332-349 */
.budget-add-item-btn {
    border: 1.5px dashed #e67e22;   /* ← สีกรอบ */
    color: #e67e22;                  /* ← สีตัวหนังสือ */
}
.budget-add-item-btn:hover {
    border-color: #d35400;           /* ← สีกรอบตอน hover */
    color: #d35400;                  /* ← สีตัวหนังสือตอน hover */
}
```

### 8. ปุ่ม "+ เพิ่มหมวด" / "+ เพิ่มประเภทงบ"
```css
/* บรรทัด 351-378 */
.budget-add-section-btn {
    border: 1px dashed var(--border);   /* ← สีกรอบ */
    color: var(--secondary);             /* ← สีตัวหนังสือ */
}
```

### 9. Summary Cards (3 การ์ดบนสุด)
```css
/* บรรทัด 64-74 — แถบสีซ้าย */
.budget-summary-card.total     { border-left: 4px solid var(--secondary); }  /* งบประมาณรวม */
.budget-summary-card.used      { border-left: 4px solid var(--danger); }     /* ใช้จ่ายแล้ว */
.budget-summary-card.remaining { border-left: 4px solid var(--success); }    /* คงเหลือ */

/* บรรทัด 76-80 — สีตัวเลข */
.budget-summary-card .budget-value {
    color: var(--primary);
}
```

### 10. ปุ่มลบ (×)
```css
/* ลบประเภทงบ — วงกลมบน header สีเข้ม (บรรทัด 182-202) */
.budget-section-delete-btn {
    background: rgba(255,255,255,0.2);   /* ← พื้นหลัง */
    color: white;                         /* ← สี × */
}

/* ลบหมวด — วงกลมบน header หมวด (บรรทัด 205-212) */
.budget-cat-header .budget-section-delete-btn {
    background: #fee2e2;     /* ← พื้นหลัง */
    color: var(--danger);    /* ← สี × */
}

/* ลบรายการ — วงกลมในตาราง (บรรทัด 305-323) */
.budget-delete-btn {
    background: #fee2e2;     /* ← พื้นหลัง */
    color: var(--danger);    /* ← สี × */
}
```

---

## เปลี่ยนตำแหน่ง / ลำดับ

### สลับลำดับ "เพิ่มรายการ" กับ "รวม"
ใน `js/budget.js` ฟังก์ชัน `renderBudgetCategorySection` (~บรรทัด 284-298):
```js
// ปัจจุบัน: เพิ่มรายการ → รวม
// ถ้าจะสลับเป็น: รวม → เพิ่มรายการ ให้ย้าย block if(budgetEditMode) ไปหลัง total-row
```

### เปลี่ยน padding / ระยะห่าง
| ส่วน | CSS property | บรรทัด |
|------|-------------|--------|
| Header ประเภทงบ | `padding: 14px 20px` | 101 |
| Header หมวด | `padding: 12px 20px` | 125 |
| เซลล์ตาราง (td) | `padding: 8px 15px` | 235 |
| หัวตาราง (th) | `padding: 10px 15px` | 224 |
| ช่องว่างระหว่าง section | `margin-bottom: 16px` | 92 |

### ความกว้างคอลัมน์ตาราง
ใน `js/budget.js` ฟังก์ชัน `renderBudgetCategorySection` (~บรรทัด 248-253):
```js
html += '<th style="width:40%">รายการ</th>';          // ← ปรับ %
html += '<th ... style="width:20%">งบประมาณ</th>';     // ← ปรับ %
html += '<th ... style="width:20%">ใช้จ่าย</th>';      // ← ปรับ %
html += '<th ... style="width:20%">คงเหลือ</th>';      // ← ปรับ %
```
