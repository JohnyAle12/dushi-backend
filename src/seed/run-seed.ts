import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedSalesService } from './seed-sales.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error'],
  });

  const seedSales = app.get(SeedSalesService);
  const argCount = process.argv[2] ?? process.env.SEED_COUNT;
  const count = argCount ? parseInt(String(argCount), 10) : 30;

  try {
    await seedSales.run(count);
    console.log(`Created ${count} sample sales.`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
