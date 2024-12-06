const { MongoClient, ObjectId, Double } = require("mongodb");

const uri = process.env.MONGO_URL || "mongodb://localhost:27017";

//Mongo check seller existence
async function checkSellerExist(sellerEmail) {
  console.log("seller Authentication", sellerEmail);
  const client = new MongoClient(uri);
  try {
    const db = client.db("mongoFlora");
    const farmer_data = db.collection("farmer");

    const results = await farmer_data.findOne({ email : sellerEmail})
    return results;
    } finally {
        await client.close();
    }
}
//Mongo get Expense
async function getExpensesByFarmerId(farmer_id) {
  console.log("getExpense", farmer_id);
  const client = new MongoClient(uri);
  if (!farmer_id || !ObjectId.isValid(farmer_id)) {
    console.error("Invalid Farmer ID:", farmer_id);
    return []; // Return an empty array for invalid or undefined farmer_id
  }

    try {
      const db = client.db("mongoFlora");
      const expense_data = db.collection("expense");
      const results = await expense_data.aggregate([
        {
          $match: {
            "farmer.farmer_id": new ObjectId(farmer_id),
          },
        },
        {
          $unwind: "$farmer",
        },
        {
          $project: {
            "farmer.first_name": 1,
            "farmer.last_name": 1,
            "farmer.farmer_id": 1,
            expense_id: "$_id",
            amount: 1,
            date: {
              $dateToString: { format: "%d/%m/%Y", date: "$date" }, 
            },
            "expense_category.category_name": 1,
          },
        },
      ]).toArray();
      console.log("👻 Viewing expense",results);
      return results;
    } finally {
      await client.close();
    }
}
//Mongo get farmer_id by expense_id
async function getFarmerByExpenseId(expense_id) {
  console.log("getExpense", expense_id);
  const client = new MongoClient(uri);
  if (!expense_id || !ObjectId.isValid(expense_id)) {
    console.error("Invalid Expense ID:", expense_id);
    return []; // Return an empty array for invalid or undefined farmer_id
  }

    try {
      const db = client.db("mongoFlora");
      const expense_data = db.collection("expense");
      const results = await expense_data.aggregate([
        {
          $match: {
            "_id": new ObjectId(expense_id),
          },
        },
        {
          $unwind: "$farmer",
        },
        {
          $project: {
            "_id": 0,
            "farmer.farmer_id": 1
          },
        },
      ]).toArray();
      console.log("👻 Viewing expense",results);
      return results;
    } finally {
      await client.close();
    }
}
//Mongo get farmer_id by harvest_id
async function getFarmerByHarvestId(harvest_id) {
  console.log("getFarmer", harvest_id);
  const client = new MongoClient(uri);
  if (!harvest_id || !ObjectId.isValid(harvest_id)) {
    console.error("Invalid Expense ID:", harvest_id);
    return []; // Return an empty array for invalid or undefined farmer_id
  }

    try {
      const db = client.db("mongoFlora");
      const product_data = db.collection("product");
      const results = await product_data.aggregate([
        {
          $match: {
            "harvest.harvest_id": new ObjectId(harvest_id),
          },
        },
        {
          $unwind: "$farmer",
        },
        {
          $project: {
            "_id": 0,
            "farmer.farmer_id": 1
          },
        },
      ]).toArray();
      console.log("👻 Viewing Product",results);
      return results;
    } finally {
      await client.close();
    }
}
//Mongo View Inventory
async function getInventoryByFarmerId(farmer_id) {
  console.log("getInventory", farmer_id);
  const client = new MongoClient(uri);
  if (!farmer_id || !ObjectId.isValid(farmer_id)) {
    console.error("Invalid Farmer ID:", farmer_id);
    return []; // Return an empty array for invalid or undefined farmer_id
  }

    try {
      const db = client.db("mongoFlora");
      const product_data = db.collection("product");
      const results = await product_data.aggregate([
        {
          $match: {
            "farmer.farmer_id": new ObjectId(farmer_id), // Match farmer_id
          },
        },
        {
          $unwind: "$harvest", // Unwind the harvest array to separate documents for each entry
        },
        {
          $project: {
            product_name: 1,
            inventory_id: "$_id",
            "harvest.date": {
              $dateToString: { format: "%d/%m/%Y", date: "$harvest.date" }, 
            },
            "harvest.quantity_in_bundles": 1,
            "farmer.first_name": 1,
            "farmer.last_name": 1,
            "farmer.farmer_id": 1,
            "harvest.harvest_id":1,
          },
        },
      ]).toArray();

      console.log(results);
      return results;
    } finally {
      await client.close();
    }
}

