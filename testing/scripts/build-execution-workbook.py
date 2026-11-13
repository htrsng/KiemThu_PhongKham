"""Build a blank, reviewable manual execution workbook; never invent results.
Install: python -m pip install -r testing/requirements-docs.txt
"""
import csv
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[2]
with (ROOT / 'testing/manual/test-cases.tsv').open(encoding='utf-8-sig', newline='') as source:
    cases = list(csv.DictReader(source, delimiter='\t'))
book = Workbook()
last_row = len(cases) + 1
summary = book.active
summary.title = 'Read me'
for row in [
    ['SmileCare — Manual test execution', ''],
    ['Purpose', 'Manual results only. Automated API/Cypress results are reported separately.'],
    ['Initial status', 'All cases are Not Run. No manual execution is claimed.'],
    ['How to use', 'Duplicate Execution for each run; fill Run ID, date, tester, source revision and environment.'],
    ['Evidence', 'Use repository-relative evidence path or CI run URL; never paste passwords or tokens.'],
    ['Pass rule', 'Every step must be performed and actual results compared with Expected.'],
    ['Blocked rule', 'Record the missing prerequisite; do not use Blocked merely for unexecuted work.'],
    ['Designed cases', len(cases)],
    ['Pass', f'=COUNTIF(Execution!M2:M{last_row},"Pass")'],
    ['Fail', f'=COUNTIF(Execution!M2:M{last_row},"Fail")'],
    ['Blocked', f'=COUNTIF(Execution!M2:M{last_row},"Blocked")'],
    ['Not Run', f'=COUNTIF(Execution!M2:M{last_row},"Not Run")'],
]:
    summary.append(row)
sheet = book.create_sheet('Execution')
sheet.append(['Run ID', 'Date/time + timezone', 'Tester', 'Source revision', 'Environment', 'Test case ID',
              'Module', 'Priority', 'Precondition', 'Test data', 'Steps', 'Expected', 'Status', 'Actual', 'Bug ID', 'Evidence'])
for case in cases:
    sheet.append(['', '', '', '', '', case['ID'], case['Module'], case['Priority'], case['Precondition'],
                  case['Test data'], case['Steps'], case['Expected'], 'Not Run', '', '', ''])
validation = DataValidation(type='list', formula1='"Not Run,Pass,Fail,Blocked"')
sheet.add_data_validation(validation)
validation.add(f'M2:M{len(cases)+1}')
validation.errorTitle = 'Invalid execution status'
validation.error = 'Choose Not Run, Pass, Fail or Blocked.'
validation.showErrorMessage = True
sheet.auto_filter.ref = sheet.dimensions
sheet.freeze_panes = 'I2'
for page in book:
    page.freeze_panes = page.freeze_panes or 'A2'
    for cell in page[1]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor='17365D')
    for row in page.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(vertical='top', wrap_text=True)
    for column in page.columns:
        page.column_dimensions[column[0].column_letter].width = 24
summary.column_dimensions['B'].width = 100
for column in ['I', 'J', 'K', 'L', 'N', 'P']:
    sheet.column_dimensions[column].width = 55
destination = ROOT / 'docs/qa/test-execution.xlsx'
book.save(destination)
print(f'Created {destination.name}: {len(cases)} manual cases, all Not Run.')
