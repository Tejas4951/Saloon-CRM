import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  mockAppointments,
  mockCustomers,
  mockEmployees,
  mockProducts,
  mockServices,
  mockTallyItems,
} from '../src/data/mockData.ts';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in frontend/.env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uuid = (group: string, index: number) =>
  `${group}0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const isoDate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const isoTimestamp = (daysAgo = 0, hour = 10) => `${isoDate(daysAgo)}T${String(hour).padStart(2, '0')}:00:00.000Z`;

const databaseTime = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
};

const assertResult = (label: string, result: { error: { message: string } | null }) => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
};

const main = async () => {
  const shopResult = await supabase.from('shops').select('id, shop_name').eq('is_available', true).order('id').limit(1).single();
  assertResult('Load active shop', shopResult);
  const shopId = shopResult.data.id;

  const currentServicesResult = await supabase.from('services').select('id, service_name').eq('shop_id', shopId);
  assertResult('Load services', currentServicesResult);
  const existingNames = new Set((currentServicesResult.data || []).map((row) => row.service_name.toLowerCase()));
  const missingServices = mockServices
    .filter((service) => !existingNames.has(service.name.toLowerCase()))
    .map((service) => ({
      shop_id: shopId,
      service_name: service.name,
      category: service.category,
      description: service.description,
      total_price: service.price,
      duration_minutes: service.duration,
      gender_applicable: 'UNISEX',
      is_active: true,
    }));
  if (missingServices.length) {
    assertResult('Insert missing services', await supabase.from('services').insert(missingServices));
  }

  const servicesResult = await supabase.from('services').select('id, service_name').eq('shop_id', shopId).eq('is_active', true);
  assertResult('Reload services', servicesResult);
  const serviceIdByName = new Map((servicesResult.data || []).map((row) => [row.service_name, row.id]));

  const staffRows = mockEmployees.map((employee, index) => ({
    id: uuid('a', index + 1),
    shop_id: shopId,
    name: employee.name,
    role: employee.role,
    photo: employee.photo,
    available: employee.available,
    specialties: employee.specialties,
    rating: employee.rating,
    next_available: isoTimestamp(index, 11 + index),
    working_start: employee.workingHours.start,
    working_end: employee.workingHours.end,
    updated_at: new Date().toISOString(),
  }));
  assertResult('Seed staff', await supabase.from('staff_members').upsert(staffRows, { onConflict: 'id' }));

  const customerRows = mockCustomers.map((customer, index) => ({
    id: uuid('c', index + 1),
    shop_id: shopId,
    name: customer.name,
    phone: customer.id === '6' ? '+91 98765 43217' : customer.phone,
    email: customer.email,
    gender: customer.gender,
    visit_count: customer.visitCount,
    last_visit: isoTimestamp(index % 8, 12),
    total_spent: customer.totalSpent,
    pending_amount: index === 2 ? 800 : index === 4 ? 1500 : index === 7 ? 2500 : 0,
    preferred_services: customer.preferredServices,
    notes: customer.notes,
    photo: customer.photo.startsWith('/') ? customer.photo : `/${customer.photo}`,
    created_at: isoTimestamp(index, 9),
    updated_at: new Date().toISOString(),
  }));
  assertResult('Seed customers', await supabase.from('customers').upsert(customerRows, { onConflict: 'id' }));

  const customerIdByMockId = new Map(mockCustomers.map((customer, index) => [customer.id, uuid('c', index + 1)]));
  const customerByMockId = new Map(mockCustomers.map((customer) => [customer.id, customer]));
  const staffIdByMockId = new Map(mockEmployees.map((employee, index) => [employee.id, uuid('a', index + 1)]));
  const staffByMockId = new Map(mockEmployees.map((employee) => [employee.id, employee]));
  const serviceNameByMockId = new Map(mockServices.map((service) => [service.id, service.name]));

  const appointmentRows = mockAppointments.map((appointment, index) => {
    const customer = customerByMockId.get(appointment.customerId);
    const employee = staffByMockId.get(appointment.employeeId);
    const serviceNames = appointment.serviceIds.map((id) => serviceNameByMockId.get(id)).filter(Boolean) as string[];
    return {
      id: uuid('b', index + 1),
      shop_id: shopId,
      customer_id: customerIdByMockId.get(appointment.customerId),
      customer_name: customer?.name || 'Walk-in Customer',
      customer_phone: customer?.phone || null,
      employee_id: null,
      staff_member_id: staffIdByMockId.get(appointment.employeeId),
      employee_name: employee?.name || null,
      service_ids: serviceNames.map((name) => serviceIdByName.get(name)).filter(Boolean),
      service_names: serviceNames,
      appointment_date: appointment.date,
      appointment_time: databaseTime(appointment.time),
      status: appointment.status,
      total: appointment.total,
      notes: appointment.notes,
      updated_at: new Date().toISOString(),
    };
  });
  assertResult('Seed appointments', await supabase.from('appointments').upsert(appointmentRows, { onConflict: 'id' }));

  const tallyRows = mockTallyItems.map((item, index) => ({
    id: uuid('9', index + 1),
    shop_id: shopId,
    entry_date: item.date,
    entry_time: databaseTime(item.time),
    customer_name: item.customerName,
    customer_phone: item.customerPhone,
    staff_name: item.staffName,
    services: item.services,
    total_cost: item.totalCost,
    payment_method: item.paymentMethod,
    payment_status: item.paymentStatus,
    payment_date: item.paymentDate || null,
    upi_transaction_id: item.upiTransactionId || null,
    created_at: `${item.date}T${databaseTime(item.time)}`,
    updated_at: new Date().toISOString(),
  }));
  assertResult('Seed billing entries', await supabase.from('tally_items').upsert(tallyRows, { onConflict: 'id' }));

  const extraInventory = [
    { name: 'Organic Facial Cleanser', category: 'Skin Care', brand: 'GlowNat', stock: 3, inUseStock: 1, minThreshold: 5, price: 890, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop', description: 'Gentle organic face wash suitable for sensitive skin' },
    { name: 'Argan Hair Oil', category: 'Hair Care', brand: 'MorocCare', stock: 4, inUseStock: 2, minThreshold: 6, price: 950, image: 'https://images.unsplash.com/photo-1608248597261-833258657640?w=300&h=300&fit=crop', description: 'Pure argan oil serum for frizz control and shine' },
  ];
  const inventorySource = [
    ...mockProducts.map((product, index) => ({ ...product, inUseStock: [3, 2, 1, 4][index], minThreshold: [5, 5, 4, 8][index] })),
    ...extraInventory,
  ];
  const inventoryRows = inventorySource.map((product, index) => ({
    id: uuid('d', index + 1),
    shop_id: shopId,
    name: product.name,
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    in_use_stock: product.inUseStock,
    min_threshold: product.minThreshold,
    price: product.price,
    image: product.image,
    description: product.description,
    updated_at: new Date().toISOString(),
  }));
  assertResult('Seed inventory', await supabase.from('inventory_items').upsert(inventoryRows, { onConflict: 'id' }));

  const inUseRows = [
    { id: uuid('7', 1), item_id: uuid('d', 1), quantity: 3, assigned_station: 'Wash Station 1 & 2', opened_date: isoDate(), notes: 'In active use by hair stylists' },
    { id: uuid('7', 2), item_id: uuid('d', 2), quantity: 2, assigned_station: 'Spa Section', opened_date: isoDate(), notes: 'Opened for deep hair treatment appointments' },
  ];
  assertResult('Seed in-use inventory', await supabase.from('inventory_in_use').upsert(inUseRows, { onConflict: 'id' }));

  const storeProducts = [
    { name: 'Professional Shampoo & Haircare Kit', category: 'Hair Care', brand: 'SalonPro', price: 850, stock: 20, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop', description: 'Sulfate-free professional shampoo and repair serum set for glossy hair.' },
    { name: 'Hydrating Keratin Hair Mask', category: 'Hair Care', brand: 'SalonPro', price: 1200, stock: 15, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop', description: 'Deep nourishing conditioning hair mask for damaged hair treatment.' },
    { name: 'Vitamin C Radiance Glow Serum', category: 'Skin Care', brand: 'BeautyLux', price: 1850, stock: 10, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop', description: 'Premium anti-aging antioxidant face serum for glowing skin.' },
    { name: 'Luxury Gel Nail Polish Collection', category: 'Nails', brand: 'ColorPop', price: 650, stock: 25, image: 'https://images.unsplash.com/photo-1586706040906-c5250b9241e3?w=300&h=300&fit=crop', description: 'Set of 5 trending long-lasting salon gel nail shades.' },
    { name: 'Organic Face Cleanser & Scrub', category: 'Skin Care', brand: 'GlowNat', price: 950, stock: 8, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=300&fit=crop', description: 'Natural organic cleanser for gentle facial exfoliation.' },
  ];
  const storeProductRows = storeProducts.map((product, index) => ({ id: uuid('e', index + 1), shop_id: shopId, ...product, status: 'active', updated_at: new Date().toISOString() }));
  assertResult('Seed store products', await supabase.from('store_products').upsert(storeProductRows, { onConflict: 'id' }));

  const orderRows = [
    { id: uuid('f', 1), shop_id: shopId, order_number: 'ORD-8921', customer_name: 'Ananya Gupta', customer_phone: '+91 99887 76655', delivery_type: 'delivery', address: 'Flat 402, Koregaon Park, Pune', total_amount: 2700, payment_method: 'upi', payment_status: 'completed', order_status: 'processing', notes: 'Please call before delivery', created_at: isoTimestamp(0, 14), updated_at: new Date().toISOString() },
    { id: uuid('f', 2), shop_id: shopId, order_number: 'ORD-8922', customer_name: 'Rahul Deshpande', customer_phone: '+91 98765 43210', delivery_type: 'pickup', address: null, total_amount: 1200, payment_method: 'cash', payment_status: 'pending', order_status: 'pending', notes: 'Will pick up during appointment', created_at: isoTimestamp(1, 16), updated_at: new Date().toISOString() },
  ];
  assertResult('Seed store orders', await supabase.from('store_orders').upsert(orderRows, { onConflict: 'id' }));

  const orderItemRows = [
    { id: uuid('6', 1), order_id: uuid('f', 1), product_id: uuid('e', 1), product_name: storeProducts[0].name, product_image: storeProducts[0].image, price: 850, quantity: 1 },
    { id: uuid('6', 2), order_id: uuid('f', 1), product_id: uuid('e', 3), product_name: storeProducts[2].name, product_image: storeProducts[2].image, price: 1850, quantity: 1 },
    { id: uuid('6', 3), order_id: uuid('f', 2), product_id: uuid('e', 2), product_name: storeProducts[1].name, product_image: storeProducts[1].image, price: 1200, quantity: 1 },
  ];
  assertResult('Seed store order items', await supabase.from('store_order_items').upsert(orderItemRows, { onConflict: 'id' }));

  const expenseSource = [
    ['Monthly Salon Rent', 'Rent & Utilities', 25000, 'Koregaon Park branch rent'],
    ['Electricity & Internet', 'Rent & Utilities', 5000, 'Monthly utilities'],
    ['Staff Incentives', 'Staff', 12000, 'Performance incentives'],
    ['Professional Hair Products', 'Products', 8500, 'Salon consumables restock'],
    ['Social Media Campaign', 'Marketing', 5000, 'Local Instagram promotion'],
    ['AC Maintenance', 'Maintenance', 4500, 'Quarterly service'],
  ];
  const expenseRows = expenseSource.map(([title, category, amount, notes], index) => ({
    id: uuid('8', index + 1), shop_id: shopId, title, category, amount, notes,
    expense_date: isoDate(index * 2), created_at: isoTimestamp(index * 2, 8),
  }));
  assertResult('Seed expenses', await supabase.from('expenses').upsert(expenseRows, { onConflict: 'id' }));

  const tables = ['shops', 'services', 'customers', 'appointments', 'tally_items', 'expenses', 'inventory_items', 'inventory_in_use', 'store_products', 'store_orders', 'store_order_items', 'staff_members'];
  const counts: Record<string, number | null> = {};
  for (const table of tables) {
    const result = await supabase.from(table).select('*', { count: 'exact', head: true });
    assertResult(`Count ${table}`, result);
    counts[table] = result.count;
  }
  console.log(JSON.stringify({ shop: shopResult.data.shop_name, counts }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
