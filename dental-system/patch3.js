const fs = require('fs');
const path = 'dental-system/client/src/pages/AppointmentManagementPage.tsx';

let text = fs.readFileSync(path, 'utf8');

const targetStr = `    const getStatusBadgeClass = (status: MockAppointment['status']) => {`;
const replacementStr = `    function renderEventContent(eventInfo: any) {
        const apt = eventInfo.event.extendedProps;
        const patient = patients.find(p => p.id === apt.patientId);
        const hasAllergy = patient?.allergies && patient.allergies.length > 0;
        
        return (
            <div className="flex flex-col p-1 text-xs overflow-hidden h-full" title={eventInfo.event.title + (hasAllergy ? ' (Dị ứng: ' + patient.allergies.join(', ') + ')' : '')}>
                <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
                    {apt.patientName} {hasAllergy && <AlertTriangle className="h-3 w-3 text-rose-300 flex-shrink-0" />}
                </div>
                <div className="whitespace-nowrap overflow-hidden text-ellipsis opacity-90">{apt.serviceName}</div>
                <div className="font-semibold mt-auto truncate">{apt.status}</div>
            </div>
        )
    }

    const getStatusBadgeClass = (status: MockAppointment['status']) => {`;

text = text.replace(targetStr, replacementStr);
fs.writeFileSync(path, text, 'utf8');
console.log('Injected renderEventContent');
