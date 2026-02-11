import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

// ... (imports remain)

export interface Car {
  _id?: ObjectId;
  model: string;
  plate_number: string;
  status: 'available' | 'rented' | 'reserved';
  created_at: Date;
  mot_expiry?: string; // ISO Date string
  current_rental?: {
    start_date: string;
    return_date: string;
  };
}

// ... (Client, Rental, Expense, User interfaces remain)




export interface Client {
  _id?: ObjectId;
  full_name: string;
  passport_id?: string;
  driving_license?: string;
  address?: string;
  id_number?: string;
  date_of_birth?: string;
  license_expiry_date?: string;
  passport_expiry_date?: string;
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

  async create(model: string, plate_number: string, mot_expiry?: string) {
    const db = await getDatabase();
    const doc: Car = {
      model,
      plate_number,
      status: 'available',
      created_at: new Date(),
    };
    if (mot_expiry) doc.mot_expiry = mot_expiry;
    
    const result = await db.collection<Car>('cars').insertOne(doc);
    return result;
  },

  async update(id: string, model: string, plate_number: string, mot_expiry?: string) {
    const db = await getDatabase();
    const updateData: Partial<Car> = { model, plate_number };
    if (mot_expiry) updateData.mot_expiry = mot_expiry;
    
    return db.collection<Car>('cars').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
          { driving_license: { $regex: search, $options: 'i' } },
          { id_number: { $regex: search, $options: 'i' } }
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
    license_image?: string | null,
    address?: string,
    id_number?: string,
    date_of_birth?: string,
    license_expiry_date?: string,
    passport_expiry_date?: string
  ) {
    const db = await getDatabase();
    const doc = {
      full_name,
      passport_id: passport_id || '',
      driving_license: driving_license || '',
      address: address || '',
      id_number: id_number || '',
      date_of_birth: date_of_birth || '',
      license_expiry_date: license_expiry_date || '',
      passport_expiry_date: passport_expiry_date || '',
      passport_image: passport_image || null,
      license_image: license_image || null,
      created_at: new Date(),
    };
    const result = await db.collection<Client>('clients').insertOne(doc);

    return result;
  },

  async update(
    id: string, 
    full_name: string, 
    passport_id?: string, 
    driving_license?: string,
    passport_image?: string | null,
    license_image?: string | null,
    address?: string,
    id_number?: string,
    date_of_birth?: string,
    license_expiry_date?: string,
    passport_expiry_date?: string
  ) {
    const db = await getDatabase();
    const updateData: any = { 
        full_name, 
        passport_id: passport_id || '', 
        driving_license: driving_license || '',
        address: address || '',
        id_number: id_number || '',
        date_of_birth: date_of_birth || '',
        license_expiry_date: license_expiry_date || '',
        passport_expiry_date: passport_expiry_date || ''
    };
    if (passport_image !== undefined) updateData.passport_image = passport_image;
    if (license_image !== undefined) updateData.license_image = license_image;

    const result = await db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return result;
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').deleteOne({ _id: new ObjectId(id) });
  },
};

