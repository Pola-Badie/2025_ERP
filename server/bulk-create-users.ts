import { storage } from './storage/index.js';

// Define the users to create with their module permissions
const usersToCreate = [
  {
    name: "Michael Morgan",
    username: "michael.morgan",
    email: "michael.morgan@morganerp.com",
    password: "Password123!",
    role: "admin",
    modules: ["dashboard", "inventory", "orders", "procurement", "suppliers", "expenses", "invoices", "quotations", "accounting", "reports", "backup", "customers", "users"] // ALL modules
  },
  {
    name: "Mark Morgan", 
    username: "mark.morgan",
    email: "mark.morgan@morganerp.com",
    password: "Password123!",
    role: "admin",
    modules: ["dashboard", "inventory", "orders", "procurement", "suppliers", "expenses", "invoices", "quotations", "accounting", "reports", "backup", "customers", "users"] // ALL modules
  },
  {
    name: "Maged Yousef",
    username: "maged.yousef",
    email: "maged.yousef@morganerp.com", 
    password: "Password123!",
    role: "manager",
    modules: ["inventory", "orders", "procurement", "suppliers", "expenses", "invoices", "quotations"]
  },
  {
    name: "Hany Fakhry",
    username: "hany.fakhry",
    email: "hany.fakhry@morganerp.com",
    password: "Password123!",
    role: "manager",
    modules: ["inventory", "orders", "suppliers", "invoices", "quotations"]
  },
  {
    name: "Yousef Abd El Malak",
    username: "yousef.abdelmalak", 
    email: "yousef.abdelmalak@morganerp.com",
    password: "Password123!",
    role: "manager",
    modules: ["dashboard", "reports", "inventory", "orders", "procurement", "suppliers", "accounting", "expenses", "invoices", "quotations", "backup"]
  },
  {
    name: "Anna Simon",
    username: "anna.simon",
    email: "anna.simon@morganerp.com",
    password: "Password123!",
    role: "staff",
    modules: ["inventory", "orders", "suppliers", "invoices", "quotations"]
  },
  {
    name: "Bassem",
    username: "bassem",
    email: "bassem@morganerp.com",
    password: "Password123!",
    role: "staff",
    modules: ["inventory", "orders", "suppliers", "invoices", "quotations"]
  },
  {
    name: "Mohamed Mahmoud",
    username: "mohamed.mahmoud",
    email: "mohamed.mahmoud@morganerp.com",
    password: "Password123!",
    role: "staff",
    modules: ["inventory"] // inventory only
  }
];

async function createUsersWithPermissions() {
  console.log('🚀 Starting bulk user creation process...');
  
  try {
    for (const userData of usersToCreate) {
      console.log(`\n📝 Creating user: ${userData.name} (${userData.username})`);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      // Create the user
      const newUser = await storage.createUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: userData.password, // Will be hashed by the storage layer
        role: userData.role,
        status: 'active'
      });
      
      console.log(`✅ Created user: ${newUser.name} (ID: ${newUser.id})`);
      
      // Create permissions for each module
      for (const moduleName of userData.modules) {
        try {
          await storage.createUserPermission({
            userId: newUser.id,
            moduleName: moduleName,
            accessGranted: true
          });
          console.log(`  ✅ Granted access to module: ${moduleName}`);
        } catch (permError) {
          console.log(`  ⚠️  Permission for ${moduleName} may already exist`);
        }
      }
      
      console.log(`🎉 Completed setup for ${userData.name}`);
    }
    
    console.log('\n🎊 Bulk user creation completed successfully!');
    
    // Display summary
    const allUsers = await storage.getUsers();
    console.log(`\n📊 Total users in system: ${allUsers.length}`);
    
    for (const user of allUsers) {
      const permissions = await storage.getUserPermissions(user.id);
      console.log(`  - ${user.name} (${user.role}): ${permissions.length} modules`);
    }
    
  } catch (error) {
    console.error('❌ Error during bulk user creation:', error);
    throw error;
  }
}

// Export for use in API routes or direct execution
export { createUsersWithPermissions, usersToCreate };

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createUsersWithPermissions()
    .then(() => {
      console.log('✨ Bulk user creation script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Bulk user creation script failed:', error);
      process.exit(1);
    });
}