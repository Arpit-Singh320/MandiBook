require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Mandi, TimeSlot, Booking, CropPrice, Notification, Issue, AuditLog } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync tables (force: true drops and recreates)
    await sequelize.sync({ force: true });
    console.log('Tables recreated');

    // ─── Admin ────────────────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Rajesh Kumar',
      role: 'admin',
      email: 'arpit@compliledger.com',
      password: 'admin123',
      language: 'en',
      department: 'Platform Operations',
      twoFactorEnabled: true,
      profileComplete: true,
    });
    console.log('Admin created: admin@mandibook.in / admin123');

    // ─── Mandis ───────────────────────────────────────────────────────────────────
    const mandi1 = await Mandi.create({
      name: 'Azadpur Mandi',
      nameHi: 'आज़ादपुर मंडी',
      code: 'AZD-001',
      address: 'Azadpur, North Delhi',
      city: 'Delhi',
      district: 'North Delhi',
      state: 'Delhi',
      pincode: '110033',
      lat: 28.7041,
      lng: 77.1775,
      contactPhone: '011-27654321',
      crops: ['Wheat', 'Rice', 'Tomato', 'Onion', 'Potato'],
      operatingHoursOpen: '05:00',
      operatingHoursClose: '18:00',
      isActive: true,
      rating: 4.5,
    });

    const mandi2 = await Mandi.create({
      name: 'Vashi APMC Market',
      nameHi: 'वाशी एपीएमसी मार्केट',
      code: 'VSH-002',
      address: 'Sector 19, Vashi',
      city: 'Navi Mumbai',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '400705',
      lat: 19.0760,
      lng: 72.9981,
      contactPhone: '022-27654321',
      crops: ['Onion', 'Potato', 'Tomato', 'Banana', 'Mango'],
      operatingHoursOpen: '04:00',
      operatingHoursClose: '16:00',
      isActive: true,
      rating: 4.2,
    });

    const mandi3 = await Mandi.create({
      name: 'Koyambedu Market',
      nameHi: 'कोयम्बेडु मार्केट',
      code: 'KYM-003',
      address: 'Koyambedu, Chennai',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600107',
      lat: 13.0693,
      lng: 80.1944,
      contactPhone: '044-27654321',
      crops: ['Rice', 'Banana', 'Coconut', 'Turmeric', 'Chilli'],
      operatingHoursOpen: '03:00',
      operatingHoursClose: '15:00',
      isActive: true,
      rating: 4.0,
    });
    console.log('3 Mandis created');

    // ─── Managers ─────────────────────────────────────────────────────────────────
    const manager1 = await User.create({
      name: 'Suresh Yadav',
      role: 'manager',
      email: 'suresh@mandibook.in',
      password: 'manager123',
      phone: '9876543210',
      language: 'hi',
      mandiId: mandi1.id,
      designation: 'Mandi Secretary',
      managingSince: new Date('2022-06-15'),
      profileComplete: true,
    });

    const manager2 = await User.create({
      name: 'Priya Sharma',
      role: 'manager',
      email: 'priya@mandibook.in',
      password: 'manager123',
      phone: '9876543211',
      language: 'en',
      mandiId: mandi2.id,
      designation: 'Market Supervisor',
      managingSince: new Date('2023-01-10'),
      profileComplete: true,
    });

    const manager3 = await User.create({
      name: 'Ravi Selvam',
      role: 'manager',
      email: 'ravi@mandibook.in',
      password: 'manager123',
      phone: '9876543212',
      language: 'en',
      mandiId: mandi3.id,
      designation: 'Market Inspector',
      managingSince: new Date('2023-08-20'),
      profileComplete: true,
    });

    // Update mandis with managerIds
    await mandi1.update({ managerId: manager1.id });
    await mandi2.update({ managerId: manager2.id });
    await mandi3.update({ managerId: manager3.id });
    console.log('3 Managers created: suresh/priya/ravi@mandibook.in / manager123');

    // ─── Farmers ──────────────────────────────────────────────────────────────────
    const farmer1 = await User.create({
      name: 'Ram Singh',
      role: 'farmer',
      phone: '9111111111',
      email: 'ram.singh@example.com',
      language: 'hi',
      village: 'Baraut',
      district: 'Baghpat',
      state: 'Uttar Pradesh',
      pincode: '250611',
      landHolding: 5.5,
      farmSize: 'Medium (2-10 acres)',
      crops: ['Wheat', 'Rice'],
      preferredMandis: [mandi1.id],
      profileComplete: true,
    });

    const farmer2 = await User.create({
      name: 'Lakshmi Devi',
      role: 'farmer',
      phone: '9222222222',
      email: 'lakshmi.devi@example.com',
      language: 'hi',
      village: 'Panvel',
      district: 'Raigad',
      state: 'Maharashtra',
      pincode: '410206',
      landHolding: 2.0,
      farmSize: 'Small (< 2 acres)',
      crops: ['Onion', 'Potato'],
      preferredMandis: [mandi2.id],
      profileComplete: true,
    });

    const farmer3 = await User.create({
      name: 'Murugan K',
      role: 'farmer',
      phone: '9333333333',
      language: 'en',
      village: 'Kancheepuram',
      district: 'Kancheepuram',
      state: 'Tamil Nadu',
      pincode: '631501',
      landHolding: 12.0,
      farmSize: 'Large (10+ acres)',
      crops: ['Rice', 'Banana'],
      preferredMandis: [mandi3.id],
      profileComplete: true,
    });
    console.log('3 Farmers created');

    // ─── Time Slots (today + tomorrow) ────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const slotTemplates = [
      { startTime: '06:00', endTime: '08:00', label: '06:00 AM - 08:00 AM', capacity: 20 },
      { startTime: '08:00', endTime: '10:00', label: '08:00 AM - 10:00 AM', capacity: 25 },
      { startTime: '10:00', endTime: '12:00', label: '10:00 AM - 12:00 PM', capacity: 20 },
      { startTime: '12:00', endTime: '14:00', label: '12:00 PM - 02:00 PM', capacity: 15 },
      { startTime: '14:00', endTime: '16:00', label: '02:00 PM - 04:00 PM', capacity: 10 },
    ];

    const allSlots = [];
    for (const mandi of [mandi1, mandi2, mandi3]) {
      for (const date of [today, tomorrow]) {
        for (const tmpl of slotTemplates) {
          allSlots.push({ mandiId: mandi.id, date, ...tmpl });
        }
      }
    }
    const createdSlots = await TimeSlot.bulkCreate(allSlots);
    console.log(`${createdSlots.length} time slots created`);

    // ─── Sample Bookings ──────────────────────────────────────────────────────────
    const slot1 = createdSlots.find((s) => s.mandiId === mandi1.id && s.date === today && s.startTime === '08:00');
    const slot2 = createdSlots.find((s) => s.mandiId === mandi2.id && s.date === today && s.startTime === '06:00');
    const slot3 = createdSlots.find((s) => s.mandiId === mandi3.id && s.date === tomorrow && s.startTime === '10:00');

    const booking1 = await Booking.create({
      bookingNumber: 'BK-2026-03-22-1001',
      farmerId: farmer1.id,
      mandiId: mandi1.id,
      slotId: slot1.id,
      date: today,
      timeSlot: slot1.label,
      cropType: 'Wheat',
      estimatedQuantity: 50,
      vehicleNumber: 'UP-14-AB-1234',
      status: 'confirmed',
      qrCodeData: 'data:image/png;base64,placeholder',
    });

    const booking2 = await Booking.create({
      bookingNumber: 'BK-2026-03-22-1002',
      farmerId: farmer2.id,
      mandiId: mandi2.id,
      slotId: slot2.id,
      date: today,
      timeSlot: slot2.label,
      cropType: 'Onion',
      estimatedQuantity: 30,
      vehicleNumber: 'MH-04-CD-5678',
      status: 'checked-in',
      checkedInAt: new Date(),
      qrCodeData: 'data:image/png;base64,placeholder',
    });

    const booking3 = await Booking.create({
      bookingNumber: 'BK-2026-03-23-1003',
      farmerId: farmer3.id,
      mandiId: mandi3.id,
      slotId: slot3.id,
      date: tomorrow,
      timeSlot: slot3.label,
      cropType: 'Rice',
      estimatedQuantity: 40,
      vehicleNumber: 'TN-01-EF-9012',
      status: 'confirmed',
      qrCodeData: 'data:image/png;base64,placeholder',
    });

    // Increment booked counts
    await slot1.increment('bookedCount');
    await slot2.increment('bookedCount');
    await slot3.increment('bookedCount');
    console.log('3 Sample bookings created');

    // ─── Crop Prices ──────────────────────────────────────────────────────────────
    const cropPriceData = [
      { crop: 'Wheat', cropHi: 'गेहूं', mandiId: mandi1.id, currentPrice: 2200, prevPrice: 2150, unit: 'quintal' },
      { crop: 'Rice', cropHi: 'चावल', mandiId: mandi1.id, currentPrice: 3200, prevPrice: 3100, unit: 'quintal' },
      { crop: 'Tomato', cropHi: 'टमाटर', mandiId: mandi1.id, currentPrice: 2500, prevPrice: 2800, unit: 'quintal' },
      { crop: 'Onion', cropHi: 'प्याज़', mandiId: mandi1.id, currentPrice: 1800, prevPrice: 1600, unit: 'quintal' },
      { crop: 'Potato', cropHi: 'आलू', mandiId: mandi1.id, currentPrice: 1200, prevPrice: 1300, unit: 'quintal' },
      { crop: 'Onion', cropHi: 'प्याज़', mandiId: mandi2.id, currentPrice: 1900, prevPrice: 1700, unit: 'quintal' },
      { crop: 'Potato', cropHi: 'आलू', mandiId: mandi2.id, currentPrice: 1100, prevPrice: 1200, unit: 'quintal' },
      { crop: 'Tomato', cropHi: 'टमाटर', mandiId: mandi2.id, currentPrice: 2300, prevPrice: 2600, unit: 'quintal' },
      { crop: 'Banana', cropHi: 'केला', mandiId: mandi2.id, currentPrice: 800, prevPrice: 750, unit: 'quintal' },
      { crop: 'Rice', cropHi: 'चावल', mandiId: mandi3.id, currentPrice: 3000, prevPrice: 2900, unit: 'quintal' },
      { crop: 'Banana', cropHi: 'केला', mandiId: mandi3.id, currentPrice: 850, prevPrice: 900, unit: 'quintal' },
      { crop: 'Coconut', cropHi: 'नारियल', mandiId: mandi3.id, currentPrice: 1500, prevPrice: 1400, unit: 'quintal' },
    ];
    await CropPrice.bulkCreate(cropPriceData.map((d) => ({ ...d, updatedBy: admin.id })));
    console.log(`${cropPriceData.length} crop prices created`);

    // ─── Sample Notifications ─────────────────────────────────────────────────────
    await Notification.bulkCreate([
      { userId: farmer1.id, type: 'booking-confirmed', title: 'Booking Confirmed', message: 'Your slot at Azadpur Mandi is confirmed for today.' },
      { userId: farmer1.id, type: 'price-alert', title: 'Price Alert: Wheat', message: 'Wheat price increased by 2.3% at Azadpur Mandi.' },
      { userId: farmer2.id, type: 'booking-confirmed', title: 'Booking Confirmed', message: 'Your slot at Vashi APMC is confirmed.' },
      { userId: manager1.id, type: 'system', title: 'New Booking', message: 'Ram Singh booked a slot for Wheat (50 quintals).' },
      { userId: manager2.id, type: 'system', title: 'Check-in Complete', message: 'Lakshmi Devi checked in for Onion delivery.' },
      { userId: admin.id, type: 'system', title: 'Platform Alert', message: '3 new farmer registrations today.' },
    ]);
    console.log('6 notifications created');

    // ─── Sample Issues ────────────────────────────────────────────────────────────
    await Issue.bulkCreate([
      { reporterId: farmer1.id, reporterName: 'Ram Singh (Farmer)', mandiId: mandi1.id, mandiName: 'Azadpur Mandi', title: 'Long wait time at gate', description: 'Waited 2 hours even with confirmed slot. Gate management needs improvement.', status: 'open', priority: 'high' },
      { reporterId: manager2.id, reporterName: 'Priya Sharma (Manager)', mandiId: mandi2.id, mandiName: 'Vashi APMC Market', title: 'System showing wrong prices', description: 'Onion prices not updated properly in the system.', status: 'in-progress', priority: 'medium' },
    ]);
    console.log('2 issues created');

    // ─── Sample Audit Logs ────────────────────────────────────────────────────────
    await AuditLog.bulkCreate([
      { userId: admin.id, userName: 'Rajesh Kumar', userRole: 'admin', action: 'Platform initialized', entity: 'System', type: 'system', ipAddress: '127.0.0.1' },
      { userId: admin.id, userName: 'Rajesh Kumar', userRole: 'admin', action: 'Registered new mandi', entity: 'Mandi', entityId: mandi1.id, details: 'Azadpur Mandi, Delhi', type: 'mandi', ipAddress: '127.0.0.1' },
      { userId: farmer1.id, userName: 'Ram Singh', userRole: 'farmer', action: 'Booking created', entity: 'Booking', entityId: booking1.id, details: 'BK-2026-03-22-1001 @ Azadpur Mandi', type: 'booking', ipAddress: '127.0.0.1' },
      { userId: manager1.id, userName: 'Suresh Yadav', userRole: 'manager', action: 'Updated Wheat price to ₹2200', entity: 'CropPrice', type: 'price', ipAddress: '127.0.0.1' },
    ]);
    console.log('4 audit logs created');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('── Login Credentials ──');
    console.log('Admin:   admin@mandibook.in / admin123 (+ 2FA via email)');
    console.log('Manager: suresh@mandibook.in / manager123');
    console.log('Manager: priya@mandibook.in / manager123');
    console.log('Manager: ravi@mandibook.in / manager123');
    console.log('Farmer:  Phone 9111111111 (OTP via Twilio)');
    console.log('Farmer:  Phone 9222222222 (OTP via Twilio)');
    console.log('Farmer:  Phone 9333333333 (OTP via Twilio)\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
