import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export interface Car {
  _id?: ObjectId;
  model: string;
  plate_number: string;
  status: 'available' | 'rented' | 'reserved';
  created_at: Date;
  current_rental?: {
    start_date: string;
    return_date: string;
  };
}

export interface Client {
  _id?: ObjectId;
  full_name: string;
  passport_id?: string;
  driving_license?: string;
  passport_image?: string | null;
  license_image?: string | null;
  created_at: Date;
}

export interface Rental {
  _id?: ObjectId;
  car_id: ObjectId;
  client_id: ObjectId;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
  created_at: Date;
}

export interface Expense {
  _id?: ObjectId;
  category: string;
  amount: number;
  expense_date: string;
  car_id?: ObjectId | null;
  description?: string | null;
  created_at: Date;
}

export interface User {
  _id?: ObjectId;
  username: string;
  password_hash: string;
  created_at: Date;
}

export const CarModel = {
  async getAll() {
    const db = await getDatabase();
    return db.collection('cars').aggregate([
      {
        $lookup: {
          from: 'rentals',
          let: { carId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$car_id', '$$carId'] },
                    { $in: ['$status', ['reserved', 'rented']] }
                  ]
                }
              }
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 }
          ],
          as: 'active_rentals'
        }
      },
      {
        $addFields: {
          current_rental: { $arrayElemAt: ['$active_rentals', 0] }
        }
      },
      {
        $project: {
          active_rentals: 0
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
  },

  async getPaginated(page: number, limit: number, search: string) {
    const db = await getDatabase();
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (search) {
      query.$or = [
          { model: { $regex: search, $options: 'i' } },
          { plate_number: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('cars').countDocuments(query);

    const cars = await db.collection('cars').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'rentals',
          let: { carId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$car_id', '$$carId'] },
                    { $in: ['$status', ['reserved', 'rented', 'returned']] }
                  ]
                }
              }
            }
          ],
          as: 'rental_history'
        }
      },
      {
        $lookup: {
          from: 'rentals',
          let: { carId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$car_id', '$$carId'] },
                    { $in: ['$status', ['reserved', 'rented']] }
                  ]
                }
              }
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 }
          ],
          as: 'active_rentals'
        }
      },
      {
        $addFields: {
          current_rental: { $arrayElemAt: ['$active_rentals', 0] }
        }
      },
      {
        $project: {
            model: 1,
            plate_number: 1,
            status: 1,
            created_at: 1,
            rental_history: 1, // Keep it to calc in JS
            current_rental: 1
        }
      },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    // Calculate total rented ms in JS
    const processedCars = cars.map((car: any) => {
        let total_rented_ms = 0;
        if (car.rental_history && Array.isArray(car.rental_history)) {
            car.rental_history.forEach((rental: any) => {
                const start = new Date(rental.start_date).getTime();
                const end = new Date(rental.return_date).getTime();
                
                if (!isNaN(start) && !isNaN(end) && end > start) {
                    total_rented_ms += (end - start);
                }
            });
        }

        // Remove history based on original projection goals (optional, but cleaner)
        delete car.rental_history;
        delete car.active_rentals;
        
        return {
            ...car,
            total_rented_ms
        };
    });

    return { cars: processedCars, total, page, limit };
  },

  async getById(id: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').findOne({ _id: new ObjectId(id) });
  },

  async create(model: string, plate_number: string) {
    const db = await getDatabase();
    const result = await db.collection<Car>('cars').insertOne({
      model,
      plate_number,
      status: 'available',
      created_at: new Date(),
    });
    return result;
  },

  async update(id: string, model: string, plate_number: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').updateOne(
      { _id: new ObjectId(id) },
      { $set: { model, plate_number } }
    );
  },

  async updateStatus(id: string, status: 'available' | 'rented' | 'reserved') {
    const db = await getDatabase();
    return db.collection<Car>('cars').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').deleteOne({ _id: new ObjectId(id) });
  },

  async getStats() {
    const db = await getDatabase();
    const cars = db.collection<Car>('cars');
    const total = await cars.countDocuments();
    const available = await cars.countDocuments({ status: 'available' });
    const rented = await cars.countDocuments({ status: 'rented' });
    const reserved = await cars.countDocuments({ status: 'reserved' });
    return { total, available, rented, reserved };
  },
};

