const fs = require('fs');
const path = 'dental-system/client/src/pages/AppointmentManagementPage.tsx';

let text = fs.readFileSync(path, 'utf8');

const targetStr = `events={calendarEvents}
                        locale="vi"`;
const replacementStr = `events={calendarEvents}
                        eventContent={renderEventContent}
                        locale="vi"`;

text = text.replace(targetStr, replacementStr);
fs.writeFileSync(path, text, 'utf8');
console.log('Injected eventContent prop');
