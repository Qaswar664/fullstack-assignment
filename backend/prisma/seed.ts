import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create super admin (no org yet — admin will create org via API)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      organizationId: null,
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
  console.log('');
  console.log('─────────────────────────────────────');
  console.log('Seed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('Default admin: admin@gmail.com');
  console.log('Password: admin123');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Login at POST /api/v1/auth/login');
  console.log('  2. POST /api/v1/organizations to create an organization');
  console.log('  3. POST /api/v1/users to create more users');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