export const ClientModel = {
  async getAll() {
    const db = await getDatabase();
    return db.collection<Client>('clients').find().sort({ created_at: -1 }).toArray();
  },

  async getPaginated(page: number, limit: number, search: string) {
    const db = await getDatabase();
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { passport_id: { $regex: search, $options: 'i' } },
          { driving_license: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('clients').countDocuments(query);
    const clients = await db.collection<Client>('clients')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    
    return { clients, total, page, limit };
  },

  async getById(id: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').findOne({ _id: new ObjectId(id) });
  },

  async create(
    full_name: string,
    passport_id?: string,
    driving_license?: string,
    passport_image?: string | null,
    license_image?: string | null
  ) {
    const db = await getDatabase();
    return db.collection<Client>('clients').insertOne({
      full_name,
      passport_id: passport_id || '',
      driving_license: driving_license || '',
      passport_image: passport_image || null,
      license_image: license_image || null,
      created_at: new Date(),
    });
  },

  async update(
    id: string, 
    full_name: string, 
    passport_id?: string, 
    driving_license?: string,
    passport_image?: string | null,
    license_image?: string | null
  ) {
    const db = await getDatabase();
    const updateData: any = { 
        full_name, 
        passport_id: passport_id || '', 
        driving_license: driving_license || '' 
    };
    if (passport_image !== undefined) updateData.passport_image = passport_image;
    if (license_image !== undefined) updateData.license_image = license_image;

    return db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').deleteOne({ _id: new ObjectId(id) });
  },
};

export const RentalModel = {
  async getAll(month?: string, year?: string) {
    const db = await getDatabase();
    
    const query: any = {};
    if (month && year) {
        // Construct query for specific month/year based on start_date
        // start_date format is ISO string "2024-05-20T..."
        // Regex: ^YYYY-MM
        const monthStr = month.padStart(2, '0');
        query.start_date = { $regex: `^${year}-${monthStr}` };
    }

    const rentals = await db.collection('rentals').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
      {
        $project: {
          _id: 1,
          car_id: 1,
          client_id: 1,
          start_date: 1,
          return_date: 1,
          rental_price: 1,
          status: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
          client_name: '$client.full_name',
        },
      },
      { $sort: { created_at: -1 } },
    ]).toArray();
    return rentals;
  },

  async getById(id: string) {
    const db = await getDatabase();
    const rentals = await db.collection('rentals').aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
      {
        $project: {
          _id: 1,
          car_id: 1,
          client_id: 1,
          start_date: 1,
          return_date: 1,
          rental_price: 1,
          status: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
          client_name: '$client.full_name',
          passport_id: '$client.passport_id',
          driving_license: '$client.driving_license',
          client_address: '$client.address', // Assuming address exists or optional
          client_phone: '$client.phone', // Assuming phone exists or optional
        },
      },
    ]).toArray();
    return rentals[0] || null;
  },

  async getPaginated(page: number, limit: number, search: string, month?: string, year?: string) {
    const db = await getDatabase();
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
      {
        $project: {
          _id: 1,
          car_id: 1,
          client_id: 1,
          start_date: 1,
          return_date: 1,
          rental_price: 1,
          status: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
          client_name: '$client.full_name',
        },
      }
    ];
    
    // Add Match stage BEFORE or AFTER lookup? 
    // Ideally before to limit lookups, but start_date is in 'rentals' collection so we can put it first.
    // BUT we used pipeline which puts lookup first. We can add a match at the start of pipeline if we want query optimization,
    // or just add it to the search match.
    // Let's add a match stage for date filtering at the VERY BEGINNING of the pipeline
    if (month && year) {
        const monthStr = month.padStart(2, '0');
        pipeline.unshift({
            $match: { start_date: { $regex: `^${year}-${monthStr}` } }
        });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { car_model: { $regex: search, $options: 'i' } },
            { plate_number: { $regex: search, $options: 'i' } },
            { client_name: { $regex: search, $options: 'i' } },
          ]
        }
      });
    }

    // We need two things: total count and paginated results.
    // We can use $facet to get both in one query, improving performance.
    const result = await db.collection('rentals').aggregate([
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ]).toArray();

    const total = result[0].metadata[0]?.total || 0;
    const rentals = result[0].data;

    return { rentals, total, page, limit };
  },

  async delete(id: string) {
    const db = await getDatabase();
    const rental = await db.collection('rentals').findOne({ _id: new ObjectId(id) });
    if (rental && rental.status !== 'returned') {
      // If we are deleting an active/reserved rental, free up the car
      await db.collection('cars').updateOne(
        { _id: rental.car_id },
        { $set: { status: 'available' } }
      );
    }
    return db.collection('rentals').deleteOne({ _id: new ObjectId(id) });
  },

  async checkOverlap(car_id: string, start_date: string, return_date: string, exclude_rental_id?: string) {
    const db = await getDatabase();
    const query: any = {
      car_id: new ObjectId(car_id),
      status: { $in: ['reserved', 'rented'] },
      $or: [
        {
          $and: [
            { start_date: { $lt: return_date } },
            { return_date: { $gt: start_date } }
          ]
        }
      ]
    };

    if (exclude_rental_id) {
      query._id = { $ne: new ObjectId(exclude_rental_id) };
    }

    const count = await db.collection('rentals').countDocuments(query);
    return count > 0;
  },

  async create(
    car_id: string,
    client_id: string,
    start_date: string,
    return_date: string,
    rental_price: number
  ) {
    const db = await getDatabase();
    const result = await db.collection('rentals').insertOne({
      car_id: new ObjectId(car_id),
      client_id: new ObjectId(client_id),
      start_date,
      return_date,
      rental_price,
      status: 'reserved',
      created_at: new Date(),
    });
    await db.collection('cars').updateOne(
      { _id: new ObjectId(car_id) },
      { $set: { status: 'reserved' } }
    );
    return result;
  },

  async updateStatus(id: string, status: 'reserved' | 'rented' | 'returned') {
    const db = await getDatabase();
    const rental = await db.collection('rentals').findOne({ _id: new ObjectId(id) });
    if (rental) {
      const carStatus = status === 'returned' ? 'available' : status;
      await db.collection('rentals').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      await db.collection('cars').updateOne(
        { _id: rental.car_id },
        { $set: { status: carStatus } }
      );
    }
  },

  async checkExpiredRentals() {
    const db = await getDatabase();
    // Use current local time or ISO. Since stored dates are ISO string "YYYY-MM-DDTHH:mm", simple string comparison works.
    // However, we want to be precise. 
    // We assume the system is running in the correct timezone or the user inputs local time.
    // For now, we compare against ISO string of now.
    // Ideally we should handle timezone offset if user is in a specific zone, but without timezone config, UTC/ISO is best bet.
    // Wait, the user inputs "YYYY-MM-DDTHH:mm" from <input type="datetime-local">. This value is usually "local" time without timezone info.
    // If we compare it to new Date().toISOString() (which is UTC), we might be off by hours.
    // But since this runs on server, new Date() is server time.
    // Ideally we'd use a library like date-fns-tz but let's stick to simple string comparison.
    // To match "datetime-local" format (no Z):
    // To ensure consistency on Live servers (which usually look at UTC), we FORCE the check to use Morocco Time (Africa/Casablanca).
    // This way, regardless of where the server is hosted, it compares against the correct wall-clock time in Morocco.
    
    const getEnvironmentTimeISO = () => {
        // Detect environment
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (isDevelopment) {
             // Local Development: Use the computer's local time
             const d = new Date();
             const pad = (n: number) => n < 10 ? '0' + n : n;
             return d.getFullYear() + '-' + 
               pad(d.getMonth() + 1) + '-' + 
               pad(d.getDate()) + 'T' + 
               pad(d.getHours()) + ':' + 
               pad(d.getMinutes());
        } else {
             // Live/Production: Strictly use Morocco Time
             const options: Intl.DateTimeFormatOptions = {
                timeZone: 'Africa/Casablanca',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };
            
            const formatter = new Intl.DateTimeFormat('en-CA', { 
                ...options, 
                year: 'numeric', month: '2-digit', day: '2-digit'
            });
            const timeFormatter = new Intl.DateTimeFormat('en-GB', { 
                ...options,
                hour: '2-digit', minute: '2-digit'
            });

            const dateStr = formatter.format(new Date()); 
            const timeStr = timeFormatter.format(new Date());

            return `${dateStr}T${timeStr}`;
        }
    };
    
    const nowStr = getEnvironmentTimeISO();

    // 1. Find expired rentals OR reservations (rented/reserved -> returned)
    // "status" in ['rented', 'reserved'] AND return_date < now
    const expiredRentals = await db.collection('rentals').find({
        status: { $in: ['rented', 'reserved'] },
        return_date: { $lt: nowStr }
    }).toArray();

    if (expiredRentals.length > 0) {
        const rentalIds = expiredRentals.map(r => r._id);
        const carIds = expiredRentals.map(r => r.car_id);

        // Mark rentals/reservations as returned
        await db.collection('rentals').updateMany(
            { _id: { $in: rentalIds } },
            { $set: { status: 'returned' } }
        );

        // Mark cars as available
        await db.collection('cars').updateMany(
            { _id: { $in: carIds } },
            { $set: { status: 'available' } }
        );
    }
  },

  async update(
    id: string,
    car_id: string,
    client_id: string,
    start_date: string,
    return_date: string,
    rental_price: number
  ) {
    const db = await getDatabase();
    return db.collection('rentals').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          car_id: new ObjectId(car_id),
          client_id: new ObjectId(client_id),
          start_date,
          return_date,
          rental_price,
        },
      }
    );
  },



  async getNotifications() {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const notifications: any[] = [];

    // Use $regex to match dates that start with the string (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm")
    const startingToday = await db.collection('rentals').aggregate([
      { $match: { start_date: { $regex: `^${today}` }, status: 'reserved' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of startingToday) {
      notifications.push({
        type: 'start_today',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'warning',
      });
    }

    const startingTomorrow = await db.collection('rentals').aggregate([
      { $match: { start_date: { $regex: `^${tomorrow}` }, status: 'reserved' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of startingTomorrow) {
      notifications.push({
        type: 'start_tomorrow',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'info',
      });
    }

    const returnToday = await db.collection('rentals').aggregate([
      { $match: { return_date: { $regex: `^${today}` }, status: 'rented' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of returnToday) {
      notifications.push({
        type: 'return_today',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'warning',
      });
    }

    // specific strict comparison for overdue might still work if we assume ISO string sort order
    // But to be safe with time: return_date < today (string comparison works for ISO dates, "2024-05-20T..." > "2024-05-19")
    // "2024-05-20T09:00" is effectively "greater" than "2024-05-20" if we compare strings directly?
    // Wait, "2024-05-20" is shorter. "2024-05-20T..." > "2024-05-20" is true.
    // So if return date is TODAY (with time), it is NOT less than TODAY (without time).
    // If return date is YESTERDAY, it is less.
    // So simple string comparison works fine for "overdue" as strictly < today.
    // e.g. "2024-05-19T23:59" < "2024-05-20". Correct.
    const overdue = await db.collection('rentals').aggregate([
      { $match: { return_date: { $lt: today }, status: 'rented' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of overdue) {
      notifications.push({
        type: 'overdue',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'danger',
      });
    }

    return notifications;
  },

  async getTotalRevenue(month?: string, year?: string) {
    const db = await getDatabase();
    const query: any = {};
    if (month && year) {
        const monthStr = month.padStart(2, '0');
        query.start_date = { $regex: `^${year}-${monthStr}` };
    }
    const result = await db.collection('rentals').aggregate([
      { $match: query },  
      { $group: { _id: null, total: { $sum: '$rental_price' } } },
    ]).toArray();
    return result[0]?.total || 0;
  },
};

export const ExpenseModel = {
  async getAll(month?: string, year?: string) {
    const db = await getDatabase();
    
    const query: any = {};
    if (month && year) {
        const monthStr = month.padStart(2, '0');
        query.expense_date = { $regex: `^${year}-${monthStr}` };
    }

    const expenses = await db.collection('expenses').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $unwind: {
          path: '$car',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          category: 1,
          amount: 1,
          expense_date: 1,
          car_id: 1,
          description: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
        },
      },
      { $sort: { expense_date: -1 } },
    ]).toArray();
    return expenses;
  },

  async getTotal(month?: string, year?: string) {
      const db = await getDatabase();
      const query: any = {};
      if (month && year) {
          const monthStr = month.padStart(2, '0');
          query.expense_date = { $regex: `^${year}-${monthStr}` };
      }
      const result = await db.collection('expenses').aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray();
      return result[0]?.total || 0;
  },

  async create(
    category: string,
    amount: number,
    expense_date: string,
    car_id?: string | null,
    description?: string | null
  ) {
    const db = await getDatabase();
    return db.collection('expenses').insertOne({
      category,
      amount,
      expense_date,
      car_id: car_id ? new ObjectId(car_id) : null,
      description: description || null,
      created_at: new Date(),
    });
  },

  async update(
    id: string,
    category: string,
    amount: number,
    expense_date: string,
    car_id?: string | null,
    description?: string | null
  ) {
    const db = await getDatabase();
    return db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          category,
          amount,
          expense_date,
          car_id: car_id ? new ObjectId(car_id) : null,
          description: description || null,
        },
      }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection('expenses').deleteOne({ _id: new ObjectId(id) });
  },


};
