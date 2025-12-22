import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CarModel, RentalModel, ExpenseModel } from '@/lib/models';

export async function GET() {
  await RentalModel.checkExpiredRentals();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const carStats = await CarModel.getStats();
  const totalExpenses = await ExpenseModel.getTotal();
  const totalRevenue = await RentalModel.getTotalRevenue();
  const totalProfit = totalRevenue - totalExpenses;
  const notifications = await RentalModel.getNotifications();

  return NextResponse.json({
    carStats,
    totalExpenses,
    totalRevenue,
    totalProfit,
    notifications,
    username: session.user?.name,
  });
}
