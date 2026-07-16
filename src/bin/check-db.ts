import { db } from "../server/db";

async function main() {
  console.log("=== CHECKING STATES ===");
  const states = await db.state.findMany({
    include: {
      cities: {
        include: {
          locations: {
            include: {
              directoryProfile: true
            }
          }
        }
      }
    }
  });

  for (const s of states) {
    console.log(`State: ${s.name} (${s.slug}) | Status: ${s.status} | Indexed: ${s.isIndexed}`);
    for (const c of s.cities) {
      console.log(`  City: ${c.name} (${c.slug}) | Status: ${c.status} | Indexed: ${c.isIndexed}`);
      for (const l of c.locations) {
        console.log(`    Location: ${l.address} | Status: ${l.status}`);
        if (l.directoryProfile) {
          console.log(`      Profile: ${l.directoryProfile.name} (${l.directoryProfile.slug}) | Status: ${l.directoryProfile.status}`);
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await db.$disconnect();
  });
