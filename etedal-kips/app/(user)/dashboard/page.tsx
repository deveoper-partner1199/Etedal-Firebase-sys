import Goals from './(home-elements)/Goals';

import AddGoal from './(home-elements)/AddGoal';

export default function DashboardPage() {
    return (
        <div className='space-y-6 min-h-screen bg-[#f8faf9] p-8'>
            <header className='py-3 flex justify-between items-center'>
                <h2 className='text-dark-green font-bold text-2xl'>الأهداف الاستراتيجية</h2>
                <AddGoal />
            </header>
            <Goals />
        </div>
    );
}
