import { Card, CardContent } from '@/components/ui/card';
import AddUser from './AddUser';
import UsersTable from './UsersTable';

export default function UsersPage() {
    return (
        <>
            <div className='space-y-6 min-h-screen bg-[#f8faf9] p-8'>
                <Card className='shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                    <CardContent>
                        <header className='py-2 flex justify-between items-center mb-6'>
                            <h2 className='text-dark-green font-bold text-2xl'>المستخدمون</h2>
                            <AddUser />
                        </header>
                        <UsersTable />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
