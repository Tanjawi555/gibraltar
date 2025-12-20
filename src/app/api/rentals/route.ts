import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RentalModel, CarModel, ClientModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const [paginatedData, cars, clients] = await Promise.all([
    RentalModel.getPaginated(page, limit, search),
    CarModel.getAll(),
    ClientModel.getAll()
  ]);

  const availableCars = cars.filter(car => car.status === 'available');

  return NextResponse.json({ 
    rentals: paginatedData.rentals, 
    total: paginatedData.total,
    page: paginatedData.page,
    limit: paginatedData.limit,
    availableCars, 
    clients 
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { car_id, client_id, start_date, return_date, rental_price } = body;

  if (!car_id || !client_id || !start_date || !return_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await RentalModel.create(car_id, client_id, start_date, return_date, parseFloat(rental_price) || 0);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // Check if it's just a status update or a full edit
  const { id, status, car_id, client_id, start_date, return_date, rental_price } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    if (status) {
      await RentalModel.updateStatus(id, status);
    } else {
      if (!car_id || !client_id || !start_date || !return_date) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      await RentalModel.update(id, car_id, client_id, start_date, return_date, parseFloat(rental_price) || 0);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
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
    await RentalModel.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rental' }, { status: 500 });
  }
}
