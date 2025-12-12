import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

import { db } from '@/lib/db';
import { categories as categoriesTable } from '@/lib/db/schema';
import { ilike, or } from 'drizzle-orm';

async function cleanupCategories() {
    console.log('🔍 Checking for Test categories...');
    const testCategories = await db.select().from(categoriesTable).where(
        or(
            ilike(categoriesTable.name, '%test%'),
            ilike(categoriesTable.slug, '%test%')
        )
    );

    if (testCategories.length > 0) {
        console.log(`Found ${testCategories.length} test categories:`, testCategories.map(c => c.name));
        // Uncomment to delete
        // await db.delete(categoriesTable).where(
        //   or(
        //     ilike(categoriesTable.name, '%test%'),
        //     ilike(categoriesTable.slug, '%test%')
        //   )
        // );
        // console.log('🗑️ Deleted test categories.');
    } else {
        console.log('✅ No test categories found.');
    }

    const allCategories = await db.select().from(categoriesTable);
    console.log('📂 All Categories:', allCategories.map(c => `${c.name} (${c.slug})`));
}

cleanupCategories().catch(console.error);
