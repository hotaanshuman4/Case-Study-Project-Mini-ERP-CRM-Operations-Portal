import bcrypt from 'bcryptjs';
import prisma from './config/database';

const Role = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTS: 'ACCOUNTS',
} as const;

const CustomerType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  DISTRIBUTOR: 'DISTRIBUTOR',
} as const;

const CustomerStatus = {
  LEAD: 'LEAD',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

const MovementType = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Create Users ──────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@erp.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@erp.com' },
    update: {},
    create: {
      name: 'Rahul Sales',
      email: 'sales@erp.com',
      password: await bcrypt.hash('Sales@123', 12),
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@erp.com' },
    update: {},
    create: {
      name: 'Suresh Warehouse',
      email: 'warehouse@erp.com',
      password: await bcrypt.hash('Warehouse@123', 12),
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@erp.com' },
    update: {},
    create: {
      name: 'Priya Accounts',
      email: 'accounts@erp.com',
      password: await bcrypt.hash('Accounts@123', 12),
      role: Role.ACCOUNTS,
    },
  });

  console.log('✅ Users created');

  // ─── Create Customers ──────────────────────────────────────────────────────
  await Promise.all([
    prisma.customer.upsert({
      where: { id: 'cust-001' },
      update: {},
      create: {
        id: 'cust-001',
        name: 'Amit Sharma',
        mobile: '9876543210',
        email: 'amit@sharma-traders.com',
        businessName: 'Sharma Traders',
        gstNumber: '27AAPFU0939F1ZV',
        customerType: CustomerType.WHOLESALE,
        address: '45 MG Road, Mumbai, Maharashtra 400001',
        status: CustomerStatus.ACTIVE,
        followUpDate: new Date('2026-08-15'),
        notes: 'Key wholesale client. Prefers bulk orders.',
        createdBy: admin.id,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-002' },
      update: {},
      create: {
        id: 'cust-002',
        name: 'Priya Patel',
        mobile: '9123456789',
        email: 'priya@retail-plus.in',
        businessName: 'Retail Plus',
        customerType: CustomerType.RETAIL,
        address: '12 Commercial Complex, Ahmedabad, Gujarat 380001',
        status: CustomerStatus.ACTIVE,
        createdBy: salesUser.id,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-003' },
      update: {},
      create: {
        id: 'cust-003',
        name: 'Vikram Mehta',
        mobile: '9988776655',
        businessName: 'Mehta Distributors',
        gstNumber: '24ABCDE1234F1ZV',
        customerType: CustomerType.DISTRIBUTOR,
        address: 'Plot 78, Industrial Area, Surat, Gujarat 395010',
        status: CustomerStatus.LEAD,
        followUpDate: new Date('2026-08-20'),
        notes: 'Contacted at trade fair. Interested in bulk pricing.',
        createdBy: salesUser.id,
      },
    }),
  ]);

  console.log('✅ Customers created');

  // ─── Add Follow-ups ────────────────────────────────────────────────────────
  for (const fu of [
    { customerId: 'cust-001', note: 'Called to discuss Q3 order. Confirmed interest in 500 units.', createdBy: salesUser.id },
    { customerId: 'cust-001', note: 'Sent revised pricing sheet. Awaiting confirmation.', createdBy: admin.id },
    { customerId: 'cust-003', note: 'First follow-up call done. Meeting scheduled for next week.', createdBy: salesUser.id },
  ]) {
    await prisma.customerFollowUp.create({ data: fu });
  }

  console.log('✅ Follow-ups created');

  // ─── Create Products ───────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'ELEC-WF-001' },
      update: {},
      create: {
        name: 'Industrial Water Filter 10L',
        sku: 'ELEC-WF-001',
        category: 'Filtration',
        unitPrice: 4500.00,
        currentStock: 150,
        minStockAlert: 20,
        location: 'Warehouse A - Shelf 3',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PUMP-WP-002' },
      update: {},
      create: {
        name: 'Submersible Water Pump 1HP',
        sku: 'PUMP-WP-002',
        category: 'Pumps',
        unitPrice: 8750.00,
        currentStock: 45,
        minStockAlert: 10,
        location: 'Warehouse B - Rack 1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PIPE-PVC-003' },
      update: {},
      create: {
        name: 'PVC Pipe 4 inch (per meter)',
        sku: 'PIPE-PVC-003',
        category: 'Pipes',
        unitPrice: 285.00,
        currentStock: 8,
        minStockAlert: 50,
        location: 'Warehouse A - Ground',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'VALV-MS-004' },
      update: {},
      create: {
        name: 'MS Gate Valve 2 inch',
        sku: 'VALV-MS-004',
        category: 'Valves',
        unitPrice: 1200.00,
        currentStock: 200,
        minStockAlert: 30,
        location: 'Warehouse A - Shelf 7',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'MOTR-EL-005' },
      update: {},
      create: {
        name: 'Electric Motor 2HP 3-Phase',
        sku: 'MOTR-EL-005',
        category: 'Motors',
        unitPrice: 12500.00,
        currentStock: 25,
        minStockAlert: 5,
        location: 'Warehouse B - Rack 3',
      },
    }),
  ]);

  console.log('✅ Products created');

  // ─── Log initial stock movements ───────────────────────────────────────────
  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        quantityChanged: p.currentStock,
        movementType: MovementType.IN,
        reason: 'Initial inventory setup',
        createdBy: warehouseUser.id,
      },
    });
  }

  console.log('✅ Stock movements logged');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('─'.repeat(50));
  console.log('📋 Login Credentials:');
  console.log('  Admin:     admin@erp.com     / Admin@123');
  console.log('  Sales:     sales@erp.com     / Sales@123');
  console.log('  Warehouse: warehouse@erp.com / Warehouse@123');
  console.log('  Accounts:  accounts@erp.com  / Accounts@123');
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
