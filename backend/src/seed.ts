import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import { Resource } from "./entity/Resource";
import * as bcrypt from "bcryptjs";

async function seed() {
    await AppDataSource.initialize();
    
    const userRepo = AppDataSource.getRepository(User);
    const resourceRepo = AppDataSource.getRepository(Resource);

    // Create Admin
    const adminHash = await bcrypt.hash("admin", 10);
    let admin = await userRepo.findOneBy({ email: "admin@creh.com" });
    if (!admin) {
        admin = userRepo.create({
            name: "Admin User",
            email: "admin@creh.com",
            password_hash: adminHash,
            location: { type: "Point", coordinates: [-122.42, 37.77] } as any,
            reputation_score: 5.0
        });
        await userRepo.save(admin);
    }

    // Create Test User
    const testHash = await bcrypt.hash("test", 10);
    let testUser = await userRepo.findOneBy({ email: "test@creh.com" });
    if (!testUser) {
        testUser = userRepo.create({
            name: "Test User",
            email: "test@creh.com",
            password_hash: testHash,
            location: { type: "Point", coordinates: [-122.41, 37.78] } as any,
            reputation_score: 4.9
        });
        await userRepo.save(testUser);
    }

    // Create Resources
    const count = await resourceRepo.count();
    if (count === 0) {
        await resourceRepo.save([
            {
                owner: admin,
                title: "Professional DSLR Camera",
                description: "Canon EOS 5D Mark IV. Great for weekend shoots. Security deposit required.",
                category: "Electronics",
                location: { type: "Point", coordinates: [-122.425, 37.775] } as any,
                sharing_radius_km: 10,
                lending_duration_days: 5,
                is_donation: false
            },
            {
                owner: testUser,
                title: "Makita Power Drill Set",
                description: "Includes drill, batteries, and bit set. Please return fully charged.",
                category: "Tools",
                location: { type: "Point", coordinates: [-122.415, 37.785] } as any,
                sharing_radius_km: 5,
                lending_duration_days: 3,
                is_donation: false
            },
            {
                owner: admin,
                title: "Folding Tables (x2)",
                description: "Perfect for garage sales or community events. Free to borrow.",
                category: "Furniture",
                location: { type: "Point", coordinates: [-122.430, 37.770] } as any,
                sharing_radius_km: 20,
                lending_duration_days: 2,
                is_donation: true
            }
        ]);
        console.log("Seeded database with sample resources!");
    } else {
        console.log("Database already has resources.");
    }

    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
