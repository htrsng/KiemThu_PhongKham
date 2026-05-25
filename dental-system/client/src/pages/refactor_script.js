import fs from 'fs';
const path = 'd:/PhongKham_KiemThu/dental-system/client/src/pages/AppointmentManagementPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/type SubPage = [\s\S]*?\]\n/, '');
content = content.replace(/const \[activeSubPage, setActiveSubPage\].*\n/, '');
content = content.replace(/const filteredMenuItems = useMemo\(\(\) => \{[\s\S]*?\}, \[currentUser\]\);\n/, '');

const oldReturnBlock = /const renderContent = \(\) => \{[\s\S]*?return \([\s\S]*?\}\n\n/m;
const newReturnBlock = `
    return (
        <section>
            <PageShell
                title="Quản lý Lịch hẹn"
                description="Quản lý lịch hẹn khám bệnh và tiếp đón bệnh nhân."
                testId="page-appointments"
            />
            <div className="mt-6">
                <AppointmentBookingView
                    isLoading={appointmentsIsLoading || patientsIsLoading || doctorsIsLoading || servicesIsLoading || holidaysIsLoading || shiftsIsLoading}
                    appointments={appointments}
                    patients={patients}
                    doctors={doctors}
                    services={services}
                    holidays={holidays}
                    doctorShifts={doctorShifts}
                    createAppointment={createAppointment}
                    currentUser={currentUser}
                    updateAppointment={updateAppointment}
                    checkInAppointment={checkInAppointment}
                    createWalkIn={createWalkIn}
                    createInvoice={createInvoice}
                    deleteAppointment={deleteAppointment}
                />
            </div>
        </section>
    )
}

`;
content = content.replace(oldReturnBlock, newReturnBlock);

const regionStart = '// #region Patient Management View';
const regionEnd = '// #region Appointment Booking View';
const startIndex = content.indexOf(regionStart);
const endIndex = content.indexOf(regionEnd);
if (startIndex !== -1 && endIndex !== -1) {
    content = content.slice(0, startIndex) + content.slice(endIndex);
}

content = content.replace(/import \{[\s\S]*?\} from '@fullcalendar\/react'\n/, '');
content = content.replace(/import type \{[\s\S]*?\} from '@fullcalendar\/core'\n/, '');
content = content.replace(/import type \{[\s\S]*?\} from '@fullcalendar\/interaction'\n/, '');
content = content.replace(/import dayGridPlugin[\s\S]*?from '@fullcalendar\/daygrid'\n/, '');
content = content.replace(/import timeGridPlugin[\s\S]*?from '@fullcalendar\/timegrid'\n/, '');
content = content.replace(/import interactionPlugin[\s\S]*?from '@fullcalendar\/interaction'\n/, '');
content = content.replace(/import \{[\s\S]*?\} from 'lucide-react'/, `import { 
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Pencil,
    Search,
    X,
    ChevronDown,
    AlertTriangle,
    List,
} from 'lucide-react'`);

fs.writeFileSync(path, content, 'utf8');
console.log('Refactored AppointmentManagementPage.tsx successfully.');