//mongo Get Farmer by farmerID
async function getFarmerByFarmerId(farmer_id) {
  console.log("getFarmer", farmer_id);
  const client = new MongoClient(uri);
  if (!farmer_id || !ObjectId.isValid(farmer_id)) {
    console.error("Invalid Farmer ID:", farmer_id);
    return []; // Return an empty array for invalid or undefined farmer_id
  }

    try {
      const db = client.db("mongoFlora");
      const farmer_data = db.collection("farmer");
      const results = await farmer_data.aggregate([
        {
          $match: {
            "farmer_id": new ObjectId(farmer_id),
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $project: {
            farmer_id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            city: 1,
            state: 1,
            lat: 1,
            long: 1,
          },
        },
      ]).toArray();
      return results;
    } finally {
      await client.close();
    }
}

//Mongo Get Expenseby ExpenseId
async function getExpensesByExpenseId(expense_id) {
  console.log("getExpenseByExpenseID", expense_id);

  const client = new MongoClient(uri);
  try {
      const db = client.db("mongoFlora");
      const expenseCollection = db.collection("expense");
  
      const results = await expenseCollection.aggregate([
        {
          $match: { _id: new ObjectId(expense_id) }
        },
        {
          $sort: { date: -1 },
        },
        {
          $project: {
            _id: 0,
            expense_id: "$_id",
            amount: 1,
            date: {
              $dateToString: { format: "%d/%m/%Y", date: "$date" }, 
            },
            "expense_category.category_name": 1,
          },
        },
      ]).toArray();
      console.log("Expense by expenseId", results);
      return results;
    } finally {
      await client.close();
    }

}

//mongo Add Seller
async function addSeller(first_name,last_name,email,zip_code,contact_number,current_address,city,state) {
  const client = new MongoClient(uri);
  const farmerObject = new ObjectId();
  const sellerDocument = {
    farmer_id: farmerObject,
    first_name: first_name,
    last_name: last_name,
    email: email,
    zipcode: zip_code,
    contact_number: contact_number,
    address: current_address,
    city: city,
    state: state,
    created_at: new Date() // Add a timestamp for record creation
  };
  console.log(sellerDocument);
  
    try {
      const db = client.db("mongoFlora");
      const farmer_data = db.collection("farmer");
      const results = await farmer_data.insertOne(sellerDocument);
      console.log(results);
      return results;
    } finally {
      await client.close();
    }
  }


//Mongo Add Expense
async function addExpense(farmer_id, category_name, date, amount) {
  const client = new MongoClient(uri);
  
  const farmer_data = await getFarmerByFarmerId(farmer_id);
  console.log(farmer_data);
    try {
      const db = client.db("mongoFlora");
      const expense_data = db.collection("expense");
      const results = await expense_data.insertOne({
        amount: new Double(amount),
        date: new Date(date),
        farmer: farmer_data,
        expense_category: {
          category_name: category_name
        }
      });
      console.log(results);
      return results;
    }
    finally {
      await client.close();
    }
}

//Mongo update Expense
async function updateExpensesById(expense_id, amount, date) {
  console.log("updateExpenseById", expense_id, amount, date);

  const client = new MongoClient(uri);

  try {
    const db = client.db("mongoFlora");
    const expenseCollection = db.collection("expense");
    const results = await expenseCollection.updateOne(
      { _id: new ObjectId(expense_id) }, 
      { $set: { amount: amount, date: new Date(date) } }
    );
    return results;
  }finally { 
    await client.close();
  }
}
//Mongo update Inventory
async function updateInventoryById(harvest_id, quantity_in_bundles, product_name, date) {
  console.log("updateInventoryById", harvest_id, quantity_in_bundles, product_name, date);

  const client = new MongoClient(uri);

  try {
    const db = client.db("mongoFlora");
    const productCollection = db.collection("product");
    const results = await productCollection.updateOne(
      {
        "harvest.harvest_id": new ObjectId(harvest_id),
        product_name: product_name
      },
      {
        $set: {
          "harvest.$.quantity_in_bundles": quantity_in_bundles,
          "harvest.$.updated_at": new Date()
        }
      }
    );
    console.log(results);
    return results;
  }finally { 
    await client.close();
  }
}
//Mongo delete Expense
async function deleteExpenseById(expense_id) {
  console.log("deleteExpenseByID", expense_id);
  const client = new MongoClient(uri);

  if (!ObjectId.isValid(expense_id)) {
      console.error("Invalid expense ID format:", expense_id);
      return { acknowledged: false, deletedCount: 0 };
  }

  try {
      const db = client.db("mongoFlora");
      const expenseCollection = db.collection("expense");
      const results = await expenseCollection.deleteOne({ _id: new ObjectId(expense_id) });

      console.log(results);
      return results;
  } finally {
      await client.close();
  }
}

//Mongo Delete Inventory
async function deleteInventoryById(harvest_id, inventory) {
  console.log("deleteInventoryByID", harvest_id);

  const client = new MongoClient(uri);


  try {
    const db = client.db("mongoFlora");
    const productCollection = db.collection("product");
    const objectId = new ObjectId(harvest_id);
    const results = await productCollection.updateOne(
      { "harvest.harvest_id": objectId }, 
      { $pull: { harvest: { harvest_id: objectId } } }  
    );

    if (results.modifiedCount > 0) {
      console.log("Harvest deleted successfully.");
    } else {
      console.log("No matching harvest found.");
    }

    console.log("Delete Result:", results);
    return results;
  } finally {
    await client.close();
  }
}

module.exports.checkSellerExist = checkSellerExist;
module.exports.getExpensesByFarmerId = getExpensesByFarmerId;
module.exports.getFarmerByExpenseId = getFarmerByExpenseId;
module.exports.getFarmerByHarvestId = getFarmerByHarvestId;
module.exports.getInventoryByFarmerId = getInventoryByFarmerId;
module.exports.getFarmerByFarmerId = getFarmerByFarmerId;
module.exports.getExpensesByExpenseId = getExpensesByExpenseId;
module.exports.addSeller = addSeller;
module.exports.addExpense = addExpense;
module.exports.updateExpensesById = updateExpensesById;
module.exports.updateInventoryById = updateInventoryById;
module.exports.deleteExpenseById = deleteExpenseById;
module.exports.deleteInventoryById = deleteInventoryById;

