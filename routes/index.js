const express = require("express");
const router = express.Router();

const myDb = require("../db/myMongoDB.js");

/* GET home page. */
router.get("/", async function (req, res, next) {
  /*if (req.session && req.session.seller) {
    // If the seller session exists, redirect to sellerOptions
    const farmerId = req.session.seller.id;
    return res.redirect(`/seller/sellerOptions?farmer_id=${farmerId}`);
  }*/

  // If no session, redirect to login page or references page
  res.redirect("/references");
});

router.get("/about", async function (req, res, next) {
  res.render("./pages/about");
})

// Middleware to require seller session
function requireSellerSession(req, res, next) {
  if (!req.session || !req.session.seller) {
    return res.redirect("/seller/?msg=Please log in");
  }
  next();
}

// Route to handle seller login/register
router.get("/seller", (req, res) => {
  const msg = req.query.msg || null;
  const type = req.query.type || null;
  if (req.session && req.session.seller) {
    // If the seller session exists, redirect to sellerOptions
    const farmerId = req.session.seller.id;
    return res.redirect(`/seller/sellerOptions?farmer_id=${farmerId}`);
  }
  res.render("./pages/seller" , { msg, type});
});

/* POST request to check seller authentication */
// Check if the seller exists
router.post("/checkSeller", async (req, res) => {
  const email = req.body.sellerEmail;

  try {
    // Call the function to check if the seller exists
    const seller = await myDb.checkSellerExist(email);
    console.log("👉 seller", seller);

    if (seller) {
        // Store seller information in the session
        req.session.seller = {
        id: seller.farmer_id,
        email: seller.email,
        name: `${seller.first_name} ${seller.last_name}`,
      };
  
      console.log("Session created:", req.session.seller);
      // If seller exists, redirect to options page with farmer_id as query parameter
      const farmerId = seller.farmer_id; // Assuming you get farmer_id from the seller object
      res.redirect(`/seller/sellerOptions?farmer_id=${farmerId}`);
    } else {
      // If seller doesn't exist, redirect to the seller registration page
      res.redirect("/seller/?msg=Oops! User not Found");
    }
  } catch (error) {
    console.error("Error checking seller existence:", error);
    res.status(500).send("Server error");
  }
});

router.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Unable to log out. Please try again.");
    }
    // Clear the cookie associated with the session
    res.clearCookie("connect.sid");

    // Redirect the user to the home page or login page
    res.redirect("/");
  });
});