import { toUTCISO, isStartingToday, isStartingTomorrow, isStartingToday as isReturnToday, getNow, getTimezone } from './timezone';
import { addMonths, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// ... (CarModel, ClientModel unchanged) ...

export const RentalModel = {
  async getAll(month?: string, year?: string) {
    const db = await getDatabase();
    
    const query: any = {};
    if (month && year) {
        // Timezone-safe month filtering
        // Construct Start of Month in Business Time
        const startStr = `${year}-${month.padStart(2, '0')}-01T00:00`; 
        const startUTC = toUTCISO(startStr);
        
        // Construct Start of Next Month
        // We can just increment month, handle year rollover
        let nextMonth = parseInt(month) + 1;
        let nextYear = parseInt(year);
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00`;
        const endUTC = toUTCISO(endStr);

        query.start_date = { $gte: startUTC, $lt: endUTC };
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
      { $sort: { start_date: -1 } },
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
          client_address: '$client.address', 
          client_id_number: '$client.id_number',
          client_date_of_birth: '$client.date_of_birth',
          client_license_expiry: '$client.license_expiry_date',
          client_passport_expiry: '$client.passport_expiry_date',
          client_phone: '$client.phone',
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

    if (month && year) {
        const startStr = `${year}-${month.padStart(2, '0')}-01T00:00`; 
        const startUTC = toUTCISO(startStr);
        let nextMonth = parseInt(month) + 1;
        let nextYear = parseInt(year);
        if (nextMonth > 12) { nextMonth = 1; nextYear++; }
        const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00`;
        const endUTC = toUTCISO(endStr);
        
        // Match stage at the beginning for index optimization
        pipeline.unshift({
            $match: { start_date: { $gte: startUTC, $lt: endUTC } }
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

    const result = await db.collection('rentals').aggregate([
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { start_date: -1 } },
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
      await db.collection('cars').updateOne(
        { _id: rental.car_id },
        { $set: { status: 'available' } }
      );
    }
    return db.collection('rentals').deleteOne({ _id: new ObjectId(id) });
  },

  async checkOverlap(car_id: string, start_date: string, return_date: string, exclude_rental_id?: string) {
    const db = await getDatabase();
    
    const startUTC = toUTCISO(start_date);
    const endUTC = toUTCISO(return_date);
    
    const query: any = {
      car_id: new ObjectId(car_id),
      status: { $in: ['reserved', 'rented'] },
      $or: [
        {
          $and: [
            { start_date: { $lt: endUTC } },
            { return_date: { $gt: startUTC } }
          ]
        }
      ]
    };

    if (exclude_rental_id) {
      query._id = { $ne: new ObjectId(exclude_rental_id) };
    }

    // Change from countDocuments to find to inspect conflicts
    const overlappingRentals = await db.collection('rentals').find(query).toArray();

    if (overlappingRentals.length === 0) {
        return false;
    }

    // If conflicts exist, check if the Car is explicitly marked 'available'.
    // If so, these rentals are stale/orphaned (user manually set car to available).
    const car = await db.collection('cars').findOne({ _id: new ObjectId(car_id) });

    if (car && car.status === 'available') {
        // Auto-fix stale rentals to 'returned' so they don't block this or future requests for the same slot.
        const staleIds = overlappingRentals.map(r => r._id);
        await db.collection('rentals').updateMany(
            { _id: { $in: staleIds } },
            { $set: { status: 'returned' } }
        );
        return false; // Allow the new reservation
    }

    return true; // Real conflict
  },

  async create(
    car_id: string,
    client_id: string,
    start_date: string,
    return_date: string,
    rental_price: number,
    status: 'reserved' | 'rented' = 'reserved'
  ) {
    const db = await getDatabase();
    
    // DATA NORMALIZATION: Convert Business Time Inputs to UTC ISO
    const startUTC = toUTCISO(start_date);
    const returnUTC = toUTCISO(return_date);

    const result = await db.collection('rentals').insertOne({
      car_id: new ObjectId(car_id),
      client_id: new ObjectId(client_id),
      start_date: startUTC,
      return_date: returnUTC,
      rental_price,
      status, 
      created_at: new Date(),
    });
    
    
    
    if (status === 'rented') {
        await db.collection('cars').updateOne(
          { _id: new ObjectId(car_id) },
          { $set: { status: 'rented' } }
        );
    } else {
        // Status is 'reserved'
         await db.collection('cars').updateOne(
          { _id: new ObjectId(car_id), status: { $ne: 'rented' } },
          { $set: { status: 'reserved' } }
        );
    }
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
    // NEW LOGIC: Compare against strict UTC Timestamp
    const nowUTC = getNow().toISOString();

    const expiredRentals = await db.collection('rentals').find({
        status: { $in: ['rented', 'reserved'] },
        return_date: { $lt: nowUTC } // Strict string comparison works for ISO UTC
    }).toArray();

    if (expiredRentals.length > 0) {
        const rentalIds = expiredRentals.map(r => r._id);
        const carIds = expiredRentals.map(r => r.car_id);

        await db.collection('rentals').updateMany(
            { _id: { $in: rentalIds } },
            { $set: { status: 'returned' } }
        );

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
    
    // DATA NORMALIZATION
    const startUTC = toUTCISO(start_date);
    const returnUTC = toUTCISO(return_date);

    return db.collection('rentals').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          car_id: new ObjectId(car_id),
          client_id: new ObjectId(client_id),
          start_date: startUTC,
          return_date: returnUTC,
          rental_price,
        },
      }
    );
  },

  async getNotifications() {
    const db = await getDatabase();
    const notifications: any[] = [];

    // Filter Optimization: 
    // We can't easily query "Start Today" in Mongo if dates are UTC and "Today" is variable.
    // Strategy: Fetch active reservations and rentals, filter in JS.
    // This is performant for < 10,000 active rentals.
    
    const activeRentals = await db.collection('rentals').aggregate([
        { $match: { status: { $in: ['reserved', 'rented'] } } },
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

    // JS Filtering using Timezone Utils
    for (const r of activeRentals) {
        // Warning: r.start_date / r.return_date are UTC strings from DB
        
        if (r.status === 'reserved') {
            if (isStartingToday(r.start_date)) {
                notifications.push({
                    type: 'start_today',
                    rental: { ...r, model: r.car.model, plate_number: r.car.plate_number, full_name: r.client.full_name },
                    severity: 'warning'
                });
            } else if (isStartingTomorrow(r.start_date)) {
                notifications.push({
                    type: 'start_tomorrow',
                    rental: { ...r, model: r.car.model, plate_number: r.car.plate_number, full_name: r.client.full_name },
                    severity: 'info'
                });
            }
        }

        if (r.status === 'rented') {
          
            if (isStartingToday(r.return_date)) { 
                notifications.push({
                    type: 'return_today',
                    rental: { ...r, model: r.car.model, plate_number: r.car.plate_number, full_name: r.client.full_name },
                    severity: 'warning'
                });
            }
            
            // Overdue Check
            // Strict timestamp check
             if (new Date(r.return_date) < getNow()) {
                notifications.push({
                    type: 'overdue',
                    rental: { ...r, model: r.car.model, plate_number: r.car.plate_number, full_name: r.client.full_name },
                    severity: 'danger'
                });
            }
        }
    }

    // --- NEW: Check MOT Expiry ---
    const carsWithMot = await db.collection('cars').find({ 
        mot_expiry: { $exists: true, $nin: [null, ""] } 
    }).toArray();
    
    const now = getNow();
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    for (const car of carsWithMot) {
        if (!car.mot_expiry) continue;
        const expiryDate = new Date(car.mot_expiry);
        
        if (isNaN(expiryDate.getTime())) continue;

        if (expiryDate < now) {
             notifications.push({
                type: 'mot_expired',
                car: { model: car.model, plate_number: car.plate_number, mot_expiry: car.mot_expiry },
                severity: 'danger'
            });
        } else if (expiryDate <= fourDaysFromNow) {
             notifications.push({
                type: 'mot_expiring_soon',
                car: { model: car.model, plate_number: car.plate_number, mot_expiry: car.mot_expiry },
                severity: 'warning'
            });
        }
    }

    return notifications;
  },

  async getTotalRevenue(month?: string, year?: string) {
    const db = await getDatabase();
    const query: any = {};
    if (month && year) {
        const startStr = `${year}-${month.padStart(2, '0')}-01T00:00`; 
        const startUTC = toUTCISO(startStr);
        let nextMonth = parseInt(month) + 1;
        let nextYear = parseInt(year);
        if (nextMonth > 12) { nextMonth = 1; nextYear++; }
        const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00`;
        const endUTC = toUTCISO(endStr);
        
        query.start_date = { $gte: startUTC, $lt: endUTC };
    }
    const result = await db.collection('rentals').aggregate([
      { $match: query },  
      { $group: { _id: null, total: { $sum: '$rental_price' } } },
    ]).toArray();
    return result[0]?.total || 0;
  },
};

export const ExpenseModel = {
  // ... (Update ExpenseModel similarly if expenses have dates, yes they do 'expense_date') ...
  async getAll(month?: string, year?: string) {
    const db = await getDatabase();
    const query: any = {};
    if (month && year) {
        const startStr = `${year}-${month.padStart(2, '0')}-01T00:00`; 
        const startUTC = toUTCISO(startStr);
        let nextMonth = parseInt(month) + 1;
        let nextYear = parseInt(year);
        if (nextMonth > 12) { nextMonth = 1; nextYear++; }
        const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00`;
        const endUTC = toUTCISO(endStr);

        query.expense_date = { $gte: startUTC, $lt: endUTC };
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
         $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
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
          const startStr = `${year}-${month.padStart(2, '0')}-01T00:00`; 
          const startUTC = toUTCISO(startStr);
          let nextMonth = parseInt(month) + 1;
          let nextYear = parseInt(year);
          if (nextMonth > 12) { nextMonth = 1; nextYear++; }
          const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00`;
          const endUTC = toUTCISO(endStr);

          query.expense_date = { $gte: startUTC, $lt: endUTC };
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
    // Normalize date
    const dateUTC = toUTCISO(expense_date);

    return db.collection('expenses').insertOne({
      category,
      amount,
      expense_date: dateUTC,
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
    // Normalize date
    const dateUTC = toUTCISO(expense_date);

    return db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          category,
          amount,
          expense_date: dateUTC,
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


export interface Document {
  _id?: ObjectId;
  client_id: ObjectId;
  client_name: string;
  url: string;
  type: 'passport' | 'license' | 'other';
  created_at: Date;
}

export const DocumentModel = {
  async getAll(search?: string, dateFrom?: string, dateTo?: string) {
    const db = await getDatabase();
    const query: any = {};

    if (search) {
      query.client_name = { $regex: search, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.created_at = {};
      if (dateFrom) query.created_at.$gte = new Date(dateFrom);
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        query.created_at.$lte = d;
      }
    }

    return db.collection<Document>('documents').find(query).sort({ created_at: -1 }).toArray();
  },

  async create(doc: Omit<Document, '_id' | 'created_at'>) {
    const db = await getDatabase();
    const exists = await db.collection<Document>('documents').findOne({ url: doc.url });
    if (exists) return null; 

    const result = await db.collection<Document>('documents').insertOne({
      ...doc,
      created_at: new Date(),
    });
    return result;
  },
  
  async deleteByUrl(url: string) {
      const db = await getDatabase();
      return db.collection('documents').deleteOne({ url });
  },

  async deleteByClientId(clientId: string) {
      const db = await getDatabase();
      return db.collection('documents').deleteMany({ client_id: new ObjectId(clientId) });
  }
};
