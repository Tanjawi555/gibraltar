import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RentalModel, ExpenseModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const year = searchParams.get('year') || undefined;

  const totalRevenue = await RentalModel.getTotalRevenue(month, year);
  const totalExpenses = await ExpenseModel.getTotal(month, year);
  const totalProfit = totalRevenue - totalExpenses;
  const rentals = await RentalModel.getAll(month, year);

  return NextResponse.json({
    totalRevenue,
    totalExpenses,
    totalProfit,
    rentals,
  });
}