/* Seller Options */
router.get("/seller/sellerOptions", requireSellerSession, async (req, res) => {
  const farmerId = req.session.seller.id; // Get farmer_id from query parameters

  if (!farmerId) {
      return res.status(400).send('Farmer ID is required');
  }

  //let ObjectId = new ObjectId(farmerId);
  // Fetch expenses and inventory based on farmerId
  try {
      const expenses = await myDb.getExpensesByFarmerId(farmerId); // Define this function to fetch expenses
      const inventory = await myDb.getInventoryByFarmerId(farmerId); // Define this function to fetch inventory

      const expires = req.session.cookie.expires; // Get the expiration time

      // Render the seller options page
      res.render('pages/sellerOptions', { // Fixed the path to the render method
          Expense: expenses,
          Inventory: inventory,
          farmer_id: farmerId,
          msg: expenses.length === 0 && inventory.length === 0
            ? "No expenses and inventory found for this farmer."
            : null,
          expires, //to display expiration time in web page
          //showLogout: true, // Show logout in navbar
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

/* GET seller registration page */
router.get("/registerSeller", (req, res) => {
  res.render("./pages/registerSeller");
});

/* POST seller registration page */
router.post("/createSeller", async (req, res, next) => {
  console.log("Seller", req.body);
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const zip_code = req.body.zip_code;
  const contact_number = req.body.contact_number;
  const current_address = req.body.current_address;
  const city = req.body.city;
  const state = req.body.state;
  if (!contact_number) {
    return res.status(400).send('Contact number is required.');
  }
  try {
    const seller = await myDb.checkSellerExist(email);

    if (seller) {
      // If seller exists, render options page for the seller
      res.redirect("/seller/?msg=Seller Exists. Please Login with Registered Emaild");
    } else {
      let updateResult = await myDb.addSeller(first_name,last_name,email,zip_code,contact_number,current_address,city,state);
      console.log("addSeller", updateResult);
  
      if (updateResult.acknowledged) {
        res.redirect(`/seller/?msg=User Created Successfully. Please Login with Registered Email&type=success`);
      } else {
        res.redirect(`/seller/${email}/edit?msg=Error adding farmer&type=error`);
      }
    } 
  }
    catch (err) {
      next(err);
  }
});

/*view expense*/
router.get("/seller/:farmer_id/viewExpense", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let Expense = await myDb.getExpense(farmer_id);
    console.log("expense", Expense);
    res.render("./pages/viewExpense", { 
      Expense, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});
/*view Inventory*/
router.get("/seller/:farmer_id/viewInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let Inventory = await myDb.getInventory(farmer_id);
    console.log("->>> Inventory", Inventory);
    res.render("./pages/viewInventory", { 
      Inventory, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:farmer_id/addExpense", async (req, res) => {
  const farmer_id = req.params.farmer_id;
  res.render("./pages/AddExpense", {farmer_id});
});

/*Add expense*/
router.post("/seller/:farmer_id/addExpense", async (req, res, next) => {
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  const category_name = req.body.category_name;
  const date = req.body.date;
  const amount = req.body.amount;
  const farmer_id = req.params.farmer_id;
  try {
    console.log("Inserting for farmer:", farmer_id);
    let updateResult = await myDb.addExpense(farmer_id,category_name, date, amount);
    console.log("➡️ addExpense", updateResult);
    if (updateResult.acknowledged) {
        res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
      } else {
        res.redirect(`/seller/${farmer_id}/addExpense?msg=Error adding expense`);
      }
    } catch (err) {
    next(err);
  }
});

router.get("/seller/:expense_id/editExpense", async (req, res, next) => {
  const expense_id = req.params.expense_id;
  //console.log("👉 expense_id", expense_id);
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    console.log("Expense_id in get editExpense", expense_id);
    let Expense = await myDb.getExpensesByExpenseId(expense_id);
    //console.log("🟢 Expense from get", Expense);
    res.render("./pages/editExpense", { 
      Expense, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});

router.post("/seller/:expense_id/editExpense", async (req, res, next) => {
  const { expense_id, amount, date } = req.body;
  try {

    const UpdateExpense = await myDb.updateExpensesById(expense_id, amount, date);

    const Farmer = await myDb.getFarmerByExpenseId(expense_id);

    const farmer_id = Farmer[0]?.farmer?.farmer_id;

    if (UpdateExpense.acknowledged) {
      res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
    } else {
      res.redirect("/seller/SellerOptions/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:expense_id/deleteExpense", async (req, res, next) => {
  const expense_id = req.params.expense_id;

  try {
    console.log("Expense_Id in DeleteExpense", expense_id);
    
    const farmer = await myDb.getFarmerByExpenseId(expense_id);
    const farmer_id = farmer[0]?.farmer?.farmer_id;

    if (farmer && farmer_id) {
      const deleteResult = await myDb.deleteExpenseById(expense_id);
      console.log("delete", deleteResult);

      if (deleteResult.acknowledged) {
        res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
      } else {
        res.redirect("/references/?msg=Error Deleting");
      }
    } else {
      res.redirect("/references/?msg=Farmer not found");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:harvest_id/deleteInventory", async (req, res, next) => {
  const harvest_id = req.params.harvest_id;
  console.log("➡️ Index.js", harvest_id);
  try {
    const farmer = await myDb.getFarmerByHarvestId(harvest_id);
    const farmer_id = farmer[0]?.farmer?.farmer_id;

    if (farmer && farmer_id) {
      const deleteResult = await myDb.deleteInventoryById(harvest_id);
      console.log("delete", deleteResult);

      if (deleteResult.acknowledged) {
        res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
      } else {
        res.redirect("/references/?msg=Error Deleting");
      }
    } else {
      res.redirect("/references/?msg=Farmer not found");
    }
  } catch (err) {
    next(err);
  }
});


router.get("/seller/:farmer_id/editInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    const Inventory = await myDb.getInventoryByFarmerId(farmer_id);
    console.log("Inventory", Inventory);
    res.render("./pages/editInventory", { 
      Inventory, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});

router.post("/seller/:farmer_id/editInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const { quantity_in_bundles, product_name, date,harvest_id } = req.body;
  //const { product_name, inventory_id, harvest_date, quantity_in_bundles, first_name, last_name, farmer_id, harvest_id } = req.body;
  try {
    console.log("farmer_id in update", harvest_id,quantity_in_bundles, date);
    const UpdateInventory = await myDb.updateInventoryById(harvest_id, quantity_in_bundles, product_name, date);
    console.log("Update", UpdateInventory);
    console.log(farmer_id);
    if (UpdateInventory.acknowledged) {
      res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
    } else {
      res.redirect("/seller/SellerOptions/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

// http://localhost:3000/references?pageSize=24&page=3&q=John
router.get("/references", async (req, res, next) => {
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {

    res.render("./pages/index", {
      query,
      msg,
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
