import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExpenseModel, CarModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const year = searchParams.get('year') || undefined;

  const expenses = await ExpenseModel.getAll(month, year);
  const cars = await CarModel.getAll();

  return NextResponse.json({ expenses, cars });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { category, amount, expense_date, car_id, description } = body;

  if (!category || !amount || !expense_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ExpenseModel.create(category, parseFloat(amount), expense_date, car_id || null, description);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, category, amount, expense_date, car_id, description } = body;

  if (!id || !category || !amount || !expense_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ExpenseModel.update(id, category, parseFloat(amount), expense_date, car_id || null, description);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await ExpenseModel.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
